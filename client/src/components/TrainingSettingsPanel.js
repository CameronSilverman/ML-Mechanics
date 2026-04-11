import React, { useState } from "react";

export const OPTIMIZERS = ["Adam", "SGD", "RMSprop", "Adagrad", "Adamax", "Nadam"];

export const LOSS_FUNCTIONS = [
  "SparseCategoricalCrossentropy",
  "CategoricalCrossentropy",
  "BinaryCrossentropy",
  "MeanSquaredError",
  "MeanAbsoluteError",
  "Huber",
];

const LOSS_SHORT = {
  SparseCategoricalCrossentropy: "Sparse Cat XE",
  CategoricalCrossentropy: "Cat XE",
  BinaryCrossentropy: "Binary XE",
  MeanSquaredError: "MSE",
  MeanAbsoluteError: "MAE",
  Huber: "Huber",
};

export const DEFAULT_TRAINING_SETTINGS = {
  optimizer: "Adam",
  learningRate: 0.001,
  loss: "SparseCategoricalCrossentropy",
  epochs: 10,
  batchSize: 32,
  testSize: 0.2,
};

const TrainingSettingsPanel = ({ settings, onChange, lessonLock = false }) => {
  const [open, setOpen] = useState(true);

  const update = (key, value) => {
    if (lessonLock) return;
    onChange({ ...settings, [key]: value });
  };

  const testSize = settings.testSize ?? 0.2;

  const summary = [
    settings.optimizer,
    `lr=${settings.learningRate}`,
    LOSS_SHORT[settings.loss] || settings.loss,
    `${settings.epochs} epochs`,
    `batch ${settings.batchSize}`,
    `split ${Math.round(testSize * 100)}%`,
  ].join(" · ");

  return (
    <div className={`tsbar${open ? "" : " tsbar-collapsed"}${lessonLock ? " tsbar-locked" : ""}`}>
      <div
        className="tsbar-inner"
        onClick={!open ? () => setOpen(true) : undefined}
        style={{ cursor: open ? "default" : "pointer" }}
      >
        <span className="tsbar-label">
          <span className="tsbar-icon">⚙</span>
          Training
        </span>

        {lessonLock && (
          <span className="tsbar-lock-badge" title="Training settings are fixed for this lesson">
            🔒 lesson
          </span>
        )}

        {open ? (
          <>
            <div className="tsbar-sep" />

            <div className="tsbar-group">
              <label className="tsbar-field-label">Optimizer</label>
              <select
                className="tsbar-select"
                value={settings.optimizer}
                onChange={(e) => update("optimizer", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                disabled={lessonLock}
              >
                {OPTIMIZERS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <div className="tsbar-group">
              <label className="tsbar-field-label">LR</label>
              <input
                className="tsbar-input tsbar-input-sm"
                type="number"
                step="0.0001"
                min="0.00001"
                value={settings.learningRate}
                onChange={(e) =>
                  update("learningRate", parseFloat(e.target.value) || 0.001)
                }
                onClick={(e) => e.stopPropagation()}
                disabled={lessonLock}
              />
            </div>

            <div className="tsbar-sep" />

            <div className="tsbar-group">
              <label className="tsbar-field-label">Loss</label>
              <select
                className="tsbar-select tsbar-select-wide"
                value={settings.loss}
                onChange={(e) => update("loss", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                disabled={lessonLock}
              >
                {LOSS_FUNCTIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="tsbar-sep" />

            <div className="tsbar-group">
              <label className="tsbar-field-label">Epochs</label>
              <input
                className="tsbar-input tsbar-input-xs"
                type="number"
                min="1"
                step="1"
                value={settings.epochs}
                onChange={(e) =>
                  update("epochs", parseInt(e.target.value, 10) || 10)
                }
                onClick={(e) => e.stopPropagation()}
                disabled={lessonLock}
              />
            </div>

            <div className="tsbar-group">
              <label className="tsbar-field-label">Batch</label>
              <input
                className="tsbar-input tsbar-input-xs"
                type="number"
                min="1"
                step="1"
                value={settings.batchSize}
                onChange={(e) =>
                  update("batchSize", parseInt(e.target.value, 10) || 32)
                }
                onClick={(e) => e.stopPropagation()}
                disabled={lessonLock}
              />
            </div>

            <div className="tsbar-sep" />
            
            <div className="tsbar-group">
              <label
                className="tsbar-field-label"
                title="Fraction of data held out as the test set. Applies to CSV pipelines; ImageLoader datasets have built-in splits."
              >
                Test Split
              </label>
              <input
                className="tsbar-input tsbar-input-sm"
                type="number"
                step="0.05"
                min="0.05"
                max="0.5"
                value={testSize}
                onChange={(e) =>
                  update("testSize", parseFloat(e.target.value) || 0.2)
                }
                onClick={(e) => e.stopPropagation()}
                disabled={lessonLock}
              />
            </div>
          </>
        ) : (
          <span className="tsbar-summary">{summary}</span>
        )}

        <button
          className="tsbar-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          title={open ? "Collapse training settings" : "Expand training settings"}
        >
          {open ? "▴" : "▾"}
        </button>
      </div>
    </div>
  );
};

export default TrainingSettingsPanel;