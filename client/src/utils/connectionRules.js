import { getComponentDef } from "../data/mlComponents";

export const getPortDef = (block, portId, direction) => {
  const def = getComponentDef(block.type);
  if (!def) return null;
  const ports = direction === "input" ? def.inputs : def.outputs;
  return ports.find((p) => p.id === portId) || null;
};

export const arePortsCompatible = (fromBlock, fromPortId, toBlock, toPortId) => {
  const fromPort = getPortDef(fromBlock, fromPortId, "output");
  const toPort = getPortDef(toBlock, toPortId, "input");
  if (!fromPort || !toPort) return false;
  return fromPort.type === toPort.type;
};

export const isInputOccupied = (connections, toBlockId, toPortId) => {
  return connections.some(
    (c) => c.toBlockId === toBlockId && c.toPort === toPortId
  );
};

export const isDuplicateConnection = (connections, fromBlockId, fromPort, toBlockId, toPort) => {
  return connections.some(
    (c) =>
      c.fromBlockId === fromBlockId &&
      c.fromPort === fromPort &&
      c.toBlockId === toBlockId &&
      c.toPort === toPort
  );
};

export const wouldCreateCycle = (connections, fromBlockId, toBlockId) => {
  if (fromBlockId === toBlockId) return true;
  const adj = {};
  for (const c of connections) {
    if (!adj[c.fromBlockId]) adj[c.fromBlockId] = [];
    adj[c.fromBlockId].push(c.toBlockId);
  }
  if (!adj[toBlockId]) adj[toBlockId] = [];
  adj[toBlockId].push(fromBlockId);

  const visited = new Set();
  const stack = [toBlockId];
  while (stack.length > 0) {
    const node = stack.pop();
    if (visited.has(node)) continue;
    visited.add(node);
    const neighbors = adj[node] || [];
    for (const n of neighbors) {
      if (n === toBlockId && visited.size > 1) return true;
      stack.push(n);
    }
  }
  return false;
};

export const validateConnection = (blocks, connections, fromBlockId, fromPort, toBlockId, toPort) => {
  const fromBlock = blocks.find((b) => b.id === fromBlockId);
  const toBlock = blocks.find((b) => b.id === toBlockId);
  if (!fromBlock || !toBlock) return { valid: false, error: "Block not found" };
  if (fromBlockId === toBlockId) return { valid: false, error: "Cannot connect block to itself" };
  if (!arePortsCompatible(fromBlock, fromPort, toBlock, toPort)) {
    return { valid: false, error: "Incompatible port types" };
  }
  if (isInputOccupied(connections, toBlockId, toPort)) {
    return { valid: false, error: "Input port already connected" };
  }
  if (isDuplicateConnection(connections, fromBlockId, fromPort, toBlockId, toPort)) {
    return { valid: false, error: "Connection already exists" };
  }
  if (wouldCreateCycle(connections, fromBlockId, toBlockId)) {
    return { valid: false, error: "Would create a cycle" };
  }
  return { valid: true, error: null };
};
