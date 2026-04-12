import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDrop } from "react-dnd";
import CanvasBlock from "./CanvasBlock";
import ContextMenu from "./ContextMenu";
import PropertiesPanel from "./PropertiesPanel";
import ConnectionLayer from "./ConnectionLayer";
import RenameBlockModal from "./RenameBlockModal";
import { getComponentDef } from "../data/mlComponents";
import { validateConnection } from "../utils/connectionRules";

let idCounter = 0;
export const setIdCounter = (val) => { idCounter = val; };
export const getIdCounter = () => idCounter;

const PAN_CLICK_THRESHOLD = 4;

/**
 * Canvas
 *
 * Props:
 *   blocks, setBlocks, connections, setConnections, onToast  — existing
 *   customIdSetRef  — React ref wrapping a Set<string> of all taken custom_ids.
 *                     Managed by the parent page (WhiteboardPage / LessonPage).
 *                     Defaults to an inert empty set if omitted.
 */
const Canvas = ({
  blocks,
  setBlocks,
  connections,
  setConnections,
  onToast,
  customIdSetRef = { current: new Set() },
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [editingBlock, setEditingBlock] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [pendingConnection, setPendingConnection] = useState(null);
  const [mousePos, setMousePos] = useState(null);

  // null = modal closed; string = block id whose rename modal is open
  const [renamingBlockId, setRenamingBlockId] = useState(null);

  // Panning state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const panRef = useRef({ x: 0, y: 0 });
  const didPanRef = useRef(false);
  const canvasRef = useRef(null);
  const [panningClass, setPanningClass] = useState(false);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const blockDefs = {};
  for (const b of blocks) {
    const def = getComponentDef(b.type);
    if (def) blockDefs[b.type] = def;
  }

  // Derive the block being renamed from ID so we always have fresh data
  const renamingBlock = renamingBlockId
    ? blocks.find((b) => b.id === renamingBlockId) ?? null
    : null;

  // ── Block operations ──────────────────────────────────────────────────────

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
      connectedOutputs: {},
      connectedInputs: {},
      lockedProperties: [],
    };
    setBlocks((prev) => [...prev, newBlock]);
  }, [setBlocks]);

  const moveBlock = useCallback((id, x, y) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, x, y } : b))
    );
  }, [setBlocks]);

  const deleteBlock = useCallback((id) => {
    // Remove the block's custom_id from the shared set before deletion
    const target = blocks.find((b) => b.id === id);
    if (target?.custom_id) {
      customIdSetRef.current.delete(target.custom_id);
    }

    const affectedConns = connections.filter(
      (c) => c.fromBlockId === id || c.toBlockId === id
    );

    setBlocks((prev) => {
      const remaining = prev.filter((b) => b.id !== id);
      return remaining.map((b) => {
        let updated = { ...b };
        for (const conn of affectedConns) {
          if (conn.fromBlockId === b.id && updated.connectedOutputs[conn.fromPort]) {
            const filtered = updated.connectedOutputs[conn.fromPort].filter(
              (t) => t.targetBlockId !== id
            );
            if (filtered.length === 0) {
              const { [conn.fromPort]: _, ...rest } = updated.connectedOutputs;
              updated = { ...updated, connectedOutputs: rest };
            } else {
              updated = { ...updated, connectedOutputs: { ...updated.connectedOutputs, [conn.fromPort]: filtered } };
            }
          }
          if (conn.toBlockId === b.id) {
            const { [conn.toPort]: _, ...rest } = updated.connectedInputs;
            updated = { ...updated, connectedInputs: rest };
          }
        }
        return updated;
      });
    });

    setConnections((prev) =>
      prev.filter((c) => c.fromBlockId !== id && c.toBlockId !== id)
    );
    setContextMenu(null);
    setSelectedId(null);
  }, [blocks, connections, setBlocks, setConnections, customIdSetRef]);

  const updateProperties = useCallback((id, properties) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, properties } : b))
    );
  }, [setBlocks]);

  // ── Rename handling ───────────────────────────────────────────────────────

  /**
   * handleRename — called by RenameBlockModal on save.
   * @param {string}      blockId      - The block being renamed
   * @param {string|null} newCustomId  - New name, or null to clear/reset
   */
  const handleRename = useCallback((blockId, newCustomId) => {
    // Synchronously update the shared uniqueness set
    const block = blocks.find((b) => b.id === blockId);
    if (block?.custom_id) {
      customIdSetRef.current.delete(block.custom_id);
    }
    if (newCustomId) {
      customIdSetRef.current.add(newCustomId);
    }

    // Update block state
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        if (newCustomId) {
          return { ...b, custom_id: newCustomId };
        }
        // Remove the field entirely when resetting
        const { custom_id, ...rest } = b;
        return rest;
      })
    );
  }, [blocks, setBlocks, customIdSetRef]);

  // ── Drop target ───────────────────────────────────────────────────────────

  const [, dropRef] = useDrop({
    accept: ["ML_BLOCK", "CANVAS_BLOCK"],
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasEl = document.getElementById("canvas");
      const canvasRect = canvasEl.getBoundingClientRect();
      const currentPan = panRef.current;

      if (item.componentDef) {
        const x = offset.x - canvasRect.left - currentPan.x - 80;
        const y = offset.y - canvasRect.top - currentPan.y - 20;
        addBlock(item.componentDef, x, y);
      } else if (item.id) {
        const delta = monitor.getDifferenceFromInitialOffset();
        moveBlock(item.id, item.x + delta.x, item.y + delta.y);
      }
    },
  });

  // ── Panning ───────────────────────────────────────────────────────────────

  const handlePanMove = useCallback((e) => {
    if (!isPanningRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    if (Math.abs(dx) > PAN_CLICK_THRESHOLD || Math.abs(dy) > PAN_CLICK_THRESHOLD) {
      didPanRef.current = true;
    }
    setPan({
      x: panStartRef.current.panX + dx,
      y: panStartRef.current.panY + dy,
    });
  }, []);

  const handlePanUp = useCallback(() => {
    if (!isPanningRef.current) return;
    isPanningRef.current = false;
    setPanningClass(false);
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", handlePanMove);
    window.removeEventListener("mouseup", handlePanUp);
  }, [handlePanMove]);

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handlePanMove);
      window.removeEventListener("mouseup", handlePanUp);
      document.body.style.userSelect = "";
    };
  }, [handlePanMove, handlePanUp]);

  const handleMouseDown = useCallback((e) => {
    if (isPanningRef.current) return;
    if (pendingConnection) return;
    if (e.button !== 0) return;

    const t = e.target;
    const isCanvasBg =
      t.id === "canvas" ||
      t.classList.contains("canvas-world") ||
      t.classList.contains("canvas-placeholder") ||
      t.classList.contains("canvas-placeholder-icon") ||
      t.classList.contains("canvas-placeholder-text") ||
      t.tagName === "svg";

    if (!isCanvasBg) return;

    isPanningRef.current = true;
    setPanningClass(true);
    didPanRef.current = false;
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
    };

    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handlePanMove);
    window.addEventListener("mouseup", handlePanUp);
  }, [pendingConnection, handlePanMove, handlePanUp]);

  // ── Connection handling ───────────────────────────────────────────────────

  const handleCanvasMouseMove = useCallback((e) => {
    if (!pendingConnection) return;
    const canvasEl = document.getElementById("canvas");
    const rect = canvasEl.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left - panRef.current.x,
      y: e.clientY - rect.top - panRef.current.y,
    });
  }, [pendingConnection]);

  const handleCanvasMouseUp = useCallback(() => {
    if (pendingConnection) {
      setPendingConnection(null);
      setMousePos(null);
    }
  }, [pendingConnection]);

  const handlePortMouseDown = useCallback((e, blockId, portId) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const canvasEl = document.getElementById("canvas");
    const rect = canvasEl.getBoundingClientRect();
    const portX = block.x + 170 + 6;
    const portY = block.y + 16;
    setPendingConnection({ blockId, portId, x: portX, y: portY });
    setMousePos({
      x: e.clientX - rect.left - panRef.current.x,
      y: e.clientY - rect.top - panRef.current.y,
    });
  }, [blocks]);

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

      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id === fromBlockId) {
            return {
              ...b,
              connectedOutputs: {
                ...b.connectedOutputs,
                [fromPort]: [
                  ...(b.connectedOutputs[fromPort] || []),
                  { targetBlockId: toBlockId, targetPort: toPortId },
                ],
              },
            };
          }
          if (b.id === toBlockId) {
            return {
              ...b,
              connectedInputs: {
                ...b.connectedInputs,
                [toPortId]: { sourceBlockId: fromBlockId, sourcePort: fromPort },
              },
            };
          }
          return b;
        })
      );
    } else {
      onToast && onToast(result.error, "error");
    }

    setPendingConnection(null);
    setMousePos(null);
  }, [pendingConnection, blocks, connections, setConnections, setBlocks, onToast]);

  const handleDeleteConnection = useCallback((connId) => {
    const conn = connections.find((c) => c.id === connId);
    if (conn) {
      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id === conn.fromBlockId && b.connectedOutputs[conn.fromPort]) {
            const filtered = b.connectedOutputs[conn.fromPort].filter(
              (t) => !(t.targetBlockId === conn.toBlockId && t.targetPort === conn.toPort)
            );
            if (filtered.length === 0) {
              const { [conn.fromPort]: _, ...rest } = b.connectedOutputs;
              return { ...b, connectedOutputs: rest };
            }
            return { ...b, connectedOutputs: { ...b.connectedOutputs, [conn.fromPort]: filtered } };
          }
          if (b.id === conn.toBlockId) {
            const { [conn.toPort]: _, ...rest } = b.connectedInputs;
            return { ...b, connectedInputs: rest };
          }
          return b;
        })
      );
    }
    setConnections((prev) => prev.filter((c) => c.id !== connId));
  }, [setConnections, setBlocks, connections]);

  const handlePortContextMenu = useCallback((blockId, portId, direction) => {
    const matching = connections.filter((c) => {
      if (direction === "output") {
        return c.fromBlockId === blockId && c.fromPort === portId;
      } else {
        return c.toBlockId === blockId && c.toPort === portId;
      }
    });

    if (matching.length === 0) {
      onToast && onToast("No connections on this port", "info");
      return;
    }

    setBlocks((prev) =>
      prev.map((b) => {
        let updated = { ...b };
        for (const conn of matching) {
          if (conn.fromBlockId === updated.id && updated.connectedOutputs[conn.fromPort]) {
            const filtered = updated.connectedOutputs[conn.fromPort].filter(
              (t) => !(t.targetBlockId === conn.toBlockId && t.targetPort === conn.toPort)
            );
            if (filtered.length === 0) {
              const { [conn.fromPort]: _, ...rest } = updated.connectedOutputs;
              updated = { ...updated, connectedOutputs: rest };
            } else {
              updated = { ...updated, connectedOutputs: { ...updated.connectedOutputs, [conn.fromPort]: filtered } };
            }
          }
          if (conn.toBlockId === updated.id) {
            const { [conn.toPort]: _, ...rest } = updated.connectedInputs;
            updated = { ...updated, connectedInputs: rest };
          }
        }
        return updated;
      })
    );

    const idsToRemove = new Set(matching.map((c) => c.id));
    setConnections((prev) => prev.filter((c) => !idsToRemove.has(c.id)));
    onToast && onToast(`Removed ${matching.length} connection${matching.length > 1 ? "s" : ""}`, "info");
  }, [connections, setConnections, setBlocks, onToast]);

  // ── UI event handlers ─────────────────────────────────────────────────────

  const handleContextMenu = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);
    setContextMenu({ x: e.clientX, y: e.clientY, blockId: id });
  };

  const handleCanvasClick = () => {
    if (didPanRef.current) {
      didPanRef.current = false;
      return;
    }
    setSelectedId(null);
    setContextMenu(null);
  };

  const handleRecenter = useCallback((e) => {
    e.stopPropagation();
    if (blocks.length === 0) {
      setPan({ x: 0, y: 0 });
      return;
    }
    const canvasEl = document.getElementById("canvas");
    const rect = canvasEl.getBoundingClientRect();
    const minX = Math.min(...blocks.map((b) => b.x));
    const maxX = Math.max(...blocks.map((b) => b.x + 170));
    const minY = Math.min(...blocks.map((b) => b.y));
    const maxY = Math.max(...blocks.map((b) => b.y + 100));
    setPan({
      x: rect.width / 2 - (minX + maxX) / 2,
      y: rect.height / 2 - (minY + maxY) / 2,
    });
  }, [blocks]);

  const setRef = useCallback(
    (node) => {
      dropRef(node);
      canvasRef.current = node;
    },
    [dropRef]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      id="canvas"
      ref={setRef}
      className={`canvas${panningClass ? " canvas-panning" : ""}`}
      style={{ backgroundPosition: `${pan.x}px ${pan.y}px` }}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
    >
      <div
        className="canvas-world"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
      >
        <ConnectionLayer
          blocks={blocks}
          connections={connections}
          pendingConnection={pendingConnection}
          mousePos={mousePos}
          blockDefs={blockDefs}
          onDeleteConnection={handleDeleteConnection}
        />

        {blocks.map((block) => (
          <CanvasBlock
            key={block.id}
            block={block}
            isSelected={block.id === selectedId}
            onContextMenu={handleContextMenu}
            onPortMouseDown={handlePortMouseDown}
            onPortMouseUp={handlePortMouseUp}
            onPortContextMenu={handlePortContextMenu}
          />
        ))}
      </div>

      {blocks.length === 0 && !pendingConnection && (
        <div className="canvas-placeholder">
          <div className="canvas-placeholder-icon">⬡</div>
          <div className="canvas-placeholder-text">
            Drag components from the sidebar to start building your ML pipeline
          </div>
        </div>
      )}

      {/* Recenter button */}
      <button
        className="recenter-btn"
        onClick={handleRecenter}
        title="Recenter view"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="9" cy="9" r="2" fill="currentColor" />
          <line x1="9" y1="0.5" x2="9" y2="4" stroke="currentColor" strokeWidth="1.5" />
          <line x1="9" y1="14" x2="9" y2="17.5" stroke="currentColor" strokeWidth="1.5" />
          <line x1="0.5" y1="9" x2="4" y2="9" stroke="currentColor" strokeWidth="1.5" />
          <line x1="14" y1="9" x2="17.5" y2="9" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={() => {
            setEditingBlock(blocks.find((b) => b.id === contextMenu.blockId));
            setContextMenu(null);
          }}
          onRename={() => {
            setRenamingBlockId(contextMenu.blockId);
            setContextMenu(null);
          }}
          onDelete={() => deleteBlock(contextMenu.blockId)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Properties panel */}
      {editingBlock && (
        <PropertiesPanel
          block={editingBlock}
          onSave={updateProperties}
          onClose={() => setEditingBlock(null)}
          lockedProperties={editingBlock.lockedProperties || []}
        />
      )}

      {/* Rename modal */}
      {renamingBlock && (
        <RenameBlockModal
          block={renamingBlock}
          customIdSet={customIdSetRef.current}
          inputCount={blocks.filter((b) => b.type === "Input").length}
          onSave={handleRename}
          onClose={() => setRenamingBlockId(null)}
        />
      )}
    </div>
  );
};

export default Canvas;