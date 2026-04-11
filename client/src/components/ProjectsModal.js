import React, { useState, useEffect } from "react";
import { projectsAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import TEMPLATES from "../data/projectTemplates";

const DIFFICULTY_COLOR = {
  beginner:     { color: "#6ee7b7", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" },
  intermediate: { color: "#fcd34d", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  advanced:     { color: "#fca5a5", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)"  },
};

const TemplateCard = ({ template, onSelect }) => {
  const diff = DIFFICULTY_COLOR[template.difficulty] || DIFFICULTY_COLOR.beginner;
  return (
    <div className="tpl-card">
      <div className="tpl-card-top">
        <span
          className="tpl-difficulty"
          style={{ color: diff.color, background: diff.bg, borderColor: diff.border }}
        >
          {template.difficulty}
        </span>
        <div className="tpl-tags">
          {template.tags.slice(0, 3).map((t) => (
            <span key={t} className="tpl-tag">{t}</span>
          ))}
        </div>
      </div>
      <div className="tpl-card-name">{template.name}</div>
      <div className="tpl-card-desc">{template.description}</div>
      <div className="tpl-card-footer">
        <span className="tpl-block-count">
          {template.blocks.length} block{template.blocks.length !== 1 ? "s" : ""}
        </span>
        <button className="tpl-use-btn" onClick={() => onSelect(template)}>
          Use Template →
        </button>
      </div>
    </div>
  );
};

const ProjectsTab = ({ onLoad, onClose }) => {
  const { token } = useAuth();
  const [projects, setProjects]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [deleting, setDeleting]     = useState(null);
  const [loadingId, setLoadingId]   = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal]   = useState("");

  useEffect(() => {
    projectsAPI.list(token)
      .then((data) => setProjects(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleLoad = async (project) => {
    if (renamingId) return;
    setLoadingId(project.id);
    try {
      const full = await projectsAPI.get(project.id, token);
      onLoad(full);
      onClose();
    } catch (err) {
      setError(err.message);
      setLoadingId(null);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setDeleting(id);
    try {
      await projectsAPI.delete(id, token);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const startRename = (e, project) => {
    e.stopPropagation();
    setRenamingId(project.id);
    setRenameVal(project.name);
  };

  const commitRename = async (id) => {
    const trimmed = renameVal.trim();
    if (!trimmed) { cancelRename(); return; }
    try {
      await projectsAPI.rename(id, trimmed, token);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: trimmed } : p))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      cancelRename();
    }
  };

  const cancelRename = () => { setRenamingId(null); setRenameVal(""); };

  const handleRenameKey = (e, id) => {
    if (e.key === "Enter")  commitRename(id);
    if (e.key === "Escape") cancelRename();
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="modal-body modal-body-list">
      {loading && <div className="modal-status">Loading projects…</div>}
      {error   && <div className="modal-error">{error}</div>}
      {!loading && !error && projects.length === 0 && (
        <div className="modal-status modal-empty">
          <span className="modal-empty-icon">⬡</span>
          <span>No saved projects yet. Build something and save it!</span>
        </div>
      )}
      {projects.map((p) => (
        <div
          key={p.id}
          className={`project-row ${loadingId === p.id ? "project-row-loading" : ""}`}
          onClick={() => handleLoad(p)}
          title={renamingId === p.id ? undefined : "Click to open"}
        >
          <div className="project-row-info">
            {renamingId === p.id ? (
              <input
                className="project-rename-input"
                value={renameVal}
                autoFocus
                onChange={(e) => setRenameVal(e.target.value)}
                onKeyDown={(e) => handleRenameKey(e, p.id)}
                onBlur={() => commitRename(p.id)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="project-row-name">{p.name}</span>
            )}
            <span className="project-row-meta">
              {p.block_count ?? 0} block{p.block_count !== 1 ? "s" : ""} · Updated {formatDate(p.updated_at)}
            </span>
          </div>
          <div className="project-row-actions">
            {loadingId === p.id ? (
              <span className="project-row-loading-dot">…</span>
            ) : renamingId === p.id ? null : (
              <>
                <button
                  className="project-row-rename"
                  onClick={(e) => startRename(e, p)}
                  title="Rename project"
                >✎</button>
                <button
                  className="project-row-delete"
                  onClick={(e) => handleDelete(e, p.id)}
                  disabled={deleting === p.id}
                  title="Delete project"
                >
                  {deleting === p.id ? "…" : "✕"}
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const ProjectsModal = ({ onLoad, onClose }) => {
  const [activeTab, setActiveTab] = useState("projects");

  const handleTemplateSelect = (template) => {
    onLoad({
      id: null,
      name: template.name,
      isTemplate: true,
      data: {
        blocks:           template.blocks,
        connections:      template.connections,
        trainingSettings: template.trainingSettings,
      },
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel modal-panel-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Open Project</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tab-bar">
          <button
            className={`modal-tab${activeTab === "projects" ? " modal-tab-active" : ""}`}
            onClick={() => setActiveTab("projects")}
          >
            📂 Your Projects
          </button>
          <button
            className={`modal-tab${activeTab === "templates" ? " modal-tab-active" : ""}`}
            onClick={() => setActiveTab("templates")}
          >
            ◈ Templates
          </button>
        </div>

        {activeTab === "templates" ? (
          <div className="tpl-grid-wrap">
            {TEMPLATES.map((tpl) => (
              <TemplateCard key={tpl.id} template={tpl} onSelect={handleTemplateSelect} />
            ))}
          </div>
        ) : (
          <ProjectsTab onLoad={onLoad} onClose={onClose} />
        )}
      </div>
    </div>
  );
};

export default ProjectsModal;