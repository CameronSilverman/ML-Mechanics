import React from "react";
import { Link, useNavigate } from "react-router-dom";
import LESSONS from "../data/lessons";

const DIFFICULTY_STYLE = {
  beginner: {
    background: "rgba(16, 185, 129, 0.12)",
    color: "#6ee7b7",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  intermediate: {
    background: "rgba(245, 158, 11, 0.15)",
    color: "#fcd34d",
    borderColor: "rgba(245, 158, 11, 0.35)",
  },
  advanced: {
    background: "rgba(239, 68, 68, 0.12)",
    color: "#fca5a5",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
};

const LessonCard = ({ lesson, index }) => {
  const diff = DIFFICULTY_STYLE[lesson.difficulty] || DIFFICULTY_STYLE.beginner;
  const completedSteps = 0; // future: read from persistent progress storage

  return (
    <Link
      to={`/learn/${lesson.id}`}
      className="learn-card"
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <div className="learn-card-top">
        <span className="learn-difficulty-badge" style={diff}>
          {lesson.difficulty}
        </span>
        <span className="learn-card-time">~{lesson.estimatedMinutes} min</span>
      </div>

      <h3 className="learn-card-title">{lesson.title}</h3>
      <p className="learn-card-desc">{lesson.description}</p>

      <div className="learn-card-objectives">
        {lesson.objectives.slice(0, 2).map((obj, i) => (
          <div key={i} className="learn-card-obj">
            <span className="learn-card-obj-dot">◦</span>
            <span>{obj}</span>
          </div>
        ))}
      </div>

      <div className="learn-card-footer">
        <div className="learn-step-pips">
          {lesson.steps.map((_, i) => (
            <div
              key={i}
              className={`learn-pip${i < completedSteps ? " learn-pip-done" : ""}`}
            />
          ))}
        </div>
        <span className="learn-card-cta">
          Start →
        </span>
      </div>
    </Link>
  );
};

const LearnPage = () => {
  const navigate = useNavigate();

  // Group lessons by category, preserving insertion order
  const byCategory = LESSONS.reduce((acc, lesson) => {
    if (!acc[lesson.category]) acc[lesson.category] = [];
    acc[lesson.category].push(lesson);
    return acc;
  }, {});

  return (
    <div className="learn-page">
      {/* Top bar */}
      <div className="learn-topbar">
        <button
          className="learn-back-btn"
          onClick={() => navigate("/")}
          title="Back to home"
        >
          <span className="toolbar-logo">⬡</span>
          <span>ML Maker Studio</span>
        </button>
        <span className="learn-topbar-sep">/</span>
        <span className="learn-topbar-crumb">Learn</span>
      </div>

      <div className="learn-content">
        {/* Hero */}
        <div className="learn-hero">
          <div className="learn-hero-eyebrow">◈ LEARNING CENTER</div>
          <h1 className="learn-hero-title">
            Master Machine Learning,<br />block by block.
          </h1>
          <p className="learn-hero-sub">
            Interactive lessons that teach ML concepts through hands-on building.
            Each lesson guides you step-by-step through the visual pipeline editor.
          </p>
        </div>

        {/* Lesson categories */}
        {Object.entries(byCategory).map(([category, lessons]) => (
          <section key={category} className="learn-category-section">
            <div className="learn-category-header">
              <span className="learn-category-name">{category}</span>
              <span className="learn-category-count">
                {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="learn-card-grid">
              {lessons.map((lesson, i) => (
                <LessonCard key={lesson.id} lesson={lesson} index={i} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default LearnPage;