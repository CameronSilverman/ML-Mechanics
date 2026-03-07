import React, { useState } from "react";
import { authAPI } from "../api";
import { useAuth } from "../context/AuthContext";

const AuthModal = ({ mode: initialMode = "login", onClose, onSuccess }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) { setError("Email and password are required"); return; }
    setLoading(true);
    setError("");
    try {
      const data = mode === "login"
        ? await authAPI.login(email, password)
        : await authAPI.register(email, password);
      login(data.token, data.user);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") onClose();
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="modal-header">
          <span className="modal-title">
            {mode === "login" ? "Sign In" : "Create Account"}
          </span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}
          <div className="modal-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div className="modal-field">
            <label>Password</label>
            <input
              type="password"
              placeholder={mode === "register" ? "At least 6 characters" : ""}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <span className="modal-switch">
            {mode === "login" ? "No account?" : "Have an account?"}
            <button className="modal-switch-btn" onClick={switchMode}>
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </span>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;