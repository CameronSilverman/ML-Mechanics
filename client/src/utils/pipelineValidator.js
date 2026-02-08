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

  // Check for disconnected blocks (blocks with ports that have no connections)
  for (const block of blocks) {
    const def = getComponentDef(block.type);
    if (!def) continue;

    const hasInputConnection = connections.some((c) => c.toBlockId === block.id);
    const hasOutputConnection = connections.some((c) => c.fromBlockId === block.id);

    if (def.inputs.length > 0 && !hasInputConnection) {
      errors.push(`"${block.label}" has no input connection.`);
    }
    if (def.outputs.length > 0 && !hasOutputConnection) {
      // Only warn, don't block — terminal blocks are fine
      if (block.type !== "Evaluate") {
        errors.push(`"${block.label}" output is not connected.`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
};

export const topologicalSort = (blocks, connections) => {
  const inDegree = {};
  const adj = {};
  const blockMap = {};

  for (const b of blocks) {
    inDegree[b.id] = 0;
    adj[b.id] = [];
    blockMap[b.id] = b;
  }

  for (const c of connections) {
    adj[c.fromBlockId].push(c.toBlockId);
    inDegree[c.toBlockId] = (inDegree[c.toBlockId] || 0) + 1;
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
