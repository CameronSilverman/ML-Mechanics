import React, { useState, useCallback, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useNavigate, useLocation } from "react-router-dom";
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
import ImportModal from "../components/ImportModal";
import { validatePipeline } from "../utils/pipelineValidator";
import { checkPipelineWarnings } from "../utils/pipelineWarnings";
import { generateCode } from "../utils/codeGenerator";
import { simulateTraining } from "../utils/trainSimulator";
import { exportPipeline, getMaxBlockId, stripBlockMeta, hydrateBlocks } from "../utils/storageManager";
import { projectsAPI } from "../api";
import { useAuth } from "../context/AuthContext";

const WhiteboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, token } = useAuth();

  const [blocks, setBlocks] = useState([]);
  const [connections, setConnections] = useState([]);
  const [trainingSettings, setTrainingSettings] = useState(DEFAULT_TRAINING_SETTINGS);
  const [warnings, setWarnings] = useState([]);

  const [activePanel, setActivePanel] = useState(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [trainingState, setTrainingState] = useState({
    status: "idle", currentEpoch: 0, totalEpochs: 0, history: null, summary: null,
  });
  const [toast, setToast] = useState(null);
  const cancelTrainingRef = useRef(null);
  const isDirtyRef = useRef(false);

  const [currentProject, setCurrentProject] = useState(null);
  const [authModal, setAuthModal] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const lessonImportRef = useRef(location.state?.lessonImport ?? null);

  useEffect(() => {
    setWarnings(checkPipelineWarnings(blocks, connections, trainingSettings));
  }, [blocks, connections, trainingSettings]);

  const isFirstRender = useRef(true);
  const suppressDirtyRef = useRef(false);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (suppressDirtyRef.current) { suppressDirtyRef.current = false; return; }
    isDirtyRef.current = true;
  }, [blocks, connections, trainingSettings]);

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

  useEffect(() => {
    const imp = lessonImportRef.current;
    if (!imp) return;
    lessonImportRef.current = null; // prevent double-run in StrictMode

    const importBlocks = hydrateBlocks(imp.blocks ?? []);
    setBlocks(importBlocks);
    setConnections(imp.connections ?? []);
    setTrainingSettings({ ...DEFAULT_TRAINING_SETTINGS, ...(imp.trainingSettings ?? {}) });
    setIdCounter(getMaxBlockId(importBlocks));
    setCurrentProject(null);
    isDirtyRef.current = true;

    const label = imp.sourceName ? `"${imp.sourceName}"` : "Lesson diagram";
    showToast(`${label} opened in workspace — save to keep your changes`, "success");

    navigate("/whiteboard", { replace: true, state: {} });
  }, [showToast, navigate]);

  const handleRun = useCallback(() => {
    const validation = validatePipeline(blocks, connections);
    if (!validation.valid) { showToast(validation.errors[0], "error"); return; }
    const totalEpochs = trainingSettings.epochs || 10;
    setTrainingState({ status: "running", currentEpoch: 0, totalEpochs, history: null, summary: null });
    setActivePanel("training");
    const cancel = simulateTraining(
      totalEpochs,
      (data) => setTrainingState((prev) => ({ ...prev, currentEpoch: data.epoch, history: data.history })),
      (result) => {
        setTrainingState((prev) => ({
          ...prev, status: "complete", history: result.history, summary: result.summary,
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
    if (!window.confirm("Clear the canvas? This cannot be undone.")) return;
    suppressDirtyRef.current = true;
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
  }, [blocks.length, showToast]);

  const doSave = useCallback(async (name) => {
    const canvasData = {
      blocks:           stripBlockMeta(blocks),
      connections,
      trainingSettings,
    };
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
    const { id, name, data, isTemplate } = fullProject;
    const rawBlocks     = data?.blocks           ?? [];
    const loadedConns   = data?.connections      ?? [];
    const loadedSettings = { ...DEFAULT_TRAINING_SETTINGS, ...(data?.trainingSettings ?? {}) };

    const loadedBlocks = hydrateBlocks(rawBlocks);

    setBlocks(loadedBlocks);
    if (!isTemplate) suppressDirtyRef.current = true;
    setConnections(loadedConns);
    setTrainingSettings(loadedSettings);
    setIdCounter(getMaxBlockId(loadedBlocks));
    setCurrentProject(isTemplate ? null : { id, name });
    setActivePanel(null);

    if (cancelTrainingRef.current) {
      cancelTrainingRef.current();
      cancelTrainingRef.current = null;
    }
    setTrainingState({ status: "idle", currentEpoch: 0, totalEpochs: 0, history: null, summary: null });
    isDirtyRef.current = isTemplate;
    showToast(isTemplate ? `Template "${name}" loaded` : `"${name}" loaded`, "success");
  }, [showToast]);

  const handleExport = useCallback(() => {
    exportPipeline(blocks, connections, trainingSettings, currentProject?.name);
    showToast("Pipeline exported!", "success");
  }, [blocks, connections, trainingSettings, showToast]);

  const handleImportData = useCallback((parsed) => {
    const rawBlocks      = parsed.blocks      ?? [];
    const loadedConns    = parsed.connections ?? [];
    const loadedSettings = { ...DEFAULT_TRAINING_SETTINGS, ...(parsed.trainingSettings ?? {}) };

    const loadedBlocks = hydrateBlocks(rawBlocks);

    setBlocks(loadedBlocks);
    setConnections(loadedConns);
    setTrainingSettings(loadedSettings);
    setIdCounter(getMaxBlockId(loadedBlocks));
    setCurrentProject(null);
    setActivePanel(null);

    if (cancelTrainingRef.current) {
      cancelTrainingRef.current();
      cancelTrainingRef.current = null;
    }
    setTrainingState({ status: "idle", currentEpoch: 0, totalEpochs: 0, history: null, summary: null });
    isDirtyRef.current = true;

    showToast(`"${parsed.name || "Pipeline"}" imported — save to keep your changes`, "success");
  }, [showToast]);

  const handleClosePanel = useCallback(() => setActivePanel(null), []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Keybinds!
      if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "Escape") setActivePanel(null);
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "o") { e.preventDefault(); handleLoad(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); handleViewCode(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); handleRun(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "i") { e.preventDefault(); setShowImportModal(true); }
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
            <button
              className="toolbar-home-btn"
              onClick={() => {
                if (isDirtyRef.current && !window.confirm("You have unsaved changes. Leave without saving?"))
                  return;
                navigate("/");
              }}
              title="Go to home"
            >
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
              onImport={() => setShowImportModal(true)}
              isTraining={trainingState.status === "running"}
              isAuthenticated={isAuthenticated}
              onShowAuth={(mode) => setAuthModal(mode)}
              currentProjectName={currentProject?.name}
              runDisabled={true}
            />
          </div>

          <TrainingSettingsPanel
            settings={trainingSettings}
            onChange={setTrainingSettings}
          />

          <div className="canvas-area">
            <Canvas
              blocks={blocks}
              setBlocks={setBlocks}
              connections={connections}
              setConnections={setConnections}
              onToast={showToast}
            />
            {activePanel === "code" && (
              <CodeViewerPanel code={generatedCode} onClose={handleClosePanel} fileName={currentProject?.name}/>
            )}
            {activePanel === "training" && (
              <TrainingPanel trainingState={trainingState} onClose={handleClosePanel} />
            )}
          </div>

          <ErrorLogPanel warnings={warnings} />
        </div>

        {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

        {authModal && (
          <AuthModal mode={authModal} onClose={() => setAuthModal(null)} />
        )}
        {showSaveModal && (
          <SaveModal
            onSave={doSave}
            onClose={() => setShowSaveModal(false)}
            defaultName={currentProject?.name ?? ""}
          />
        )}
        {showProjectsModal && (
          <ProjectsModal
            onLoad={handleProjectLoaded}
            onClose={() => setShowProjectsModal(false)}
          />
        )}
        {showImportModal && (
          <ImportModal
            onImport={handleImportData}
            onClose={() => setShowImportModal(false)}
          />
        )}
      </div>
    </DndProvider>
  );
};

export default WhiteboardPage;