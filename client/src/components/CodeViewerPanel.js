import React, { useState } from "react";

const highlightPython = (code) => {
  const lines = code.split("\n");
  return lines.map((line, i) => {
    let highlighted = line
      // Comments
      .replace(/(#.*)$/g, '<span class="code-comment">$1</span>')
      // Strings (double and single quoted)
      .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="code-string">$1</span>')
      // Keywords
      .replace(
        /\b(import|from|as|def|class|return|if|else|for|in|while|True|False|None|print)\b/g,
        '<span class="code-keyword">$1</span>'
      )
      // Numbers
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="code-number">$1</span>')
      // Function calls
      .replace(/\b(\w+)(\()/g, '<span class="code-func">$1</span>$2');

    return (
      <div key={i} className="code-line">
        <span className="code-line-number">{i + 1}</span>
        <span dangerouslySetInnerHTML={{ __html: highlighted }} />
      </div>
    );
  });
};

const CodeViewerPanel = ({ code, onClose }) => {
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="side-panel code-panel">
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
