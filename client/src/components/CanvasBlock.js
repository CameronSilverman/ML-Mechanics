import React from "react";
import { useDrag } from "react-dnd";

const CanvasBlock = ({ block, onContextMenu, isSelected }) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: "CANVAS_BLOCK",
    item: { id: block.id, x: block.x, y: block.y },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  });

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
