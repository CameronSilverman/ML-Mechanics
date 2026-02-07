import React, { useState, useCallback } from "react";
import { useDrop } from "react-dnd";
import CanvasBlock from "./CanvasBlock";
import ContextMenu from "./ContextMenu";
import PropertiesPanel from "./PropertiesPanel";

let idCounter = 0;

const Canvas = () => {
  const [blocks, setBlocks] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [editingBlock, setEditingBlock] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const addBlock = useCallback((componentDef, x, y) => {
    idCounter++;
    const newBlock = {
      id: `block-${idCounter}`,
      type: componentDef.type,
      label: componentDef.label,
      icon: componentDef.icon,
      color: componentDef.color,
      x,
      y,
      properties: { ...componentDef.defaults },
    };
    setBlocks((prev) => [...prev, newBlock]);
  }, []);

  const moveBlock = useCallback((id, x, y) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, x, y } : b))
    );
  }, []);

  const deleteBlock = useCallback((id) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setContextMenu(null);
    setSelectedId(null);
  }, []);

  const updateProperties = useCallback((id, properties) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, properties } : b))
    );
  }, []);

  const [, dropRef] = useDrop({
    accept: ["ML_BLOCK", "CANVAS_BLOCK"],
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasEl = document.getElementById("canvas");
      const canvasRect = canvasEl.getBoundingClientRect();
      const x = offset.x - canvasRect.left + canvasEl.scrollLeft;
      const y = offset.y - canvasRect.top + canvasEl.scrollTop;

      if (item.componentDef) {
        addBlock(item.componentDef, x - 80, y - 20);
      } else if (item.id) {
        const delta = monitor.getDifferenceFromInitialOffset();
        moveBlock(item.id, item.x + delta.x, item.y + delta.y);
      }
    },
  });

  const handleContextMenu = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);
    setContextMenu({ x: e.clientX, y: e.clientY, blockId: id });
  };

  const handleCanvasClick = () => {
    setSelectedId(null);
    setContextMenu(null);
  };

  return (
    <div id="canvas" ref={dropRef} className="canvas" onClick={handleCanvasClick}>
      {blocks.length === 0 && (
        <div className="canvas-placeholder">
          <div className="canvas-placeholder-icon">⬡</div>
          <div className="canvas-placeholder-text">Drag components from the sidebar to start building your ML pipeline</div>
        </div>
      )}
      {blocks.map((block) => (
        <CanvasBlock
          key={block.id}
          block={block}
          isSelected={block.id === selectedId}
          onContextMenu={handleContextMenu}
        />
      ))}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={() => {
            setEditingBlock(blocks.find((b) => b.id === contextMenu.blockId));
            setContextMenu(null);
          }}
          onDelete={() => deleteBlock(contextMenu.blockId)}
          onClose={() => setContextMenu(null)}
        />
      )}
      {editingBlock && (
        <PropertiesPanel
          block={editingBlock}
          onSave={updateProperties}
          onClose={() => setEditingBlock(null)}
        />
      )}
    </div>
  );
};

export default Canvas;
