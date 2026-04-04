import React, { useState, useCallback, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Canvas, { setIdCounter } from "../components/Canvas";
import CodeViewerPanel from "../components/CodeViewerPanel";
import TrainingPanel from "../components/TrainingPanel";
import ErrorLogPanel from "../components/ErrorLogPanel";
import TrainingSettingsPanel from "../components/TrainingSettingsPanel";
import { getLessonById } from "../data/lessons";
import { getComponentDef } from "../data/mlComponents";
import { checkSteps } from "../utils/solutionChecker";
import { checkPipelineWarnings } from "../utils/pipelineWarnings";
import { generateCode } from "../utils/codeGenerator";
import { simulateTraining } from "../utils/trainSimulator";
import { validatePipeline } from "../utils/pipelineValidator";

// Seed block factory

/**
 * Convert lesson.initialBlocks config entries into full canvas block objects.
 * lockedProperties is stored on the block itself so PropertiesPanel can read it.
 */
const createInitialBlocks = (lesson) =>
  (lesson.initialBlocks || [])
    .map((seed, idx) => {
      const def = getComponentDef(seed.type);
      if (!def) return null;
      return {
        id: `block-${idx + 1}`,
        type: def.type,
        label: def.label,
        icon: def.icon,
        color: def.color,
        x: seed.x ?? 80 + idx * 240,
        y: seed.y ?? 200,
        properties: { ...def.defaults, ...(seed.overrideProperties || {}) },
        connectedOutputs: {},
        connectedInputs: {},
        // Stored on the block so Canvas → PropertiesPanel can pick it up
        lockedProperties: seed.lockedProperties || [],
      };
    })
    .filter(Boolean);

// Instruction Panel

const InstructionPanel = ({ lesson, stepResults, collapsed, onToggle }) => {
  const [expandedHintId, setExpandedHintId] = useState(null);

  const passedCount = stepResults.filter((r) => r.passed).length;
  const allDone     = passedCount === lesson.steps.length;

  const toggleHint = (id) =>
    setExpandedHintId((prev) => (prev === id ? null : id));

  return (
    <div
      className={`lesson-instruction-panel${
        collapsed ? " lesson-panel-collapsed" : ""
      }`}
    >
      {/* Header (always visible) */}
      <div className="lesson-panel-header">
        {!collapsed && (
          <>
            <div className="lesson-panel-meta">
              <span className="lesson-panel-category">{lesson.category}</span>
              <span className={`lesson-panel-diff lesson-diff-${lesson.difficulty}`}>
                {lesson.difficulty}
              </span>
            </div>
            <h2 className="lesson-panel-title">{lesson.title}</h2>
            <div className="lesson-panel-progress">
              <div className="lesson-progress-bar">
                <div
                  className="lesson-progress-fill"
                  style={{
                    width: `${(passedCount / lesson.steps.length) * 100}%`,
                  }}
                />
              </div>
              <span className="lesson-progress-label">
                {passedCount} / {lesson.steps.length} steps
              </span>
            </div>
          </>
        )}
        <button
          className="lesson-panel-toggle"
          onClick={onToggle}
          title={collapsed ? "Expand instructions" : "Collapse instructions"}
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* Scrollable body */}
      {!collapsed && (
        <div className="lesson-panel-body">
          {/* Completion banner */}
          {allDone && (
            <div className="lesson-complete-banner">
              <div className="lesson-complete-icon">✦</div>
              <div className="lesson-complete-title">Lesson Complete!</div>
              <p className="lesson-complete-sub">
                You built your first Dense network. Press{" "}
                <strong>Run</strong> in the toolbar to watch it train.
              </p>
            </div>
          )}

          {/* Objectives */}
          {!allDone && (
            <div className="lesson-objectives">
              <div className="lesson-section-label">Objectives</div>
              {lesson.objectives.map((obj, i) => (
                <div key={i} className="lesson-objective-row">
                  <span className="lesson-obj-bullet">◦</span>
                  <span>{obj}</span>
                </div>
              ))}
            </div>
          )}

          {/* Steps */}
          <div className="lesson-section-label" style={{ marginTop: "1.25rem" }}>
            Steps
          </div>
          <div className="lesson-steps-list">
            {lesson.steps.map((step, i) => {
              const result    = stepResults.find((r) => r.id === step.id);
              const passed    = result?.passed ?? false;
              // A step is "active" if all previous steps passed and this one hasn't
              const isActive  =
                !passed && stepResults.slice(0, i).every((r) => r.passed);
              const isVisible = passed || isActive;

              return (
                <div
                  key={step.id}
                  className={`lesson-step${passed ? " lesson-step-done" : ""}${
                    isActive ? " lesson-step-active" : ""
                  }`}
                >
                  {/* Step header row */}
                  <div className="lesson-step-header">
                    <span className="lesson-step-status">
                      {passed ? "✓" : isActive ? "▶" : String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="lesson-step-title">{step.title}</span>
                  </div>

                  {/* Expanded content for active / done steps */}
                  {isVisible && (
                    <div className="lesson-step-body">
                      <p className="lesson-step-desc">{step.description}</p>

                      {step.hint && (
                        <div className="lesson-hint-wrap">
                          <button
                            className="lesson-hint-btn"
                            onClick={() => toggleHint(step.id)}
                          >
                            {expandedHintId === step.id
                              ? "▴ Hide hint"
                              : "▾ Show hint"}
                          </button>
                          {expandedHintId === step.id && (
                            <div className="lesson-hint-text">{step.hint}</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// LessonPage

const LessonPage = () => {
  const { lessonId }  = useParams();
  const navigate      = useNavigate();
  const lesson        = getLessonById(lessonId);

  const [blocks, setBlocks]           = useState([]);
  const [connections, setConnections] = useState([]);
  const [warnings, setWarnings]       = useState([]);
  const [stepResults, setStepResults] = useState([]);

  const [activePanel, setActivePanel]     = useState(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [trainingState, setTrainingState] = useState({
    status: "idle",
    currentEpoch: 0,
    totalEpochs: 0,
    history: null,
    summary: null,
  });
  const [toast, setToast]                   = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const cancelTrainingRef                   = useRef(null);

  // Frozen settings for this lesson (may be null if lesson has none)
  const trainingSettings = lesson?.lockedTrainingSettings ?? {
    optimizer: "Adam",
    learningRate: 0.001,
    loss: "SparseCategoricalCrossentropy",
    epochs: 10,
    batchSize: 32,
  };

  // Seed canvas with initial blocks on lesson load
  useEffect(() => {
    if (!lesson) return;
    const initial = createInitialBlocks(lesson);
    setBlocks(initial);
    setConnections([]);
    // Ensure user-added blocks get IDs that don't collide with seed blocks
    setIdCounter(Math.max(initial.length, 0) + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]); // re-seed only when the lesson changes, not on every render

  // Re-validate steps whenever the canvas changes
  useEffect(() => {
    if (!lesson) return;
    setStepResults(checkSteps(lesson, blocks, connections));
  }, [lesson, blocks, connections]);

  // Re-run pipeline diagnostics
  useEffect(() => {
    setWarnings(checkPipelineWarnings(blocks, connections, trainingSettings));
  }, [blocks, connections, trainingSettings]);

  // Toast helper
  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Run
  const handleRun = useCallback(() => {
    const validation = validatePipeline(blocks, connections);
    if (!validation.valid) {
      showToast(validation.errors[0], "error");
      return;
    }
    const totalEpochs = trainingSettings.epochs || 10;
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
      (data) =>
        setTrainingState((prev) => ({
          ...prev,
          currentEpoch: data.epoch,
          history: data.history,
        })),
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

  // View Code
  const handleViewCode = useCallback(() => {
    setGeneratedCode(generateCode(blocks, trainingSettings));
    setActivePanel("code");
  }, [blocks, trainingSettings]);

  const handleClosePanel = useCallback(() => setActivePanel(null), []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "Escape") setActivePanel(null);
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        handleViewCode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleViewCode, handleRun]);

  // Lesson not found
  if (!lesson) {
    return (
      <div className="learn-page">
        <div className="learn-not-found">
          <p>Lesson not found.</p>
          <button
            className="learn-back-btn"
            onClick={() => navigate("/learn")}
          >
            ← Back to Learn
          </button>
        </div>
      </div>
    );
  }

  // Render
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="whiteboard-page">
        <Sidebar />

        <InstructionPanel
          lesson={lesson}
          stepResults={stepResults}
          collapsed={panelCollapsed}
          onToggle={() => setPanelCollapsed((v) => !v)}
        />

        <div className="canvas-wrapper">
          {/* Toolbar */}
          <div className="canvas-toolbar">
            <button
              className="toolbar-home-btn"
              onClick={() => navigate("/learn")}
              title="Back to lessons"
            >
              <span className="toolbar-logo">⬡</span>
              <span className="toolbar-title">Learn</span>
            </button>

            <span className="toolbar-subtitle">{lesson.title}</span>

            <div className="toolbar-actions">
              <button
                className="toolbar-btn toolbar-btn-primary"
                onClick={handleRun}
                disabled={trainingState.status === "running"}
                title="Run pipeline (Ctrl+Enter)"
              >
                <span>{trainingState.status === "running" ? "⏳" : "▶"}</span>
                <span>
                  {trainingState.status === "running" ? "Training…" : "Run"}
                </span>
              </button>

              <button
                className="toolbar-btn"
                onClick={handleViewCode}
                title="View generated code (Ctrl+K)"
              >
                <span>{"</>"}</span>
                <span>Code</span>
              </button>

              <div className="toolbar-divider" />

              <button
                className="toolbar-btn toolbar-btn-auth"
                onClick={() => navigate("/learn")}
                title="Back to all lessons"
              >
                <span>☰</span>
                <span>Lessons</span>
              </button>
            </div>
          </div>

          {/* Training settings — locked to lesson values */}
          <TrainingSettingsPanel
            settings={trainingSettings}
            onChange={() => {}}
            lessonLock={!!lesson.lockedTrainingSettings}
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
              <CodeViewerPanel
                code={generatedCode}
                onClose={handleClosePanel}
              />
            )}
            {activePanel === "training" && (
              <TrainingPanel
                trainingState={trainingState}
                onClose={handleClosePanel}
              />
            )}
          </div>

          <ErrorLogPanel warnings={warnings} />
        </div>

        {toast && (
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        )}
      </div>
    </DndProvider>
  );
};

export default LessonPage;