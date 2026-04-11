import React, { useState, useEffect } from "react";
import { projectsAPI } from "../api";
import { useAuth } from "../context/AuthContext";

const ProjectsModal = ({ onLoad, onClose, onRename }) => {
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
      onRename?.(id, trimmed);
    } catch (err) {
      setError(err.message);
    } finally {
      cancelRename();
    }
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameVal("");
  };

  const handleRenameKey = (e, id) => {
    if (e.key === "Enter")  commitRename(id);
    if (e.key === "Escape") cancelRename();
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel modal-panel-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Your Projects</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body modal-body-list">
          {loading && <div className="modal-status">Loading projects…</div>}
          {error && <div className="modal-error">{error}</div>}
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
                    >
                      ✎
                    </button>
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
      </div>
    </div>
  );
};

export default ProjectsModal;