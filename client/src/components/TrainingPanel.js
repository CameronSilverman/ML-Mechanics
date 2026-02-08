import React from "react";
import ResultsChart from "./ResultsChart";

const TrainingPanel = ({ trainingState, onClose }) => {
  const { status, currentEpoch, totalEpochs, history, summary } = trainingState;

  const progress = totalEpochs > 0 ? (currentEpoch / totalEpochs) * 100 : 0;

  return (
    <div className="side-panel training-panel">
      <div className="side-panel-header">
        <span className="side-panel-title">
          {status === "running" ? "Training..." : status === "complete" ? "Training Complete" : "Training"}
        </span>
        <button className="side-panel-close" onClick={onClose}>✕</button>
      </div>

      <div className="training-content">
        {/* Progress bar */}
        <div className="training-progress-section">
          <div className="training-progress-label">
            <span>Epoch {currentEpoch} / {totalEpochs}</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="training-progress-bar">
            <div
              className="training-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Live metrics */}
        {history && currentEpoch > 0 && (
          <div className="training-metrics">
            <div className="training-metric">
              <span className="metric-label">Loss</span>
              <span className="metric-value metric-loss">
                {history.loss[history.loss.length - 1]?.toFixed(4)}
              </span>
            </div>
            <div className="training-metric">
              <span className="metric-label">Accuracy</span>
              <span className="metric-value metric-acc">
                {(history.accuracy[history.accuracy.length - 1] * 100)?.toFixed(2)}%
              </span>
            </div>
            <div className="training-metric">
              <span className="metric-label">Val Loss</span>
              <span className="metric-value metric-val-loss">
                {history.val_loss[history.val_loss.length - 1]?.toFixed(4)}
              </span>
            </div>
            <div className="training-metric">
              <span className="metric-label">Val Acc</span>
              <span className="metric-value metric-val-acc">
                {(history.val_accuracy[history.val_accuracy.length - 1] * 100)?.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {/* Charts */}
        {history && history.loss.length > 1 && (
          <>
            <ResultsChart
              history={history}
              title="Loss"
              metrics={["loss", "val_loss"]}
            />
            <ResultsChart
              history={history}
              title="Accuracy"
              metrics={["accuracy", "val_accuracy"]}
            />
          </>
        )}

        {/* Summary */}
        {status === "complete" && summary && (
          <div className="training-summary">
            <h4 className="summary-title">Results Summary</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Final Loss</span>
                <span className="summary-value">{summary.finalLoss}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Final Accuracy</span>
                <span className="summary-value">{summary.finalAccuracy}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Val Loss</span>
                <span className="summary-value">{summary.finalValLoss}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Val Accuracy</span>
                <span className="summary-value">{summary.finalValAccuracy}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingPanel;
