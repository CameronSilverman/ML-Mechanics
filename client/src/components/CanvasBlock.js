import React from "react";
import { useDrag } from "react-dnd";
import { getComponentDef } from "../data/mlComponents";

const CanvasBlock = ({ block, onContextMenu, isSelected, onPortMouseDown, onPortMouseUp }) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: "CANVAS_BLOCK",
    item: { id: block.id, x: block.x, y: block.y },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  });

  const def = getComponentDef(block.type);
  const inputs = def?.inputs || [];
  const outputs = def?.outputs || [];
  const propEntries = Object.entries(block.properties);

  return (
    <div
      ref={dragRef}
      className={`canvas-block ${isSelected ? "selected" : ""}`}
      style={{
        left: block.x,
        top: block.y,
        "--block-color": block.color,
        opacity: isDragging ? 0.5 : 1,
      }}
      onContextMenu={(e) => onContextMenu(e, block.id)}
    >
      {/* Input ports */}
      {inputs.map((port, i) => (
        <div
          key={port.id}
          className="port port-input"
          style={{ top: `${16 + i * 20}px` }}
          title={port.label}
          onMouseUp={(e) => {
            e.stopPropagation();
            onPortMouseUp && onPortMouseUp(block.id, port.id);
          }}
        >
          <div className={`port-dot port-type-${port.type}`} />
        </div>
      ))}

      {/* Output ports */}
      {outputs.map((port, i) => (
        <div
          key={port.id}
          className="port port-output"
          style={{ top: `${16 + i * 20}px` }}
          title={port.label}
          onMouseDown={(e) => {
            e.stopPropagation();
            onPortMouseDown && onPortMouseDown(e, block.id, port.id);
          }}
        >
          <div className={`port-dot port-type-${port.type}`} />
        </div>
      ))}

      <div className="canvas-block-header" style={{ backgroundColor: block.color }}>
        <span className="canvas-block-icon">{block.icon}</span>
        <span>{block.label}</span>
      </div>
      {propEntries.length > 0 && (
        <div className="canvas-block-body">
          {propEntries.map(([key, val]) => (
            <div key={key} className="canvas-block-prop">
              <span className="prop-key">{key}</span>
              <span className="prop-val">{String(val)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CanvasBlock;
