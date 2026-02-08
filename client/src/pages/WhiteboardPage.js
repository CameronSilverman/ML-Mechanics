import React, { useState, useCallback, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Sidebar from "../components/Sidebar";
import Canvas, { setIdCounter } from "../components/Canvas";
import Toolbar from "../components/Toolbar";
import CodeViewerPanel from "../components/CodeViewerPanel";
import TrainingPanel from "../components/TrainingPanel";
import { validatePipeline } from "../utils/pipelineValidator";
import { generateCode } from "../utils/codeGenerator";
import { simulateTraining } from "../utils/trainSimulator";
import { savePipeline, loadPipeline, exportPipeline, getMaxBlockId } from "../utils/storageManager";

const WhiteboardPage = () => {
  const [blocks, setBlocks] = useState([]);
  const [connections, setConnections] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [trainingState, setTrainingState] = useState({
    status: "idle",
    currentEpoch: 0,
    totalEpochs: 0,
    history: null,
    summary: null,
  });
  const [toast, setToast] = useState(null);
  const cancelTrainingRef = useRef(null);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Toolbar actions
  const handleRun = useCallback(() => {
    const validation = validatePipeline(blocks, connections);
    if (!validation.valid) {
      showToast(validation.errors[0], "error");
      return;
    }

    // Find train block to get epochs
    const trainBlock = blocks.find((b) => b.type === "TrainBlock");
    const totalEpochs = trainBlock?.properties?.epochs || 10;

    setTrainingState({
      status: "running",
      currentEpoch: 0,
      totalEpochs,
      history: null,
      summary: null,
    });
    setActivePanel("training");

    const cancel = simulateTraining(
      totalEpochs,
      (data) => {
        setTrainingState((prev) => ({
          ...prev,
          currentEpoch: data.epoch,
          history: data.history,
        }));
      },
      (result) => {
        setTrainingState((prev) => ({
          ...prev,
          status: "complete",
          history: result.history,
          summary: result.summary,
        }));
        showToast("Training complete!", "success");
      }
    );
    cancelTrainingRef.current = cancel;
  }, [blocks, connections, showToast]);

  const handleViewCode = useCallback(() => {
    const code = generateCode(blocks, connections);
    setGeneratedCode(code);
    setActivePanel("code");
  }, [blocks, connections]);

  const handleClear = useCallback(() => {
    if (blocks.length === 0) return;
    setBlocks([]);
    setConnections([]);
    setActivePanel(null);
    if (cancelTrainingRef.current) {
      cancelTrainingRef.current();
      cancelTrainingRef.current = null;
    }
    setTrainingState({
      status: "idle",
      currentEpoch: 0,
      totalEpochs: 0,
      history: null,
      summary: null,
    });
    showToast("Canvas cleared", "info");
  }, [blocks.length, showToast]);

  const handleSave = useCallback(() => {
    const result = savePipeline(blocks, connections);
    if (result.success) {
      showToast("Pipeline saved!", "success");
    } else {
      showToast("Failed to save: " + result.error, "error");
    }
  }, [blocks, connections, showToast]);

  const handleLoad = useCallback(() => {
    const result = loadPipeline();
    if (result.success) {
      setBlocks(result.data.blocks);
      setConnections(result.data.connections);
      setIdCounter(getMaxBlockId(result.data.blocks));
      setActivePanel(null);
      showToast("Pipeline loaded!", "success");
    } else {
      showToast(result.error, "error");
    }
  }, [showToast]);

  const handleExport = useCallback(() => {
    exportPipeline(blocks, connections);
    showToast("Pipeline exported!", "success");
  }, [blocks, connections, showToast]);

  const handleClosePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") return;

      if (e.key === "Escape") {
        setActivePanel(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault();
        handleLoad();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        handleViewCode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, handleLoad, handleViewCode, handleRun]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="whiteboard-page">
        <Sidebar />
        <div className="canvas-wrapper">
          <div className="canvas-toolbar">
            <span className="toolbar-title">ML Maker Studio</span>
            <span className="toolbar-subtitle">Visual ML Pipeline Builder</span>
            <Toolbar
              onRun={handleRun}
              onViewCode={handleViewCode}
              onClear={handleClear}
              onSave={handleSave}
              onLoad={handleLoad}
              onExport={handleExport}
              isTraining={trainingState.status === "running"}
            />
          </div>
          <div className="canvas-area">
            <Canvas
              blocks={blocks}
              setBlocks={setBlocks}
              connections={connections}
              setConnections={setConnections}
              onToast={showToast}
            />
            {activePanel === "code" && (
              <CodeViewerPanel code={generatedCode} onClose={handleClosePanel} />
            )}
            {activePanel === "training" && (
              <TrainingPanel trainingState={trainingState} onClose={handleClosePanel} />
            )}
          </div>
        </div>
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default WhiteboardPage;
