import { getComponentDef } from "../data/mlComponents";

const DATA_SOURCES = ["ImageLoader", "CSVLoader"];
const LAYER_TYPES = ["Dense", "Conv2D", "MaxPool2D", "Flatten", "Dropout", "ReLU", "Softmax", "Sigmoid"];

export const validatePipeline = (blocks, connections) => {
  const errors = [];

  if (blocks.length === 0) {
    errors.push("Pipeline is empty. Add some blocks to get started.");
    return { valid: false, errors };
  }

  const hasDataSource = blocks.some((b) => DATA_SOURCES.includes(b.type));
  if (!hasDataSource) {
    errors.push("Pipeline needs a data source (Image Loader or CSV Loader).");
  }

  const hasLayer = blocks.some((b) => LAYER_TYPES.includes(b.type));
  if (!hasLayer) {
    errors.push("Pipeline needs at least one layer (Dense, Conv2D, etc.).");
  }

  const hasConcatenate = blocks.some((b) => b.type === "Concatenate");
  const hasInputBlock = blocks.some((b) => b.type === "Input");
  if (hasConcatenate && !hasInputBlock) {
    errors.push("Branching pipelines require an Input block to define the model's input tensor.");
  }

  // Check for disconnected blocks
  for (const block of blocks) {
    const def = getComponentDef(block.type);
    if (!def) continue;
  
    for (const port of def.inputs) {
      const hasPortConnection = connections.some(
        (c) => c.toBlockId === block.id && c.toPort === port.id
      );
      if (!hasPortConnection) {
        errors.push(`"${block.label}" — input port "${port.label}" is not connected.`);
      }
    }
  
    const hasOutputConnection = connections.some((c) => c.fromBlockId === block.id);
    if (def.outputs.length > 0 && !hasOutputConnection && block.type !== "Evaluate") {
      errors.push(`"${block.label}" output is not connected.`);
    }
  }

  return { valid: errors.length === 0, errors };
};

export const topologicalSortFromBlocks = (blocks) => {
  const blockMap = {};
  const inDegree = {};
  const adj = {};

  for (const b of blocks) {
    blockMap[b.id] = b;
    inDegree[b.id] = 0;
    adj[b.id] = [];
  }

  // connectedOutputs is { [portId]: [{ targetBlockId, targetPort }, ...] }
  for (const b of blocks) {
    for (const port of Object.keys(b.connectedOutputs || {})) {
      const targets = b.connectedOutputs[port] || [];
      for (const target of targets) {
        adj[b.id].push(target.targetBlockId);
        inDegree[target.targetBlockId] = (inDegree[target.targetBlockId] || 0) + 1;
      }
    }
  }

  const queue = [];
  for (const id of Object.keys(inDegree)) {
    if (inDegree[id] === 0) queue.push(id);
  }

  const sorted = [];
  while (queue.length > 0) {
    const node = queue.shift();
    sorted.push(blockMap[node]);
    for (const neighbor of adj[node]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }
  return sorted;
};