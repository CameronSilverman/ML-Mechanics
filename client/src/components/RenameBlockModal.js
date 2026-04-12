import React, { useState } from "react";

const BLOCK_ID_PATTERN = /^block[_-]\d+$/;

const PYTHON_KEYWORDS = new Set([
  "False", "None", "True", "and", "as", "assert", "async", "await",
  "break", "class", "continue", "def", "del", "elif", "else", "except",
  "finally", "for", "from", "global", "if", "import", "in", "is",
  "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try",
  "while", "with", "yield",
]);

export const validateCustomId = (name, customIdSet, currentCustomId = null) => {
  if (!name) return { valid: true };

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    return {
      valid: false,
      error: "Must be a valid Python identifier — letters, digits, and underscores only; cannot start with a digit.",
    };
  }

  // Must not look like a default block ID (block_N or block-N)
  if (BLOCK_ID_PATTERN.test(name)) {
    return {
      valid: false,
      error: 'The format "block_N" is reserved for default component IDs.',
    };
  }

  // Must not be a Python keyword
  if (PYTHON_KEYWORDS.has(name)) {
    return { valid: false, error: `"${name}" is a Python keyword and cannot be used as a variable name.` };
  }

  // Must be unique (skip check when the user hasn't changed the value)
  if (name !== currentCustomId && customIdSet.has(name)) {
    return { valid: false, error: `"${name}" is already used by another component in this project.` };
  }

  return { valid: true };
};

const RenameBlockModal = ({ block, customIdSet, onSave, onClose, inputCount = 1 }) => {
  const [value, setValue] = useState(block.custom_id || "");
  const [submitError, setSubmitError] = useState("");

  const defaultVarName = block.type === "Input" && inputCount === 1
    ? "inputs"
    : block.id.replace(/-/g, "_");

  const trimmed = value.trim();
  const liveValidation = validateCustomId(trimmed, customIdSet, block.custom_id || null);

  const handleChange = (e) => {
    setValue(e.target.value);
    setSubmitError(""); // clear any submit-time error on edit
  };

  const handleSave = () => {
    const result = validateCustomId(trimmed, customIdSet, block.custom_id || null);
    if (!result.valid) {
      setSubmitError(result.error);
      return;
    }
    onSave(block.id, trimmed || null); // null = remove custom_id
    onClose();
  };

  const handleReset = () => {
    onSave(block.id, null);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onClose();
  };

  const displayError = submitError || (!liveValidation.valid && trimmed ? liveValidation.error : "");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <span className="modal-title">Rename Component</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="rename-block-chip">
            <span className="rename-block-dot" style={{ color: block.color }}>●</span>
            <span className="rename-block-label-text">{block.label}</span>
          </div>

          <div className="modal-field">
            <label>
              Variable name
              <span className="rename-field-hint"> — Python identifier</span>
            </label>
            <input
              type="text"
              placeholder={defaultVarName}
              value={value}
              onChange={handleChange}
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
          </div>

          {displayError && (
            <div className="modal-error">{displayError}</div>
          )}

          <div className="rename-current-row">
            <span className="rename-current-label">Current variable:</span>
            <code className="rename-current-value">
              {block.custom_id || defaultVarName}
            </code>
          </div>
        </div>

        <div className="modal-footer rename-modal-footer">
          {block.custom_id && (
            <button
              className="btn-cancel rename-reset-btn"
              onClick={handleReset}
              title="Remove custom name and revert to the default variable name"
            >
              Reset to default
            </button>
          )}

          <div className="rename-footer-right">
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            <button
              className="btn-save"
              onClick={handleSave}
              disabled={!liveValidation.valid}
            >
              Rename
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenameBlockModal;