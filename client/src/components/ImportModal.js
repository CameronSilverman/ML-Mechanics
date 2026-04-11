import React, { useState } from "react";

const ImportModal = ({ onImport, onClose }) => {
  const [raw, setRaw]       = useState("");
  const [error, setError]   = useState("");
  const [preview, setPreview] = useState(null);

  const validate = (text) => {
    setError("");
    setPreview(null);
    if (!text.trim()) { setError("Paste your JSON first."); return; }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("Invalid JSON — check for missing commas, brackets, or quotes.");
      return;
    }
    if (!Array.isArray(parsed.blocks)) {
      setError('JSON must contain a "blocks" array.');
      return;
    }
    setPreview({
      name:        parsed.name || "Imported Pipeline",
      blockCount:  parsed.blocks.length,
      connCount:   (parsed.connections || []).length,
      hasSettings: !!parsed.trainingSettings,
      parsed,
    });
  };

  const handleLoad = () => {
    if (!preview) { validate(raw); return; }
    if (!window.confirm("Warning: Importing will clear your current diagram! Continue?")) return;
    onImport(preview.parsed);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel modal-panel-wide"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <span className="modal-title">Import Pipeline</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label>Paste exported JSON</label>
            <textarea
              className="import-textarea"
              placeholder='{"name":"My Pipeline","blocks":[...],"connections":[...],...}'
              value={raw}
              onChange={(e) => { setRaw(e.target.value); setPreview(null); setError(""); }}
              autoFocus
              spellCheck={false}
            />
          </div>

          {error && <div className="modal-error">{error}</div>}

          {preview && (
            <div className="import-preview">
              <div className="import-preview-row">
                <span className="import-preview-label">Name</span>
                <span className="import-preview-val">{preview.name}</span>
              </div>
              <div className="import-preview-row">
                <span className="import-preview-label">Blocks</span>
                <span className="import-preview-val">{preview.blockCount}</span>
              </div>
              <div className="import-preview-row">
                <span className="import-preview-label">Connections</span>
                <span className="import-preview-val">{preview.connCount}</span>
              </div>
              <div className="import-preview-row">
                <span className="import-preview-label">Training settings</span>
                <span className="import-preview-val">{preview.hasSettings ? "✓ included" : "— using defaults"}</span>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          {!preview ? (
            <button className="btn-primary" onClick={() => validate(raw)} disabled={!raw.trim()}>
              Validate →
            </button>
          ) : (
            <button className="btn-save" onClick={handleLoad}>
              Load Pipeline
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;