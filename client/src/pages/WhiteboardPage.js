import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Sidebar from "../components/Sidebar";
import Canvas from "../components/Canvas";

const WhiteboardPage = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="whiteboard-page">
        <Sidebar />
        <div className="canvas-wrapper">
          <div className="canvas-toolbar">
            <span className="toolbar-title">ML Maker Studio</span>
            <span className="toolbar-subtitle">Visual ML Pipeline Builder</span>
          </div>
          <Canvas />
        </div>
      </div>
    </DndProvider>
  );
};

export default WhiteboardPage;
