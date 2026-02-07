import React, { useState } from "react";
import { useDrag } from "react-dnd";
import ML_COMPONENTS from "../data/mlComponents";

const CATEGORY_ICONS = {
  Data: "◈",
  Layers: "◧",
  Activation: "⚡",
  Training: "▶",
  Output: "◉",
};

const DraggableBlock = ({ component }) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: "ML_BLOCK",
    item: { componentDef: component },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  });

  return (
    <div
      ref={dragRef}
      className="sidebar-block"
      style={{
        "--block-color": component.color,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <span className="sidebar-block-icon">{component.icon}</span>
      <div className="sidebar-block-text">
        <span className="sidebar-block-label">{component.label}</span>
        <span className="sidebar-block-type">{component.type}</span>
      </div>
    </div>
  );
};

const Sidebar = () => {
  const [openCategory, setOpenCategory] = useState("Layers");

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">⬡</span>
        <span>Components</span>
      </div>
      {Object.entries(ML_COMPONENTS).map(([category, components]) => (
        <div key={category} className="sidebar-category">
          <button
            className={`sidebar-category-btn ${openCategory === category ? "active" : ""}`}
            onClick={() => setOpenCategory(openCategory === category ? null : category)}
          >
            <span className="category-icon">{CATEGORY_ICONS[category]}</span>
            <span>{category}</span>
            <span className="sidebar-chevron">
              {openCategory === category ? "▾" : "▸"}
            </span>
          </button>
          {openCategory === category && (
            <div className="sidebar-category-items">
              {components.map((comp) => (
                <DraggableBlock key={comp.type} component={comp} />
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="sidebar-footer">
        <span className="sidebar-hint">Drag blocks to canvas</span>
      </div>
    </div>
  );
};

export default Sidebar;
