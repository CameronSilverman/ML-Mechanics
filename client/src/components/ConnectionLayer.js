import React from "react";

const BLOCK_WIDTH = 170;
const HEADER_HEIGHT = 32;
const PORT_RADIUS = 6;

const getPortPosition = (block, portId, direction, blockDef) => {
  if (!blockDef) return { x: block.x, y: block.y };

  const ports = direction === "input" ? blockDef.inputs : blockDef.outputs;
  const idx = ports.findIndex((p) => p.id === portId);
  const total = ports.length;

  if (direction === "input") {
    // Input ports on the left edge
    const spacing = HEADER_HEIGHT + 20;
    const startY = block.y + HEADER_HEIGHT / 2;
    const y = total === 1 ? startY : startY + idx * spacing / total;
    return { x: block.x - PORT_RADIUS, y };
  } else {
    // Output ports on the right edge
    return { x: block.x + BLOCK_WIDTH + PORT_RADIUS, y: block.y + HEADER_HEIGHT / 2 };
  }
};

const BezierWire = ({ x1, y1, x2, y2, color, dashed, onClick }) => {
  const dx = Math.abs(x2 - x1) * 0.5;
  const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

  return (
    <g onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      {/* Invisible wider hit area */}
      {onClick && (
        <path d={d} fill="none" stroke="transparent" strokeWidth={12} />
      )}
      <path
        d={d}
        fill="none"
        stroke={color || "#3b82f6"}
        strokeWidth={2}
        strokeDasharray={dashed ? "6,4" : "none"}
        opacity={dashed ? 0.6 : 0.8}
        className="connection-wire"
      />
    </g>
  );
};

const ConnectionLayer = ({
  blocks,
  connections,
  pendingConnection,
  mousePos,
  blockDefs,
  onDeleteConnection,
}) => {
  const getBlockDef = (blockId) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return null;
    return blockDefs[block.type] || null;
  };

  return (
    <svg className="connection-layer">
      {/* Render established connections */}
      {connections.map((conn) => {
        const fromBlock = blocks.find((b) => b.id === conn.fromBlockId);
        const toBlock = blocks.find((b) => b.id === conn.toBlockId);
        if (!fromBlock || !toBlock) return null;

        const fromDef = getBlockDef(conn.fromBlockId);
        const toDef = getBlockDef(conn.toBlockId);
        const from = getPortPosition(fromBlock, conn.fromPort, "output", fromDef);
        const to = getPortPosition(toBlock, conn.toPort, "input", toDef);

        return (
          <BezierWire
            key={conn.id}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            color="#3b82f6"
            onClick={() => onDeleteConnection(conn.id)}
          />
        );
      })}

      {/* Render pending connection (dragging) */}
      {pendingConnection && mousePos && (
        <BezierWire
          x1={pendingConnection.x}
          y1={pendingConnection.y}
          x2={mousePos.x}
          y2={mousePos.y}
          color="#60a5fa"
          dashed
        />
      )}
    </svg>
  );
};

export { getPortPosition, BLOCK_WIDTH, HEADER_HEIGHT, PORT_RADIUS };
export default ConnectionLayer;
