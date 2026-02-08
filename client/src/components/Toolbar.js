import React from "react";

const Toolbar = ({ onRun, onViewCode, onClear, onSave, onLoad, onExport, isTraining }) => {
  return (
    <div className="toolbar-actions">
      <button
        className="toolbar-btn toolbar-btn-primary"
        onClick={onRun}
        disabled={isTraining}
        title="Run pipeline (Ctrl+Enter)"
      >
        <span>{isTraining ? "⏳" : "▶"}</span>
        <span>{isTraining ? "Training..." : "Run"}</span>
      </button>
      <button className="toolbar-btn" onClick={onViewCode} title="View generated code (Ctrl+K)">
        <span>{"</>"}</span>
        <span>Code</span>
      </button>
      <div className="toolbar-divider" />
      <button className="toolbar-btn" onClick={onSave} title="Save pipeline (Ctrl+S)">
        <span>💾</span>
        <span>Save</span>
      </button>
      <button className="toolbar-btn" onClick={onLoad} title="Load pipeline (Ctrl+O)">
        <span>📂</span>
        <span>Load</span>
      </button>
      <button className="toolbar-btn" onClick={onExport} title="Export as JSON">
        <span>📤</span>
        <span>Export</span>
      </button>
      <div className="toolbar-divider" />
      <button className="toolbar-btn toolbar-btn-danger" onClick={onClear} title="Clear canvas">
        <span>🗑</span>
        <span>Clear</span>
      </button>
    </div>
  );
};

export default Toolbar;
