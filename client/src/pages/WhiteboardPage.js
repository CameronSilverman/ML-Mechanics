import React, { useState, useCallback, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Canvas, { setIdCounter } from "../components/Canvas";
import Toolbar from "../components/Toolbar";
import CodeViewerPanel from "../components/CodeViewerPanel";
import TrainingPanel from "../components/TrainingPanel";
import ErrorLogPanel from "../components/ErrorLogPanel";
import TrainingSettingsPanel, { DEFAULT_TRAINING_SETTINGS } from "../components/TrainingSettingsPanel";
import AuthModal from "../components/AuthModal";
import ProjectsModal from "../components/ProjectsModal";
import SaveModal from "../components/SaveModal";
import { validatePipeline } from "../utils/pipelineValidator";
import { checkPipelineWarnings } from "../utils/pipelineWarnings";
import { generateCode } from "../utils/codeGenerator";
import { simulateTraining } from "../utils/trainSimulator";
import { exportPipeline, getMaxBlockId } from "../utils/storageManager";
import { projectsAPI } from "../api";
import { useAuth } from "../context/AuthContext";

const WhiteboardPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();

  const [blocks, setBlocks] = useState([]);
  const [connections, setConnections] = useState([]);
  const [trainingSettings, setTrainingSettings] = useState(DEFAULT_TRAINING_SETTINGS);
  const [warnings, setWarnings] = useState([]);

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
  const isDirtyRef = useRef(false);

  const [currentProject, setCurrentProject] = useState(null);
  const [authModal, setAuthModal] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);

  useEffect(() => {
    setWarnings(checkPipelineWarnings(blocks, connections, trainingSettings));
  }, [blocks, connections, trainingSettings]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    isDirtyRef.current = true;
  }, [blocks, connections, trainingSettings]);

  // Warn before tab close / reload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleRun = useCallback(() => {
    const validation = validatePipeline(blocks, connections);
    if (!validation.valid) {
      showToast(validation.errors[0], "error");
      return;
    }

    const totalEpochs = trainingSettings.epochs || 10;
    setTrainingState({ status: "running", currentEpoch: 0, totalEpochs, history: null, summary: null });
    setActivePanel("training");

    const cancel = simulateTraining(
      totalEpochs,
      (data) => setTrainingState((prev) => ({ ...prev, currentEpoch: data.epoch, history: data.history })),
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
  }, [blocks, connections, trainingSettings, showToast]);

  const handleViewCode = useCallback(() => {
    setGeneratedCode(generateCode(blocks, trainingSettings));
    setActivePanel("code");
  }, [blocks, trainingSettings]);

  const handleClear = useCallback(() => {
    if (blocks.length === 0) return;
    setBlocks([]);
    setConnections([]);
    setActivePanel(null);
    setCurrentProject(null);
    if (cancelTrainingRef.current) {
      cancelTrainingRef.current();
      cancelTrainingRef.current = null;
    }
    setTrainingState({ status: "idle", currentEpoch: 0, totalEpochs: 0, history: null, summary: null });
    isDirtyRef.current = false;
    showToast("Canvas cleared", "info");
    // Training settings intentionally preserved across clears
  }, [blocks.length, showToast]);

  const doSave = useCallback(async (name) => {
    // trainingSettings is included in the saved data so it's restored with the project
    const canvasData = { blocks, connections, trainingSettings };
    try {
      if (currentProject) {
        const updated = await projectsAPI.update(currentProject.id, name, canvasData, token);
        setCurrentProject({ id: updated.id, name: updated.name });
        showToast(`"${updated.name}" saved`, "success");
      } else {
        const created = await projectsAPI.create(name, canvasData, token);
        setCurrentProject({ id: created.id, name: created.name });
        showToast(`"${created.name}" saved`, "success");
      }
      isDirtyRef.current = false;
      setShowSaveModal(false);
    } catch (err) {
      showToast("Save failed: " + err.message, "error");
    }
  }, [blocks, connections, trainingSettings, currentProject, token, showToast]);

  const handleSave = useCallback(() => {
    if (!isAuthenticated) { setAuthModal("login"); return; }
    if (currentProject) {
      doSave(currentProject.name);
    } else {
      setShowSaveModal(true);
    }
  }, [isAuthenticated, currentProject, doSave]);

  const handleLoad = useCallback(() => {
    if (!isAuthenticated) { setAuthModal("login"); return; }
    setShowProjectsModal(true);
  }, [isAuthenticated]);

  const handleProjectLoaded = useCallback((fullProject) => {
    const { id, name, data } = fullProject;
    const loadedBlocks      = data?.blocks           ?? [];
    const loadedConnections = data?.connections      ?? [];
    const loadedSettings    = data?.trainingSettings ?? DEFAULT_TRAINING_SETTINGS;

    setBlocks(loadedBlocks);
    setConnections(loadedConnections);
    setTrainingSettings(loadedSettings);
    setIdCounter(getMaxBlockId(loadedBlocks));
    setCurrentProject({ id, name });
    setActivePanel(null);

    if (cancelTrainingRef.current) {
      cancelTrainingRef.current();
      cancelTrainingRef.current = null;
    }
    setTrainingState({ status: "idle", currentEpoch: 0, totalEpochs: 0, history: null, summary: null });
    isDirtyRef.current = false;
    showToast(`"${name}" loaded`, "success");
    // warnings recompute automatically via the useEffect
  }, [showToast]);

  const handleExport = useCallback(() => {
    exportPipeline(blocks, connections);
    showToast("Pipeline exported!", "success");
  }, [blocks, connections, showToast]);

  const handleClosePanel = useCallback(() => setActivePanel(null), []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "Escape") setActivePanel(null);
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "o") { e.preventDefault(); handleLoad(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); handleViewCode(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); handleRun(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, handleLoad, handleViewCode, handleRun]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="whiteboard-page">
        <Sidebar />
        <div className="canvas-wrapper">

          {/* Top toolbar */}
          <div className="canvas-toolbar">
            <button 
              className="toolbar-home-btn" 
              onClick={() => {
                if (isDirtyRef.current && !window.confirm("You have unsaved changes. Leave without saving?"))
                  return; 
                navigate("/");}} 
              title="Go to home">
              <span className="toolbar-logo">⬡</span>
              <span className="toolbar-title">ML Maker Studio</span>
            </button>
            <span className="toolbar-subtitle">Visual ML Pipeline Builder</span>
            <Toolbar
              onRun={handleRun}
              onViewCode={handleViewCode}
              onClear={handleClear}
              onSave={handleSave}
              onLoad={handleLoad}
              onExport={handleExport}
              isTraining={trainingState.status === "running"}
              isAuthenticated={isAuthenticated}
              onShowAuth={(mode) => setAuthModal(mode)}
              currentProjectName={currentProject?.name}
            />
          </div>

          {/* Training settings bar */}
          <TrainingSettingsPanel
            settings={trainingSettings}
            onChange={setTrainingSettings}
          />

          {/* Canvas + side panels */}
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

          {/* Diagnostics strip */}
          <ErrorLogPanel warnings={warnings} />

        </div>

        {toast && (
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        )}

        {authModal && (
          <AuthModal mode={authModal} onClose={() => setAuthModal(null)} />
        )}
        {showSaveModal && (
          <SaveModal
            onSave={doSave}
            onClose={() => setShowSaveModal(false)}
            defaultName=""
          />
        )}
        {showProjectsModal && (
          <ProjectsModal
            onLoad={handleProjectLoaded}
            onClose={() => setShowProjectsModal(false)}
          />
        )}
      </div>
    </DndProvider>
  );
};

export default WhiteboardPage;