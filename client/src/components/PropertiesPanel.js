import React, { useState, useEffect } from "react";

const PropertiesPanel = ({ block, onSave, onClose }) => {
  const [properties, setProperties] = useState({});

  useEffect(() => {
    if (block) setProperties({ ...block.properties });
  }, [block]);

  if (!block) return null;

  const handleChange = (key, value) => {
    setProperties((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(block.id, properties);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onClose();
  };

  const entries = Object.entries(properties);

  return (
    <div className="properties-overlay" onClick={onClose}>
      <div className="properties-panel" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="properties-header">
          <div className="properties-title">
            <span className="properties-dot" style={{ color: block.color }}>●</span>
            {block.label}
          </div>
          <button className="properties-close" onClick={onClose}>✕</button>
        </div>
        <div className="properties-body">
          {entries.length === 0 && (
            <p className="properties-empty">No configurable properties.</p>
          )}
          {entries.map(([key, val]) => (
            <div key={key} className="properties-field">
              <label>{key}</label>
              {typeof val === "boolean" ? (
                <select
                  value={String(val)}
                  onChange={(e) => handleChange(key, e.target.value === "true")}
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : typeof val === "number" ? (
                <input
                  type="number"
                  value={val}
                  step={val < 1 ? 0.001 : 1}
                  onChange={(e) => handleChange(key, parseFloat(e.target.value) || 0)}
                />
              ) : (
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleChange(key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        <div className="properties-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
