import React, { useState, useCallback, useRef } from "react";
import { useDrop } from "react-dnd";
import CanvasBlock from "./CanvasBlock";
import ContextMenu from "./ContextMenu";
import PropertiesPanel from "./PropertiesPanel";
import ConnectionLayer from "./ConnectionLayer";
import { getComponentDef } from "../data/mlComponents";
import { validateConnection } from "../utils/connectionRules";

let idCounter = 0;
export const setIdCounter = (val) => { idCounter = val; };
export const getIdCounter = () => idCounter;

const Canvas = ({
  blocks,
  setBlocks,
  connections,
  setConnections,
  onToast,
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [editingBlock, setEditingBlock] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [pendingConnection, setPendingConnection] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const canvasRef = useRef(null);

  // Build a blockDefs map for ConnectionLayer
  const blockDefs = {};
  for (const b of blocks) {
    const def = getComponentDef(b.type);
    if (def) blockDefs[b.type] = def;
  }

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
  }, [setBlocks]);

  const moveBlock = useCallback((id, x, y) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, x, y } : b))
    );
  }, [setBlocks]);

  const deleteBlock = useCallback((id) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setConnections((prev) =>
      prev.filter((c) => c.fromBlockId !== id && c.toBlockId !== id)
    );
    setContextMenu(null);
    setSelectedId(null);
  }, [setBlocks, setConnections]);

  const updateProperties = useCallback((id, properties) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, properties } : b))
    );
  }, [setBlocks]);

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

  // Connection interaction handlers
  const handlePortMouseDown = useCallback((e, blockId, portId) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const canvasEl = document.getElementById("canvas");
    const rect = canvasEl.getBoundingClientRect();
    // Approximate port position: output port is on the right side of the block
    const portX = block.x + 170 + 6; // BLOCK_WIDTH + PORT_RADIUS
    const portY = block.y + 16; // HEADER_HEIGHT / 2
    setPendingConnection({ blockId, portId, x: portX, y: portY });
    setMousePos({
      x: e.clientX - rect.left + canvasEl.scrollLeft,
      y: e.clientY - rect.top + canvasEl.scrollTop,
    });
  }, [blocks]);

  const handleCanvasMouseMove = useCallback((e) => {
    if (!pendingConnection) return;
    const canvasEl = document.getElementById("canvas");
    const rect = canvasEl.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left + canvasEl.scrollLeft,
      y: e.clientY - rect.top + canvasEl.scrollTop,
    });
  }, [pendingConnection]);

  const handlePortMouseUp = useCallback((toBlockId, toPortId) => {
    if (!pendingConnection) return;
    const { blockId: fromBlockId, portId: fromPort } = pendingConnection;

    const result = validateConnection(blocks, connections, fromBlockId, fromPort, toBlockId, toPortId);
    if (result.valid) {
      const newConn = {
        id: `conn-${Date.now()}`,
        fromBlockId,
        fromPort,
        toBlockId,
        toPort: toPortId,
      };
      setConnections((prev) => [...prev, newConn]);
    } else {
      onToast && onToast(result.error, "error");
    }

    setPendingConnection(null);
    setMousePos(null);
  }, [pendingConnection, blocks, connections, setConnections, onToast]);

  const handleCanvasMouseUp = useCallback(() => {
    if (pendingConnection) {
      setPendingConnection(null);
      setMousePos(null);
    }
  }, [pendingConnection]);

  const handleDeleteConnection = useCallback((connId) => {
    setConnections((prev) => prev.filter((c) => c.id !== connId));
  }, [setConnections]);

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

  const setRef = useCallback(
    (node) => {
      dropRef(node);
      canvasRef.current = node;
    },
    [dropRef]
  );

  return (
    <div
      id="canvas"
      ref={setRef}
      className="canvas"
      onClick={handleCanvasClick}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
    >
      <ConnectionLayer
        blocks={blocks}
        connections={connections}
        pendingConnection={pendingConnection}
        mousePos={mousePos}
        blockDefs={blockDefs}
        onDeleteConnection={handleDeleteConnection}
      />

      {blocks.length === 0 && !pendingConnection && (
        <div className="canvas-placeholder">
          <div className="canvas-placeholder-icon">⬡</div>
          <div className="canvas-placeholder-text">
            Drag components from the sidebar to start building your ML pipeline
          </div>
        </div>
      )}

      {blocks.map((block) => (
        <CanvasBlock
          key={block.id}
          block={block}
          isSelected={block.id === selectedId}
          onContextMenu={handleContextMenu}
          onPortMouseDown={handlePortMouseDown}
          onPortMouseUp={handlePortMouseUp}
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
