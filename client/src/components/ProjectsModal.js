import React, { useState, useEffect } from "react";
import { projectsAPI } from "../api";
import { useAuth } from "../context/AuthContext";

const ProjectsModal = ({ onLoad, onClose }) => {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    projectsAPI.list(token)
      .then((data) => setProjects(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleLoad = async (project) => {
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
              title="Click to open"
            >
              <div className="project-row-info">
                <span className="project-row-name">{p.name}</span>
                <span className="project-row-meta">
                  {p.block_count ?? 0} block{p.block_count !== 1 ? "s" : ""} · Updated {formatDate(p.updated_at)}
                </span>
              </div>
              <div className="project-row-actions">
                {loadingId === p.id ? (
                  <span className="project-row-loading-dot">…</span>
                ) : (
                  <button
                    className="project-row-delete"
                    onClick={(e) => handleDelete(e, p.id)}
                    disabled={deleting === p.id}
                    title="Delete project"
                  >
                    {deleting === p.id ? "…" : "✕"}
                  </button>
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