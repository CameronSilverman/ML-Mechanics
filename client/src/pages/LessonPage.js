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
        lockedProperties: seed.lockedProperties || [],
      };
    })
    .filter(Boolean);

const buildCustomIdSet = (blocks) =>
  new Set(blocks.filter((b) => b.custom_id).map((b) => b.custom_id));

const PY_KEYWORDS = new Set([
  "import", "from", "as", "def", "class", "return", "if", "else",
  "for", "in", "while", "True", "False", "None", "print",
]);

const escHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const findStrEnd = (line, start, q) => {
  let i = start + 1;
  while (i < line.length) {
    if (line[i] === "\\") { i += 2; continue; }
    if (line[i] === q)    return i + 1;
    i++;
  }
  return line.length;
};

const highlightPy = (code) =>
  code.split("\n").map((line, i) => {
    let out = "";
    let j   = 0;
    while (j < line.length) {
      if (line[j] === "#") {
        out += `<span class="code-comment">${escHtml(line.slice(j))}</span>`;
        j = line.length;
      } else if (line[j] === '"' || line[j] === "'") {
        const q   = line[j];
        const end = findStrEnd(line, j, q);
        out += `<span class="code-string">${escHtml(line.slice(j, end))}</span>`;
        j = end;
      } else if (/[a-zA-Z_]/.test(line[j])) {
        let end = j;
        while (end < line.length && /\w/.test(line[end])) end++;
        const word = line.slice(j, end);
        if (PY_KEYWORDS.has(word)) {
          out += `<span class="code-keyword">${word}</span>`;
        } else if (end < line.length && line[end] === "(") {
          out += `<span class="code-func">${word}</span>`;
        } else {
          out += word;
        }
        j = end;
      } else if (/\d/.test(line[j])) {
        let end = j;
        while (end < line.length && /[\d.]/.test(line[end])) end++;
        out += `<span class="code-number">${line.slice(j, end)}</span>`;
        j = end;
      } else {
        out += escHtml(line[j]);
        j++;
      }
    }
    return (
      <div key={i} className="code-line">
        <span className="code-line-number">{i + 1}</span>
        <span dangerouslySetInnerHTML={{ __html: out }} />
      </div>
    );
  });

const CALLOUT_META = {
  info:    { icon: "ℹ", label: "Note"    },
  tip:     { icon: "✦", label: "Tip"     },
  warning: { icon: "⚠", label: "Warning" },
  math:    { icon: "∑", label: "Math"    },
};

const ContentBlock = ({ block }) => {
  switch (block.type) {
    case "text":
      return <p className="lc-text">{block.body}</p>;
    case "heading": {
      const Tag = `h${block.level ?? 3}`;
      return <Tag className={`lc-heading lc-h${block.level ?? 3}`}>{block.body}</Tag>;
    }
    case "callout": {
      const meta = CALLOUT_META[block.variant] || CALLOUT_META.info;
      return (
        <div className={`lc-callout lc-callout-${block.variant || "info"}`}>
          <div className="lc-callout-header">
            <span className="lc-callout-icon">{meta.icon}</span>
            <span className="lc-callout-label">{block.title || meta.label}</span>
          </div>
          <div className="lc-callout-body">
            {block.body.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                {i < block.body.split("\n").length - 1 && <br />}
              </span>
            ))}
          </div>
        </div>
      );
    }
    case "code":
      return (
        <div className="lc-code-wrap">
          {block.language && <div className="lc-code-lang">{block.language}</div>}
          <pre className="lc-code-block code-block">{highlightPy(block.body)}</pre>
        </div>
      );
    case "image": {
      // scale: 0–1 fraction of container width (default: natural size, capped at 100%)
      const imgStyle = {
        ...(block.scale != null && { maxWidth: `${Math.min(1, block.scale) * 100}%` }),
        ...(block.background != null && { background: block.background }),
      };
      return (
        <figure className="lc-figure">
          <img
            src={block.src}
            alt={block.alt || ""}
            className="lc-image"
            loading="lazy"
            style={Object.keys(imgStyle).length ? imgStyle : undefined}
          />
          {block.caption && <figcaption className="lc-caption">{block.caption}</figcaption>}
        </figure>
      );
    }
    case "video":
      return (
        <figure className="lc-figure">
          <video
            src={block.src}
            controls
            className="lc-video"
            style={block.scale != null
              ? { maxWidth: `${Math.min(1, block.scale) * 100}%` }
              : undefined}
          />
          {block.caption && <figcaption className="lc-caption">{block.caption}</figcaption>}
        </figure>
      );
    case "divider":
      return <hr className="lc-divider" />;
    default:
      return null;
  }
};

const LessonContent = ({ content = [] }) => (
  <div className="lc-root">
    {content.map((block, i) => <ContentBlock key={i} block={block} />)}
  </div>
);

const StepsTab = ({ lesson, stepResults }) => {
  const [expandedHintId, setExpandedHintId] = useState(null);
  const passedCount = stepResults.filter((r) => r.passed).length;
  const allDone     = passedCount === lesson.steps.length;

  return (
    <div className="lesson-panel-body">
      {allDone && (
        <div className="lesson-complete-banner">
          <div className="lesson-complete-icon">✦</div>
          <div className="lesson-complete-title">Lesson Complete!</div>
          <p className="lesson-complete-sub">
            Great work! Use <strong>Open in Workspace</strong> in the toolbar to
            keep editing freely, or <strong>Code</strong> to see the generated Python.
          </p>
        </div>
      )}
      <div className="lesson-steps-list">
        {lesson.steps.map((step, i) => {
          const result    = stepResults.find((r) => r.id === step.id);
          const passed    = result?.passed ?? false;
          const isActive  = !passed && stepResults.slice(0, i).every((r) => r.passed);
          const isVisible = passed || isActive;

          return (
            <div
              key={step.id}
              className={`lesson-step${passed ? " lesson-step-done" : ""}${isActive ? " lesson-step-active" : ""}`}
            >
              <div className="lesson-step-header">
                <span className="lesson-step-status">
                  {passed ? "✓" : isActive ? "▶" : String(i + 1).padStart(2, "0")}
                </span>
                <span className="lesson-step-title">{step.title}</span>
              </div>
              {isVisible && (
                <div className="lesson-step-body">
                  <p className="lesson-step-desc">{step.description}</p>
                  {step.hint && (
                    <div className="lesson-hint-wrap">
                      <button
                        className="lesson-hint-btn"
                        onClick={() =>
                          setExpandedHintId((prev) => prev === step.id ? null : step.id)
                        }
                      >
                        {expandedHintId === step.id ? "▴ Hide hint" : "▾ Show hint"}
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
  );
};

const InstructionPanel = ({ lesson, stepResults, collapsed, onToggle }) => {
  const [activeTab, setActiveTab] = useState("lesson");
  const passedCount = stepResults.filter((r) => r.passed).length;
  const allDone     = passedCount === lesson.steps.length;

  useEffect(() => {
    if (allDone) setActiveTab("steps");
  }, [allDone]);

  return (
    <div className={`lesson-instruction-panel${collapsed ? " lesson-panel-collapsed" : ""}`}>
      <div className="lesson-panel-header">
        {!collapsed && (
          <>
            <div className="lesson-panel-meta">
              <span className="lesson-panel-category">{lesson.category}</span>
              <span className={`lesson-panel-diff lesson-diff-${lesson.difficulty}`}>
                {lesson.difficulty}
              </span>
              <span className="lesson-panel-time">~{lesson.estimatedMinutes} min</span>
            </div>
            <h2 className="lesson-panel-title">{lesson.title}</h2>
            <div className="lesson-panel-progress">
              <div className="lesson-progress-bar">
                <div
                  className="lesson-progress-fill"
                  style={{ width: `${(passedCount / lesson.steps.length) * 100}%` }}
                />
              </div>
              <span className="lesson-progress-label">
                {passedCount} / {lesson.steps.length} steps complete
              </span>
            </div>
            <div className="lesson-tabs">
              <button
                className={`lesson-tab${activeTab === "lesson" ? " lesson-tab-active" : ""}`}
                onClick={() => setActiveTab("lesson")}
              >
                ◈ Lesson
              </button>
              <button
                className={`lesson-tab${activeTab === "steps" ? " lesson-tab-active" : ""}${allDone ? " lesson-tab-complete" : ""}`}
                onClick={() => setActiveTab("steps")}
              >
                ▶ Steps
                <span className={`lesson-tab-badge${allDone ? " lesson-tab-badge-done" : ""}`}>
                  {passedCount}/{lesson.steps.length}
                </span>
              </button>
            </div>
          </>
        )}
        <button
          className="lesson-panel-toggle"
          onClick={onToggle}
          title={collapsed ? "Expand panel" : "Collapse panel"}
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {!collapsed && (
        activeTab === "lesson" ? (
          <div className="lesson-panel-body">
            <div className="lc-objectives">
              <div className="lesson-section-label">Objectives</div>
              {lesson.objectives.map((obj, i) => (
                <div key={i} className="lesson-objective-row">
                  <span className="lesson-obj-bullet">◦</span>
                  <span>{obj}</span>
                </div>
              ))}
            </div>
            <div className="lc-divider-soft" />
            <LessonContent content={lesson.content || []} />
          </div>
        ) : (
          <StepsTab lesson={lesson} stepResults={stepResults} />
        )
      )}
    </div>
  );
};

const LessonPage = () => {
  const { lessonId } = useParams();
  const navigate     = useNavigate();
  const lesson       = getLessonById(lessonId);

  const [blocks, setBlocks]           = useState([]);
  const [connections, setConnections] = useState([]);
  const [warnings, setWarnings]       = useState([]);
  const [stepResults, setStepResults] = useState([]);

  const [activePanel, setActivePanel]     = useState(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [trainingState, setTrainingState] = useState({
    status: "idle", currentEpoch: 0, totalEpochs: 0, history: null, summary: null,
  });
  const [toast, setToast]                   = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const cancelTrainingRef                   = useRef(null);

  const customIdSetRef = useRef(new Set());

  const trainingSettings = lesson?.lockedTrainingSettings ?? {
    optimizer: "Adam",
    learningRate: 0.001,
    loss: "SparseCategoricalCrossentropy",
    epochs: 10,
    batchSize: 32,
    testSize: 0.2,
  };

  useEffect(() => {
    if (!lesson) return;
    const initial = createInitialBlocks(lesson);
    setBlocks(initial);
    setConnections([]);
    setIdCounter(Math.max(initial.length, 0) + 1);
    customIdSetRef.current = buildCustomIdSet(initial);
  }, [lessonId]);

  useEffect(() => {
    if (!lesson) return;
    setStepResults(checkSteps(lesson, blocks, connections));
  }, [lesson, blocks, connections]);

  useEffect(() => {
    setWarnings(checkPipelineWarnings(blocks, connections, trainingSettings));
  }, [blocks, connections, trainingSettings]);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

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
        setTrainingState((prev) => ({ ...prev, status: "complete", history: result.history, summary: result.summary }));
        showToast("Training complete!", "success");
      }
    );
    cancelTrainingRef.current = cancel;
  }, [blocks, connections, trainingSettings, showToast]);

  const handleViewCode = useCallback(() => {
    setGeneratedCode(generateCode(blocks, trainingSettings));
    setActivePanel("code");
  }, [blocks, trainingSettings]);

  const handleOpenInWorkspace = useCallback(() => {
    navigate("/whiteboard", {
      state: {
        lessonImport: {
          blocks,
          connections,
          trainingSettings,
          sourceName: lesson.title,
        },
      },
    });
  }, [navigate, blocks, connections, trainingSettings, lesson]);

  const handleClosePanel = useCallback(() => setActivePanel(null), []);

  useEffect(() => {
    const onKey = (e) => {
      if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "Escape") setActivePanel(null);
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); handleViewCode(); }
      // Run is disabled — Ctrl+Enter intentionally not wired
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleViewCode]);

  if (!lesson) {
    return (
      <div className="learn-page">
        <div className="learn-not-found">
          <p>Lesson not found.</p>
          <button className="learn-back-btn" onClick={() => navigate("/learn")}>
            ← Back to Learn
          </button>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="whiteboard-page">
        <InstructionPanel
          lesson={lesson}
          stepResults={stepResults}
          collapsed={panelCollapsed}
          onToggle={() => setPanelCollapsed((v) => !v)}
        />

        <Sidebar />

        <div className="canvas-wrapper">
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
                disabled
                title="Live training is coming soon — use Code view to export your model"
              >
                <span>▶</span>
                <span>Run</span>
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
                className="toolbar-btn"
                onClick={handleOpenInWorkspace}
                title="Continue editing this diagram in the full sandbox workspace"
              >
                <span>↗</span>
                <span>Open in Workspace</span>
              </button>
            </div>
          </div>

          <TrainingSettingsPanel
            settings={trainingSettings}
            onChange={() => {}}
            lessonLock={!!lesson.lockedTrainingSettings}
          />

          <div className="canvas-area">
            <Canvas
              blocks={blocks}
              setBlocks={setBlocks}
              connections={connections}
              setConnections={setConnections}
              onToast={showToast}
              customIdSetRef={customIdSetRef}
            />
            {activePanel === "code" && (
              <CodeViewerPanel code={generatedCode} onClose={handleClosePanel} />
            )}
            {activePanel === "training" && (
              <TrainingPanel trainingState={trainingState} onClose={handleClosePanel} />
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