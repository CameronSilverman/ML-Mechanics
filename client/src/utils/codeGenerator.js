import { topologicalSortFromBlocks } from "./pipelineValidator";

const safeVar = (id) => id.replace(/-/g, "_");

const toSnakeCase = (s) =>
  s.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();

const parseMetrics = (raw) =>
  (raw || "accuracy")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

export const generateCode = (blocks) => {
  if (blocks.length === 0) return "# Empty pipeline — add blocks to generate code";

  const sorted = topologicalSortFromBlocks(blocks);
  const imports = new Set([
    "import tensorflow as tf",
    "from tensorflow.keras import layers, models",
  ]);

  const blockVars = {};

  const preLines = [];
  const modelLines = [];
  const postLines = [];

  let inputVar = null;
  let outputVar = null;
  let optimizerStr = '"adam"';
  let lossStr = '"sparse_categorical_crossentropy"';
  let trainConfig = null;

  let compileMetrics = ["accuracy"];

  let defaultBatchSize = 32;

  const getInputVar = (block, portId = "in") => {
    const conn = block.connectedInputs?.[portId];
    return conn ? blockVars[conn.sourceBlockId] : null;
  };

  for (const block of sorted) {
    const p = block.properties;
    const v = safeVar(block.id);

    switch (block.type) {

      // Data

      case "ImageLoader": {
        const dsMap = { "CIFAR-10": "cifar10", MNIST: "mnist" };
        const ds = dsMap[p.dataset] || "cifar10";

        defaultBatchSize = p.batchSize ?? 32;

        preLines.push(
          `# Load ${p.dataset}`,
          `(x_train, y_train), (x_test, y_test) = tf.keras.datasets.${ds}.load_data()`,
          `x_train = x_train.astype("float32") / 255.0`,
          `x_test  = x_test.astype("float32")  / 255.0`,
        );

        // MNIST has no channel dim - add it so Conv2D works out of the box
        if (p.dataset === "MNIST") {
          preLines.push(
            `x_train = x_train[..., tf.newaxis]`,
            `x_test  = x_test[..., tf.newaxis]`,
          );
        }

        // Shuffle training data when true
        if (p.shuffle) {
          imports.add("import numpy as np");
          preLines.push(
            ``,
            `# Shuffle training data`,
            `_perm = np.random.permutation(len(x_train))`,
            `x_train, y_train = x_train[_perm], y_train[_perm]`,
          );
        }
        break;
      }

      case "CSVLoader": {
        imports.add("import pandas as pd");
        preLines.push(
          `df = pd.read_csv(` +
            `"${p.filePath || "data.csv"}", ` +
            `delimiter="${p.delimiter}"` +
            `${p.hasHeader ? "" : ", header=None"}` +
          `)`,
          `x_data = df.iloc[:, :-1].values`,
          `y_data = df.iloc[:, -1].values`,
        );
        break;
      }

      case "TrainTestSplit": {
        imports.add("from sklearn.model_selection import train_test_split");
        preLines.push(
          `x_train, x_test, y_train, y_test = train_test_split(` +
            `x_data, y_data, ` +
            `test_size=${p.testSize}, ` +
            `random_state=${p.randomState}` +
          `)`,
        );
        break;
      }

      // Structure 

      case "Input": {
        modelLines.push(`inputs = layers.Input(shape=(${p.shape || "28,28,1"}))`);
        blockVars[block.id] = "inputs";
        inputVar = "inputs";
        break;
      }

      case "Concatenate": {
        modelLines.push(
          `${v} = layers.Concatenate(axis=${p.axis ?? -1})` +
            `([${getInputVar(block, "in1")}, ${getInputVar(block, "in2")}])`,
        );
        blockVars[block.id] = v;
        outputVar = v;
        break;
      }

      // Layers

      case "Dense": {
        modelLines.push(
          `${v} = layers.Dense(${p.units}, activation="${p.activation}")(${getInputVar(block)})`,
        );
        blockVars[block.id] = v;
        outputVar = v;
        break;
      }

      case "Conv2D": {
        modelLines.push(
          `${v} = layers.Conv2D(` +
            `${p.filters}, ` +
            `(${p.kernelSize}, ${p.kernelSize}), ` +
            `activation="${p.activation}", ` +
            `padding="${p.padding}"` +
          `)(${getInputVar(block)})`,
        );
        blockVars[block.id] = v;
        outputVar = v;
        break;
      }

      case "MaxPool2D": {
        modelLines.push(
          `${v} = layers.MaxPooling2D((${p.poolSize}, ${p.poolSize}))(${getInputVar(block)})`,
        );
        blockVars[block.id] = v;
        outputVar = v;
        break;
      }

      case "Flatten": {
        modelLines.push(`${v} = layers.Flatten()(${getInputVar(block)})`);
        blockVars[block.id] = v;
        outputVar = v;
        break;
      }

      case "Dropout": {
        modelLines.push(`${v} = layers.Dropout(${p.rate})(${getInputVar(block)})`);
        blockVars[block.id] = v;
        outputVar = v;
        break;
      }

      // Activations

      case "ReLU":
      case "Softmax":
      case "Sigmoid": {
        modelLines.push(
          `${v} = layers.Activation("${block.type.toLowerCase()}")(${getInputVar(block)})`,
        );
        blockVars[block.id] = v;
        outputVar = v;
        break;
      }

      // Training config

      case "Optimizer": {
        blockVars[block.id] = "__optimizer__";
        break;
      }

      case "LossFunction": {
        blockVars[block.id] = "__loss__";
        break;
      }

      case "TrainBlock": {
        trainConfig = { epochs: p.epochs, batchSize: p.batchSize ?? defaultBatchSize };

        const optConn = block.connectedInputs?.optimizer;
        if (optConn) {
          const optBlock = blocks.find((b) => b.id === optConn.sourceBlockId);
          if (optBlock) {
            optimizerStr =
              `tf.keras.optimizers.${optBlock.properties.type}` +
              `(learning_rate=${optBlock.properties.learningRate})`;
          }
        }

        const lossConn = block.connectedInputs?.loss;
        if (lossConn) {
          const lossBlock = blocks.find((b) => b.id === lossConn.sourceBlockId);
          if (lossBlock) {
            lossStr = `"${toSnakeCase(lossBlock.properties.type)}"`;
          }
        }

        const dataConn = block.connectedInputs?.data;
        if (dataConn && blockVars[dataConn.sourceBlockId]) {
          outputVar = blockVars[dataConn.sourceBlockId];
        }
        break;
      }

      // Output

      case "Evaluate": {
        compileMetrics = parseMetrics(p.metrics);

        const resultVars = [
          "test_loss",
          ...compileMetrics.map((m) => `test_${toSnakeCase(m).replace(/[^a-z0-9_]/g, "_")}`),
        ];

        postLines.push(
          ``,
          `# Evaluate`,
          `${resultVars.join(", ")} = model.evaluate(x_test, y_test, verbose=2)`,
          `print(f"Test loss:     {test_loss:.4f}")`,
          ...compileMetrics.map((m, i) => {
            const varName = resultVars[i + 1];
            return `print(f"Test ${m}:${" ".repeat(Math.max(1, 9 - m.length))}{${varName}:.4f}")`;
          }),
        );
        break;
      }

      default:
        modelLines.push(`# Unknown block: ${block.type}`);
    }
  }

  // Build Functional API model

  if (inputVar && outputVar) {
    modelLines.push(
      ``,
      `# Build model`,
      `model = models.Model(inputs=${inputVar}, outputs=${outputVar})`,
    );
  }

  // Compile

  const metricsListStr = compileMetrics.map((m) => `"${m}"`).join(", ");
  modelLines.push(
    ``,
    `# Compile`,
    `model.compile(`,
    `    optimizer=${optimizerStr},`,
    `    loss=${lossStr},`,
    `    metrics=[${metricsListStr}]`,
    `)`,
  );

  // Train

  if (trainConfig) {
    modelLines.push(
      ``,
      `# Train`,
      `model.fit(`,
      `    x_train, y_train,`,
      `    epochs=${trainConfig.epochs},`,
      `    batch_size=${trainConfig.batchSize},`,
      `    validation_split=0.2,`,
      `    verbose=1`,
      `)`,
    );
  }

  // Out 
  
  return [
    [...imports].join("\n"),
    "",
    ...preLines,
    "",
    "# Model definition",
    ...modelLines,
    ...postLines,
  ].join("\n");
};