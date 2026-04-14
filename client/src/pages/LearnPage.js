import React from "react";
import { Link, useNavigate } from "react-router-dom";
import LESSONS, { COURSES } from "../data/lessons";

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

const DIFFICULTY_RANK = { beginner: 0, intermediate: 1, advanced: 2 };
const DIFFICULTY_LABEL = ["beginner", "intermediate", "advanced"];

const courseDifficulty = (lessons) => {
  const max = Math.max(...lessons.map((l) => DIFFICULTY_RANK[l.difficulty] ?? 0));
  return DIFFICULTY_LABEL[max] ?? "beginner";
};

const CourseCard = ({ course, index }) => {
  const lessonMap = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
  const lessons = course.lessonIds
    .map((id) => lessonMap[id])
    .filter(Boolean);

  const firstLesson = lessons[0];
  const diff = courseDifficulty(lessons);
  const diffStyle = DIFFICULTY_STYLE[diff] || DIFFICULTY_STYLE.beginner;
  const totalMinutes = lessons.reduce((s, l) => s + (l.estimatedMinutes || 0), 0);

  return (
    <div className="course-card" style={{ animationDelay: `${index * 0.07}s` }}>
      <div className="course-card-main">
        <div className="course-card-top">
          <span className="learn-difficulty-badge" style={diffStyle}>{diff}</span>
          <span className="course-card-meta">
            {lessons.length} lesson{lessons.length !== 1 ? "s" : ""} · ~{totalMinutes} min
          </span>
        </div>

        <h3 className="course-card-title">{course.title}</h3>
        <p className="course-card-desc">{course.description}</p>

        <ol className="course-lesson-list">
          {lessons.map((lesson, i) => {
            const d = DIFFICULTY_STYLE[lesson.difficulty] || DIFFICULTY_STYLE.beginner;
            return (
              <li key={lesson.id} className="course-lesson-row">
                <span className="course-lesson-num">{i + 1}</span>
                <span className="course-lesson-title">{lesson.title}</span>
                <span
                  className="course-lesson-diff"
                  style={{ color: d.color }}
                >
                  {lesson.difficulty}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="course-card-footer">
        {firstLesson && (
          <Link to={`/learn/${firstLesson.id}`} className="course-start-btn">
            Start Course →
          </Link>
        )}
      </div>
    </div>
  );
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
        <span className="learn-card-cta">Start →</span>
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

        {/* Courses */}
        {COURSES.length > 0 && (
          <section className="learn-category-section">
            <div className="learn-category-header">
              <span className="learn-category-name">◈ Courses</span>
              <span className="learn-category-count">
                {COURSES.length} course{COURSES.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="course-card-grid">
              {COURSES.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* Individual lessons grouped by category */}
        <section className="learn-category-section">
          <div className="learn-category-header">
            <span className="learn-category-name">◧ All Lessons</span>
            <span className="learn-category-count">
              {LESSONS.length} lesson{LESSONS.length !== 1 ? "s" : ""}
            </span>
          </div>

          {Object.entries(byCategory).map(([category, lessons]) => (
            <div key={category} className="learn-subcategory">
              <div className="learn-subcategory-label">{category}</div>
              <div className="learn-card-grid">
                {lessons.map((lesson, i) => (
                  <LessonCard key={lesson.id} lesson={lesson} index={i} />
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default LearnPage;