import { useEffect, useRef, useState } from "react";
import { useEditor } from "../lib/stores/useEditor";
import { compileCode } from "../lib/codeCompiler";
import { useDrone } from "../lib/stores/useDrone";
import { useFileSystem } from "../lib/stores/useFileSystem";
import { Play, FileCode, Info, X, Save } from "lucide-react";

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #1e1e1e;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #424242;
    border-radius: 5px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #4e4e4e;
  }
  
  .custom-scrollbar::-webkit-scrollbar-corner {
    background: #1e1e1e;
  }
`;

export default function CodeEditor() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const { code, setCode, error, setError, setIsFocused } = useEditor();
  const { updatePIDParams, telemetry } = useDrone();
  const { currentFileId, getCurrentFile, updateFile } = useFileSystem();
  const [isCompiling, setIsCompiling] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const defaultCode = `def get_pid_parameters():
    return {
        'pitch': {
            'kp': 2.0,
            'ki': 0.1,
            'kd': 0.5
        },
        'roll': {
            'kp': 2.0,
            'ki': 0.1,
            'kd': 0.5
        },
        'yaw': {
            'kp': 1.5,
            'ki': 0.05,
            'kd': 0.3
        },
        'altitude': {
            'kp': 3.0,
            'ki': 0.2,
            'kd': 1.0
        }
    }`;

  // Load file when currentFileId changes
  useEffect(() => {
    const currentFile = getCurrentFile();
    if (currentFile) {
      setCode(currentFile.content);
      setHasUnsavedChanges(false);
    } else if (!code) {
      setCode(defaultCode);
    }
  }, [currentFileId]);

  // Track unsaved changes
  useEffect(() => {
    const currentFile = getCurrentFile();
    if (currentFile && code !== currentFile.content) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [code, currentFileId]);

  // Save file function
  const saveFile = () => {
    if (currentFileId) {
      updateFile(currentFileId, code);
      setHasUnsavedChanges(false);
      setSuccessMessage("File saved!");
      setTimeout(() => setSuccessMessage(""), 2000);
    }
  };

  useEffect(() => {
    updateLineNumbers();
    updateHighlight();
  }, [code]);

  const updateLineNumbers = () => {
    if (lineNumbersRef.current) {
      const lines = code.split("\n").length;
      const lineNumbersHtml = Array.from({ length: lines }, (_, i) => i + 1)
        .map(
          (num) =>
            `<div style="height: 21px; padding: 0 8px; text-align: right; color: #6b7280; user-select: none;">${num}</div>`
        )
        .join("");
      lineNumbersRef.current.innerHTML = lineNumbersHtml;
    }
  };

  const syntaxHighlight = (text: string): string => {
    // Escape HTML first
    let highlighted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Store protected patterns with placeholders
    const protectedPatterns: { placeholder: string; replacement: string }[] =
      [];
    let placeholderIndex = 0;

    // Helper to protect a pattern
    const protect = (match: string, color: string) => {
      const placeholder = `___PROTECTED_${placeholderIndex++}___`;
      protectedPatterns.push({
        placeholder,
        replacement: `<span style="color: ${color};">${match}</span>`,
      });
      return placeholder;
    };

    // 1. Protect strings first (highest priority)
    highlighted = highlighted.replace(
      /(['"`])((?:\\.|(?!\1).)*?)\1/g,
      (match) => protect(match, "#ce9178")
    );

    // 2. Protect preprocessor directives (C/C++ #include, #define, etc.)
    highlighted = highlighted.replace(/^[ \t]*#\w+.*$/gm, (match) =>
      protect(match, "#c586c0")
    );

    // 3. Protect comments (Python # and JavaScript //)
    highlighted = highlighted.replace(
      /#.*$|\/\/.*$|\/\*[\s\S]*?\*\//gm,
      (match) => protect(match, "#6a9955")
    );

    // 4. Apply keywords
    highlighted = highlighted.replace(
      /\b(def|return|if|else|elif|for|while|in|import|from|class|try|except|finally|with|as|pass|break|continue|lambda|yield|async|await|function|const|let|var|new|this|null|undefined|true|false|include)\b/g,
      '<span style="color: #569cd6;">$1</span>'
    );

    // 5. Apply numbers
    highlighted = highlighted.replace(
      /\b(\d+\.?\d*)\b/g,
      '<span style="color: #b5cea8;">$1</span>'
    );

    // 6. Apply function names
    highlighted = highlighted.replace(
      /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
      '<span style="color: #dcdcaa;">$1</span>'
    );

    // Restore protected patterns
    protectedPatterns.forEach(({ placeholder, replacement }) => {
      highlighted = highlighted.replace(placeholder, replacement);
    });

    return highlighted;
  };

  const updateHighlight = () => {
    if (highlightRef.current) {
      const highlighted = syntaxHighlight(code);
      highlightRef.current.innerHTML = highlighted + "<br/>";
    }
  };

  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current && highlightRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const getIndentation = (line: string): string => {
    const match = line.match(/^(\s*)/);
    return match ? match[1] : "";
  };

  const handleCompile = () => {
    setIsCompiling(true);
    setError("");

    try {
      const result = compileCode(code, telemetry);

      if (result.success) {
        if (result.mode === "pid" && result.pidParams) {
          updatePIDParams(result.pidParams);
          setSuccessMessage("PID parameters compiled successfully");
        } else if (result.mode === "drone") {
          setSuccessMessage("Drone commands executed successfully");
        }

        setError("");

        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        setError(result.error || "Compilation failed");
        setSuccessMessage("");
      }
    } catch (err) {
      setError(`Compilation error: ${err}`);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    // Tab key - insert 4 spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const newValue =
        value.substring(0, start) + "    " + value.substring(end);
      setCode(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
    // Enter key - auto-indent
    else if (e.key === "Enter") {
      e.preventDefault();

      // Get current line
      const beforeCursor = value.substring(0, start);
      const currentLineStart = beforeCursor.lastIndexOf("\n") + 1;
      const currentLine = value.substring(currentLineStart, start);

      // Get indentation of current line
      let indent = getIndentation(currentLine);

      // Check if current line ends with : (Python) or { (JavaScript)
      const trimmedLine = currentLine.trim();
      if (trimmedLine.endsWith(":") || trimmedLine.endsWith("{")) {
        indent += "    "; // Add extra indentation
      }

      const newValue =
        value.substring(0, start) + "\n" + indent + value.substring(end);
      setCode(newValue);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd =
          start + 1 + indent.length;
      }, 0);
    }
    // Ctrl+Enter - compile
    else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleCompile();
    }
    // Backspace - smart dedent
    else if (e.key === "Backspace") {
      const beforeCursor = value.substring(0, start);
      const currentLineStart = beforeCursor.lastIndexOf("\n") + 1;
      const currentLine = value.substring(currentLineStart, start);

      // If cursor is after whitespace only, delete 4 spaces at once
      if (
        currentLine.match(/^\s+$/) &&
        currentLine.length % 4 === 0 &&
        start === end
      ) {
        e.preventDefault();
        const newValue = value.substring(0, start - 4) + value.substring(end);
        setCode(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start - 4;
        }, 0);
      }
    }
  };

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#1e1e1e",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            paddingRight: "50px",
            background: "#252526",
            borderBottom: "1px solid #3e3e42",
            minHeight: "35px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileCode size={16} style={{ color: "#858585" }} />
            <span
              style={{ fontSize: "13px", color: "#cccccc", fontWeight: "500" }}
            >
              {getCurrentFile()?.name || "Untitled"}
              {hasUnsavedChanges && (
                <span style={{ color: "#f85149", marginLeft: "6px" }}>●</span>
              )}
            </span>
            <button
              onClick={() => setShowInfo(!showInfo)}
              style={{
                background: "transparent",
                border: "none",
                color: "#858585",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                borderRadius: "4px",
                marginLeft: "4px",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#2a2d2e")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Info size={16} />
            </button>
          </div>
          <div style={{ width: "1px" }} />
        </div>

        {/* Info Panel */}
        {showInfo && (
          <div
            style={{
              padding: "12px",
              background: "#1e1e1e",
              borderBottom: "1px solid #3e3e42",
              fontSize: "12px",
              color: "#cccccc",
              lineHeight: "1.6",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
              }}
            >
              <div>
                <div style={{ color: "#858585", marginBottom: "8px" }}>
                  Available Telemetry Variables:
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "4px",
                    fontSize: "11px",
                  }}
                >
                  <span>• altitude (meters)</span>
                  <span>• speed (m/s)</span>
                  <span>• pitch (degrees)</span>
                  <span>• roll (degrees)</span>
                  <span>• yaw (degrees)</span>
                  <span>• throttle (0-1)</span>
                </div>
                <div style={{ marginTop: "8px", color: "#858585" }}>
                  Shortcuts:{" "}
                  <span style={{ color: "#cccccc" }}>Ctrl+Enter</span> to
                  compile
                </div>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#858585",
                  cursor: "pointer",
                  padding: "2px",
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Line Numbers */}
          <div
            ref={lineNumbersRef}
            style={{
              background: "#1e1e1e",
              borderRight: "1px solid #3e3e42",
              fontSize: "14px",
              fontFamily:
                '"Fira Code", "Cascadia Code", Consolas, Monaco, monospace',
              lineHeight: "1.5",
              overflow: "hidden",
              paddingTop: "12px",
              minWidth: "50px",
            }}
          />

          {/* Editor Container */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            {/* Syntax Highlighted Background */}
            <pre
              ref={highlightRef}
              className="custom-scrollbar"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                margin: 0,
                padding: "12px 16px",
                fontSize: "14px",
                fontFamily:
                  '"Fira Code", "Cascadia Code", Consolas, Monaco, monospace',
                lineHeight: "1.5",
                color: "#d4d4d4",
                background: "#1e1e1e",
                whiteSpace: "pre",
                overflowWrap: "normal",
                overflow: "auto",
                pointerEvents: "none",
                wordWrap: "normal",
                wordBreak: "normal",
              }}
            />

            {/* Code Textarea (transparent) */}
            <textarea
              ref={textareaRef}
              className="custom-scrollbar"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "transparent",
                color: "transparent",
                caretColor: "#aeafad",
                border: "none",
                padding: "12px 16px",
                fontSize: "14px",
                fontFamily:
                  '"Fira Code", "Cascadia Code", Consolas, Monaco, monospace',
                lineHeight: "1.5",
                resize: "none",
                outline: "none",
                whiteSpace: "pre",
                overflowWrap: "normal",
                overflow: "auto",
                wordWrap: "normal",
                wordBreak: "normal",
              }}
              placeholder="Write your code here..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* Status Bar */}
        {(successMessage || error) && (
          <div
            style={{
              padding: "8px 12px",
              background: successMessage ? "#1e3a1e" : "#3e1e1e",
              borderTop: successMessage
                ? "1px solid #2ea043"
                : "1px solid #f85149",
              fontSize: "12px",
              color: successMessage ? "#7ee787" : "#ff7b72",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                background: successMessage ? "#2ea043" : "#f85149",
              }}
            />
            {successMessage || error}
          </div>
        )}

        {/* Action Bar */}
        <div
          style={{
            padding: "12px",
            background: "#252526",
            borderTop: "1px solid #3e3e42",
            display: "flex",
            gap: "8px",
          }}
        >
          <button
            onClick={handleCompile}
            disabled={isCompiling}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 16px",
              background: isCompiling ? "#0e639c" : "#0e639c",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: isCompiling ? "not-allowed" : "pointer",
              opacity: isCompiling ? 0.7 : 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!isCompiling) e.currentTarget.style.background = "#1177bb";
            }}
            onMouseLeave={(e) => {
              if (!isCompiling) e.currentTarget.style.background = "#0e639c";
            }}
          >
            <Play size={14} fill="white" />
            {isCompiling ? "Compiling..." : "Run Code"}
          </button>
        </div>
      </div>
    </>
  );
}
