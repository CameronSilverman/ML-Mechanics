import { topologicalSort } from "./pipelineValidator";

const generateBlockCode = (block, connections) => {
  const p = block.properties;

  switch (block.type) {
    case "ImageLoader":
      return {
        imports: ["import tensorflow as tf"],
        code: [
          `# Load ${p.dataset} dataset`,
          `(x_train, y_train), (x_test, y_test) = tf.keras.datasets.${p.dataset === "CIFAR-10" ? "cifar10" : p.dataset === "MNIST" ? "mnist" : "cifar10"}.load_data()`,
          `x_train, x_test = x_train / 255.0, x_test / 255.0`,
        ],
      };

    case "CSVLoader":
      return {
        imports: ["import pandas as pd", "import numpy as np"],
        code: [
          `# Load CSV data`,
          `df = pd.read_csv("${p.filePath || "data.csv"}", delimiter="${p.delimiter}"${p.hasHeader ? "" : ", header=None"})`,
          `x_data = df.iloc[:, :-1].values`,
          `y_data = df.iloc[:, -1].values`,
        ],
      };

    case "TrainTestSplit":
      return {
        imports: ["from sklearn.model_selection import train_test_split"],
        code: [
          `x_train, x_test, y_train, y_test = train_test_split(x_data, y_data, test_size=${p.testSize}, random_state=${p.randomState})`,
        ],
      };

    case "Dense":
      return {
        imports: [],
        code: [`tf.keras.layers.Dense(${p.units}, activation="${p.activation}"),`],
        isLayer: true,
      };

    case "Conv2D":
      return {
        imports: [],
        code: [
          `tf.keras.layers.Conv2D(${p.filters}, (${p.kernelSize}, ${p.kernelSize}), activation="${p.activation}", padding="${p.padding}"),`,
        ],
        isLayer: true,
      };

    case "MaxPool2D":
      return {
        imports: [],
        code: [`tf.keras.layers.MaxPooling2D((${p.poolSize}, ${p.poolSize})),`],
        isLayer: true,
      };

    case "Flatten":
      return {
        imports: [],
        code: [`tf.keras.layers.Flatten(),`],
        isLayer: true,
      };

    case "Dropout":
      return {
        imports: [],
        code: [`tf.keras.layers.Dropout(${p.rate}),`],
        isLayer: true,
      };

    case "ReLU":
      return {
        imports: [],
        code: [`tf.keras.layers.Activation("relu"),`],
        isLayer: true,
      };

    case "Softmax":
      return {
        imports: [],
        code: [`tf.keras.layers.Activation("softmax"),`],
        isLayer: true,
      };

    case "Sigmoid":
      return {
        imports: [],
        code: [`tf.keras.layers.Activation("sigmoid"),`],
        isLayer: true,
      };

    case "Optimizer":
      return {
        imports: [],
        code: [],
        optimizer: `tf.keras.optimizers.${p.type}(learning_rate=${p.learningRate})`,
      };

    case "LossFunction":
      return {
        imports: [],
        code: [],
        loss: `"${p.type.charAt(0).toLowerCase() + p.type.slice(1)}"`,
      };

    case "TrainBlock": {
      // Find connected optimizer and loss via connections
      const optConn = connections.find(
        (c) => c.toBlockId === block.id && c.toPort === "optimizer"
      );
      const lossConn = connections.find(
        (c) => c.toBlockId === block.id && c.toPort === "loss"
      );
      return {
        imports: [],
        code: [],
        trainConfig: {
          epochs: p.epochs,
          batchSize: p.batchSize,
          optBlockId: optConn?.fromBlockId,
          lossBlockId: lossConn?.fromBlockId,
        },
      };
    }

    case "Evaluate":
      return {
        imports: [],
        code: [
          ``,
          `# Evaluate model`,
          `test_loss, test_acc = model.evaluate(x_test, y_test, verbose=2)`,
          `print(f"Test accuracy: {test_acc:.4f}")`,
          `print(f"Test loss: {test_loss:.4f}")`,
        ],
      };

    default:
      return { imports: [], code: [`# Unknown block: ${block.type}`] };
  }
};

export const generateCode = (blocks, connections) => {
  if (blocks.length === 0) return "# Empty pipeline - add blocks to generate code";

  const sorted = topologicalSort(blocks, connections);
  const allImports = new Set();
  const layers = [];
  const preCode = [];
  const postCode = [];
  let optimizer = `tf.keras.optimizers.Adam(learning_rate=0.001)`;
  let loss = `"sparse_categorical_crossentropy"`;
  let trainConfig = null;
  const blockResults = {};

  allImports.add("import tensorflow as tf");

  for (const block of sorted) {
    const result = generateBlockCode(block, connections);
    blockResults[block.id] = result;

    for (const imp of result.imports) allImports.add(imp);

    if (result.isLayer) {
      layers.push(...result.code);
    } else if (result.optimizer) {
      optimizer = result.optimizer;
    } else if (result.loss) {
      loss = result.loss;
    } else if (result.trainConfig) {
      trainConfig = result.trainConfig;
      // Resolve optimizer and loss from connected blocks
      if (result.trainConfig.optBlockId && blockResults[result.trainConfig.optBlockId]?.optimizer) {
        optimizer = blockResults[result.trainConfig.optBlockId].optimizer;
      }
      if (result.trainConfig.lossBlockId && blockResults[result.trainConfig.lossBlockId]?.loss) {
        loss = blockResults[result.trainConfig.lossBlockId].loss;
      }
    } else if (block.type === "Evaluate") {
      postCode.push(...result.code);
    } else {
      preCode.push(...result.code);
    }
  }

  const lines = [];
  lines.push([...allImports].join("\n"));
  lines.push("");

  if (preCode.length > 0) {
    lines.push(...preCode);
    lines.push("");
  }

  if (layers.length > 0) {
    lines.push("# Build model");
    lines.push("model = tf.keras.Sequential([");
    for (const l of layers) {
      lines.push(`    ${l}`);
    }
    lines.push("])");
    lines.push("");
    lines.push("# Compile model");
    lines.push(`model.compile(`);
    lines.push(`    optimizer=${optimizer},`);
    lines.push(`    loss=${loss},`);
    lines.push(`    metrics=["accuracy"]`);
    lines.push(`)`)
    lines.push("");
  }

  if (trainConfig) {
    lines.push("# Train model");
    lines.push(
      `history = model.fit(x_train, y_train, epochs=${trainConfig.epochs}, batch_size=${trainConfig.batchSize}, validation_split=0.2, verbose=1)`
    );
  }

  if (postCode.length > 0) {
    lines.push(...postCode);
  }

  return lines.join("\n");
};
