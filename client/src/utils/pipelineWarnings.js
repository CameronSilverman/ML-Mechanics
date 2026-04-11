import { getComponentDef } from "../data/mlComponents";

const SPATIAL_EMITTERS = new Set(["Input", "Conv2D", "MaxPool2D"]);
const FLAT_EMITTERS    = new Set(["Dense", "Flatten", "Reshape"]);
const REQUIRES_SPATIAL = new Set(["Conv2D", "MaxPool2D"]);
const PREFERS_FLAT     = new Set(["Dense"]);

const getOutputShape = (block) => {
  if (SPATIAL_EMITTERS.has(block.type)) return "spatial";
  if (FLAT_EMITTERS.has(block.type))    return "flat";
  return "any";
};

export const checkPipelineWarnings = (blocks, connections, trainingSettings = {}) => {
  const warnings = [];
  let id = 0;
  const push = (level, message) => warnings.push({ id: `w-${id++}`, level, message });

  if (blocks.length === 0) {
    push("info", "Pipeline is empty. Drag components from the sidebar to begin.");
    return warnings;
  }

  // Structural checks

  const hasDataSource = blocks.some((b) =>
    ["ImageLoader", "CSVLoader"].includes(b.type)
  );
  if (!hasDataSource) {
    push("warning", "No data source: add an Image Loader or CSV Loader.");
  }

  const hasInputBlock = blocks.some((b) => b.type === "Input");
  if (!hasInputBlock) {
    push("warning", "No Input block: required to define the model's input tensor.");
  }

  const hasLayer = blocks.some((b) =>
    ["Dense", "Conv2D", "MaxPool2D", "Flatten", "Dropout",
     "Reshape", "ReLU", "Softmax", "Sigmoid"].includes(b.type)
  );
  if (!hasLayer) {
    push("warning", "No layer blocks: add at least one layer (Dense, Conv2D, etc.).");
  }

  const evaluateBlock = blocks.find((b) => b.type === "Evaluate");
  if (evaluateBlock) {
    if (!evaluateBlock.connectedInputs?.in) {
      push("warning", "Evaluate block: connect a model output to its input port.");
    } else {
      push("info", "Evaluate block: will run model.evaluate() on x_test/y_test after training.");
    }
  }
  
  const STANDALONE_ACTS = ["ReLU", "Softmax", "Sigmoid"];
  const standaloneActs  = blocks.filter((b) => STANDALONE_ACTS.includes(b.type));
  if (standaloneActs.length > 0) {
    push(
      "info",
      `Standalone activation block${standaloneActs.length > 1 ? "s" : ""} detected ` +
      `(${standaloneActs.map((b) => b.label).join(", ")}). ` +
      `Consider using the "activation" property on the preceding layer instead.`
    );
  }

  // TrainTestSplit deprecation notice
  const hasTrainTestSplit = blocks.some((b) => b.type === "TrainTestSplit");
  if (hasTrainTestSplit) {
    push(
      "info",
      "Train/Test Split block detected. This block is now handled automatically — " +
      "use the \"Test Split\" field in the Training bar to control the ratio and remove this block."
    );
  }

  // Training settings validation

  const ts = trainingSettings;

  if (ts.learningRate !== undefined && ts.learningRate <= 0) {
    push("error", `Training: learning rate must be positive (got ${ts.learningRate}).`);
  }
  if (ts.epochs !== undefined && (!ts.epochs || ts.epochs < 1)) {
    push("error", `Training: epochs must be at least 1 (got ${ts.epochs}).`);
  }
  if (ts.batchSize !== undefined && (!ts.batchSize || ts.batchSize < 1)) {
    push("error", `Training: batch size must be at least 1 (got ${ts.batchSize}).`);
  }
  if (ts.testSize !== undefined && (ts.testSize <= 0 || ts.testSize >= 1)) {
    push("error", `Training: test split must be between 0 and 1 exclusive (got ${ts.testSize}).`);
  }

  // Block property validation

  for (const block of blocks) {
    const p = block.properties;
    const lbl = block.label;

    switch (block.type) {
      case "Dropout":
        if (p.rate <= 0 || p.rate >= 1) {
          push("error", `"${lbl}": rate must be between 0 and 1 (got ${p.rate}).`);
        }
        break;
      case "Dense":
        if (!p.units || p.units <= 0) {
          push("error", `"${lbl}": units must be a positive integer (got ${p.units}).`);
        }
        break;
      case "Conv2D":
        if (!p.filters || p.filters <= 0) {
          push("error", `"${lbl}": filters must be a positive integer (got ${p.filters}).`);
        }
        if (!p.kernelSize || p.kernelSize <= 0) {
          push("error", `"${lbl}": kernelSize must be a positive integer (got ${p.kernelSize}).`);
        }
        break;
      case "MaxPool2D":
        if (!p.poolSize || p.poolSize <= 0) {
          push("error", `"${lbl}": poolSize must be a positive integer (got ${p.poolSize}).`);
        }
        break;
      case "Reshape":
        if (!p.targetShape || !p.targetShape.trim()) {
          push("error", `"${lbl}": targetShape is required (e.g. "784" or "7,7,128").`);
        }
        break;
      case "CSVLoader":
        if (!p.filePath || p.filePath.trim() === "") {
          push("warning", "CSV Loader: no file path specified.");
        }
        break;
      case "TrainTestSplit":
        if (p.testSize <= 0 || p.testSize >= 1) {
          push("error", `"${lbl}": testSize must be between 0 and 1 exclusive (got ${p.testSize}).`);
        }
        break;
      default:
        break;
    }
  }

  // Connection shape-compatibility checks

  const blockMap = Object.fromEntries(blocks.map((b) => [b.id, b]));

  for (const conn of connections) {
    const fromBlock = blockMap[conn.fromBlockId];
    const toBlock   = blockMap[conn.toBlockId];
    if (!fromBlock || !toBlock) continue;

    const fromShape = getOutputShape(fromBlock);
    const fromLbl   = fromBlock.label;
    const toLbl     = toBlock.label;

    if (REQUIRES_SPATIAL.has(toBlock.type) && fromShape === "flat") {
      push(
        "error",
        `Shape mismatch: "${fromLbl}" produces a flat tensor but "${toLbl}" requires spatial (H×W×C) input.`
      );
    }

    if (PREFERS_FLAT.has(toBlock.type) && SPATIAL_EMITTERS.has(fromBlock.type)) {
      push(
        "warning",
        `"${fromLbl}" → "${toLbl}": consider adding a Flatten layer before Dense when working with spatial data.`
      );
    }
  }

  return warnings;
};