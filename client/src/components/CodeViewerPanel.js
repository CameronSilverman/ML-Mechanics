import React, { useState, useCallback, useEffect, useRef } from "react";

const highlightPython = (code) => {
  const lines = code.split("\n");
  return lines.map((line, i) => {
    // Single-pass tokenizer: find strings, comments, keywords, numbers, functions
    // and replace them all at once so they don't interfere
    let highlighted = "";
    let j = 0;
    while (j < line.length) {
      // Comment — consumes rest of line
      if (line[j] === "#") {
        highlighted += `<span class="code-comment">${escapeHtml(line.slice(j))}</span>`;
        j = line.length;
      }
      // Double-quoted string
      else if (line[j] === '"') {
        const end = findStringEnd(line, j, '"');
        highlighted += `<span class="code-string">${escapeHtml(line.slice(j, end))}</span>`;
        j = end;
      }
      // Single-quoted string
      else if (line[j] === "'") {
        const end = findStringEnd(line, j, "'");
        highlighted += `<span class="code-string">${escapeHtml(line.slice(j, end))}</span>`;
        j = end;
      }
      // Word (keyword, function call, or plain identifier)
      else if (/[a-zA-Z_]/.test(line[j])) {
        let end = j;
        while (end < line.length && /\w/.test(line[end])) end++;
        const word = line.slice(j, end);
        if (KEYWORDS.has(word)) {
          highlighted += `<span class="code-keyword">${word}</span>`;
        } else if (end < line.length && line[end] === "(") {
          highlighted += `<span class="code-func">${word}</span>`;
        } else {
          highlighted += word;
        }
        j = end;
      }
      // Number
      else if (/\d/.test(line[j])) {
        let end = j;
        while (end < line.length && /[\d.]/.test(line[end])) end++;
        highlighted += `<span class="code-number">${line.slice(j, end)}</span>`;
        j = end;
      }
      // Anything else (operators, whitespace, punctuation)
      else {
        highlighted += escapeHtml(line[j]);
        j++;
      }
    }

    return (
      <div key={i} className="code-line">
        <span className="code-line-number">{i + 1}</span>
        <span dangerouslySetInnerHTML={{ __html: highlighted }} />
      </div>
    );
  });
};

const KEYWORDS = new Set([
  "import", "from", "as", "def", "class", "return", "if", "else",
  "for", "in", "while", "True", "False", "None", "print",
]);

const escapeHtml = (str) =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const findStringEnd = (line, start, quote) => {
  let i = start + 1;
  while (i < line.length) {
    if (line[i] === "\\") { i += 2; continue; }
    if (line[i] === quote) return i + 1;
    i++;
  }
  return line.length; // unclosed string
};

const MIN_WIDTH = 300;
const MAX_WIDTH = 900;

const CodeViewerPanel = ({ code, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [panelWidth, setPanelWidth] = useState(400);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(400);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ml_pipeline.py";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = panelWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [panelWidth]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    // Dragging left increases width, dragging right decreases
    const delta = startX.current - e.clientX;
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
    setPanelWidth(newWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      className="side-panel code-panel"
      style={{ width: panelWidth, minWidth: panelWidth }}
    >
      <div className="resize-handle" onMouseDown={handleMouseDown} />
      <div className="side-panel-header">
        <span className="side-panel-title">Generated Python Code</span>
        <button className="side-panel-close" onClick={onClose}>✕</button>
      </div>
      <div className="code-panel-actions">
        <button className="code-action-btn" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </button>
        <button className="code-action-btn" onClick={handleDownload}>
          Download .py
        </button>
      </div>
      <div className="code-content">
        <pre className="code-block">
          {highlightPython(code)}
        </pre>
      </div>
    </div>
  );
};

export default CodeViewerPanel;