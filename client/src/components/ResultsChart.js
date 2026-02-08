import React, { useRef, useEffect } from "react";

const COLORS = {
  loss: "#ef4444",
  val_loss: "#f97316",
  accuracy: "#3b82f6",
  val_accuracy: "#10b981",
};

const LABELS = {
  loss: "Train Loss",
  val_loss: "Val Loss",
  accuracy: "Train Acc",
  val_accuracy: "Val Acc",
};

const ResultsChart = ({ history, title, metrics }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !history) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 30, right: 15, bottom: 30, left: 45 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    // Clear
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = "#e8ecf4";
    ctx.font = "bold 12px IBM Plex Sans, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(title, w / 2, 18);

    // Find data range
    let allValues = [];
    for (const key of metrics) {
      if (history[key]) allValues.push(...history[key]);
    }
    if (allValues.length === 0) return;

    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const range = maxVal - minVal || 1;
    const epochs = Math.max(...metrics.map((k) => (history[k] || []).length));

    // Grid lines
    ctx.strokeStyle = "#253048";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();

      ctx.fillStyle = "#5a6478";
      ctx.font = "10px IBM Plex Mono, monospace";
      ctx.textAlign = "right";
      const val = maxVal - (range / 4) * i;
      ctx.fillText(val.toFixed(2), pad.left - 5, y + 3);
    }

    // X axis labels
    ctx.fillStyle = "#5a6478";
    ctx.font = "10px IBM Plex Mono, monospace";
    ctx.textAlign = "center";
    const xStep = Math.max(1, Math.floor(epochs / 5));
    for (let i = 0; i < epochs; i += xStep) {
      const x = pad.left + (i / Math.max(1, epochs - 1)) * plotW;
      ctx.fillText(i + 1, x, h - pad.bottom + 15);
    }
    // Always show last epoch
    if (epochs > 1) {
      const x = pad.left + plotW;
      ctx.fillText(epochs, x, h - pad.bottom + 15);
    }

    // Draw lines
    for (const key of metrics) {
      const data = history[key];
      if (!data || data.length === 0) continue;

      ctx.strokeStyle = COLORS[key] || "#3b82f6";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.beginPath();

      for (let i = 0; i < data.length; i++) {
        const x = pad.left + (i / Math.max(1, epochs - 1)) * plotW;
        const y = pad.top + plotH - ((data[i] - minVal) / range) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Legend
    const legendX = pad.left + 5;
    let legendY = pad.top + 10;
    for (const key of metrics) {
      ctx.fillStyle = COLORS[key] || "#3b82f6";
      ctx.fillRect(legendX, legendY - 4, 10, 3);
      ctx.fillStyle = "#8892a8";
      ctx.font = "10px IBM Plex Sans, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(LABELS[key] || key, legendX + 14, legendY);
      legendY += 14;
    }
  }, [history, title, metrics]);

  return (
    <canvas
      ref={canvasRef}
      className="results-chart"
      style={{ width: "100%", height: "200px" }}
    />
  );
};

export default ResultsChart;
