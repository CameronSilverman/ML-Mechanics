import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import WhiteboardPage from "./pages/WhiteboardPage";
import AuthModal from "./components/AuthModal";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./styles/index.css";

const HomePage = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [authModal, setAuthModal] = useState(null); // 'login' | 'register' | null

  return (
    <div className="home-page">
      <div className="home-content">
        <div className="home-hex">⬡</div>
        <h1 className="home-title">ML Maker Studio</h1>
        <p className="home-subtitle">
          Build machine learning pipelines visually. Drag, drop, and connect
          components to create models without writing code.
        </p>

        <Link to="/whiteboard" className="home-cta">
          Open Workspace →
        </Link>

        <div className="home-auth">
          {isAuthenticated ? (
            <div className="home-auth-signed-in">
              <span className="home-user-email">{user?.email}</span>
              <button className="home-auth-btn" onClick={logout}>
                Sign Out
              </button>
            </div>
          ) : (
            <div className="home-auth-signed-out">
              <span className="home-auth-prompt">
                Sign in to save and sync your pipelines
              </span>
              <div className="home-auth-btns">
                <button
                  className="home-auth-btn"
                  onClick={() => setAuthModal("login")}
                >
                  Log In
                </button>
                <button
                  className="home-auth-btn home-auth-btn-primary"
                  onClick={() => setAuthModal("register")}
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
        />
      )}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/whiteboard" element={<WhiteboardPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;