import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import WhiteboardPage from "./pages/WhiteboardPage";
import "./styles/index.css";

const HomePage = () => (
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
    </div>
  </div>
);

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/whiteboard" element={<WhiteboardPage />} />
      </Routes>
    </Router>
  );
};

export default App;
