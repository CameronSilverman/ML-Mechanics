import { getComponentDef } from "../data/mlComponents";

const DATA_SOURCES = ["ImageLoader", "CSVLoader"];
const LAYER_TYPES = ["Dense", "Conv2D", "MaxPool2D", "Flatten", "Dropout", "Reshape", "ReLU", "Softmax", "Sigmoid"];

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

  const queue  = [];
  const sorted = [];
  for (const id of Object.keys(inDegree)) {
    if (inDegree[id] === 0) queue.push(id);
  }
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

// Branch-aware topological sort
// Used for grouping layers in generated code
export const branchAwareSort = (blocks) => {
  const blockMap = {};
  const childrenOf = {};
  const parentsOf = {};

  for (const b of blocks) {
    blockMap[b.id] = b;
    childrenOf[b.id] = [];
    parentsOf[b.id] = [];
  }

  // Build adjacency from connectedOutputs - preserves the ordering the user
  // created on the canvas (which output target was added first).
  for (const b of blocks) {
    for (const targets of Object.values(b.connectedOutputs || {})) {
      for (const t of targets) {
        if (blockMap[t.targetBlockId]) {
          childrenOf[b.id].push(t.targetBlockId);
          parentsOf[t.targetBlockId].push(b.id);
        }
      }
    }
  }

  const visited = new Set();
  const groups = [];
  let current = [];

  const flush = () => {
    if (current.length > 0) {
      groups.push(current);
      current = [];
    }
  };

  const canVisit = (id) => parentsOf[id].every((p) => visited.has(p));

  const visit = (id) => {
    if (visited.has(id) || !canVisit(id)) return;

    // Merge point — start a new group so the merged tail is separated
    if (parentsOf[id].length > 1) {
      flush();
    }

    visited.add(id);
    current.push(blockMap[id]);

    const kids = childrenOf[id].filter((k) => !visited.has(k));

    if (kids.length <= 1) {
      // Linear chain or terminal — continue in the same group
      for (const kid of kids) visit(kid);
    } else {
      // Fork point — each child becomes a separate branch group
      flush();
      for (const kid of kids) {
        visit(kid);
        flush();
      }
    }
  };

  // Start from roots (nodes with no parents)
  const roots = blocks.filter((b) => parentsOf[b.id].length === 0);
  for (const root of roots) {
    visit(root.id);
    flush();
  }

  // Safety net: any unvisited nodes (e.g. disconnected cycles)
  for (const b of blocks) {
    if (!visited.has(b.id)) {
      visit(b.id);
      flush();
    }
  }

  return groups;
};