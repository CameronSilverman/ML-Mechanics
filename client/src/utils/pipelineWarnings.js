import { getComponentDef } from "../data/mlComponents";

// Types that emit spatial (H×W×C) tensors
const SPATIAL_EMITTERS = new Set(["Input", "Conv2D", "MaxPool2D"]);
// Types that emit flat (1-D) tensors
const FLAT_EMITTERS = new Set(["Dense", "Flatten"]);
// Types that require spatial input to work
const REQUIRES_SPATIAL = new Set(["Conv2D", "MaxPool2D"]);
// Types that should receive flat input in a standard pipeline
const PREFERS_FLAT = new Set(["Dense"]);

const getOutputShape = (block) => {
  if (SPATIAL_EMITTERS.has(block.type)) return "spatial";
  if (FLAT_EMITTERS.has(block.type)) return "flat";
  return "any"; // pass-through (Dropout, Activation layers)
};

export const checkPipelineWarnings = (blocks, connections) => {
  const warnings = [];
  let id = 0;
  const push = (level, message) => warnings.push({ id: `w-${id++}`, level, message });

  // Empty pipeline

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
     "ReLU", "Softmax", "Sigmoid"].includes(b.type)
  );
  if (!hasLayer) {
    push("warning", "No layer blocks: add at least one layer (Dense, Conv2D, etc.).");
  }

  const trainBlock = blocks.find((b) => b.type === "TrainBlock");
  if (!trainBlock) {
    push("info", "No Train block: add one to configure training parameters.");
  } else {
    if (!trainBlock.connectedInputs?.optimizer) {
      push("warning", "Train block: Optimizer not connected.");
    }
    if (!trainBlock.connectedInputs?.loss) {
      push("warning", "Train block: Loss Function not connected.");
    }
    if (!trainBlock.connectedInputs?.data) {
      push("warning", "Train block: no model output is connected to its input.");
    }
  }

  const evaluateBlock = blocks.find((b) => b.type === "Evaluate");
  if (evaluateBlock && !evaluateBlock.connectedInputs?.in) {
    push("warning", "Evaluate block: no model output connected to its input port.");
  }

  // Property validation

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

      case "TrainBlock":
        if (!p.epochs || p.epochs <= 0) {
          push("error", `"${lbl}": epochs must be a positive integer (got ${p.epochs}).`);
        }
        if (!p.batchSize || p.batchSize <= 0) {
          push("error", `"${lbl}": batchSize must be a positive integer (got ${p.batchSize}).`);
        }
        break;

      case "Optimizer":
        if (!p.learningRate || p.learningRate <= 0) {
          push("error", `"${lbl}": learning rate must be positive (got ${p.learningRate}).`);
        }
        break;

      case "CSVLoader":
        if (!p.filePath || p.filePath.trim() === "") {
          push("warning", "CSV Loader: no file path specified.");
        }
        break;

      case "TrainTestSplit":
        if (p.testSize <= 0 || p.testSize >= 1) {
          push(
            "error",
            `"${lbl}": testSize must be between 0 and 1 exclusive (got ${p.testSize}).`
          );
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

    // Conv2D / MaxPool2D receiving a flat tensor
    if (REQUIRES_SPATIAL.has(toBlock.type) && fromShape === "flat") {
      push(
        "error",
        `Shape mismatch: "${fromLbl}" produces a flat tensor but "${toLbl}" requires spatial (HxWxC) input.`
      );
    }

    // Dense directly connected to a spatial emitter (missing Flatten)
    if (PREFERS_FLAT.has(toBlock.type) && SPATIAL_EMITTERS.has(fromBlock.type)) {
      push(
        "warning",
        `"${fromLbl}" → "${toLbl}": consider adding a Flatten layer before Dense when working with spatial data.`
      );
    }
  }

  return warnings;
};
