import React, { useState } from "react";

const LEVEL_ICON = { error: "✕", warning: "⚠", info: "ℹ" };

const ErrorLogPanel = ({ warnings }) => {
  const [minimized, setMinimized] = useState(false);

  const errorCount = warnings.filter((w) => w.level === "error").length;
  const warnCount  = warnings.filter((w) => w.level === "warning").length;
  const infoCount  = warnings.filter((w) => w.level === "info").length;

  return (
    <div className={`error-log-panel${minimized ? " error-log-minimized" : ""}`}>
      {/* Header — always visible, click to toggle */}
      <div className="error-log-header" onClick={() => setMinimized((v) => !v)}>
        <span className="error-log-title">
          <span className="error-log-heading-icon">◈</span>
          Pipeline Diagnostics
        </span>

        <div className="error-log-badges">
          {errorCount > 0 && (
            <span className="error-badge error-badge-error">
              {errorCount} error{errorCount !== 1 ? "s" : ""}
            </span>
          )}
          {warnCount > 0 && (
            <span className="error-badge error-badge-warning">
              {warnCount} warning{warnCount !== 1 ? "s" : ""}
            </span>
          )}
          {infoCount > 0 && (
            <span className="error-badge error-badge-info">
              {infoCount} notice{infoCount !== 1 ? "s" : ""}
            </span>
          )}
          {warnings.length === 0 && (
            <span className="error-badge error-badge-ok">✓ All clear</span>
          )}
        </div>

        <button
          className="error-log-toggle"
          onClick={(e) => { e.stopPropagation(); setMinimized((v) => !v); }}
          title={minimized ? "Expand diagnostics" : "Collapse diagnostics"}
        >
          {minimized ? "▲" : "▼"}
        </button>
      </div>

      {/* Body — scrollable list, hidden when minimized */}
      {!minimized && (
        <div className="error-log-body">
          {warnings.length === 0 ? (
            <div className="error-log-empty">
              No issues detected — pipeline looks good.
            </div>
          ) : (
            warnings.map((w) => (
              <div
                key={w.id}
                className={`error-log-item error-log-item-${w.level}`}
              >
                <span className="error-log-level-icon">
                  {LEVEL_ICON[w.level]}
                </span>
                <span className="error-log-message">{w.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorLogPanel;
