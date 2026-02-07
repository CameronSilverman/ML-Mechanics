import React from "react";

const ContextMenu = ({ x, y, onEdit, onDelete, onClose }) => {
  return (
    <>
      <div className="context-overlay" onClick={onClose} />
      <div className="context-menu" style={{ left: x, top: y }}>
        <button className="context-menu-item" onClick={onEdit}>
          <span>✎</span> Edit Properties
        </button>
        <div className="context-divider" />
        <button className="context-menu-item danger" onClick={onDelete}>
          <span>✕</span> Delete
        </button>
      </div>
    </>
  );
};

export default ContextMenu;
