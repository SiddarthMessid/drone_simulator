import { useEffect, useRef, useState } from "react";
import { useEditor } from "../lib/stores/useEditor";
import { compileCode } from "../lib/codeCompiler";
import { useDrone } from "../lib/stores/useDrone";

export default function CodeEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { code, setCode, error, setError } = useEditor();
  const { updatePIDParams } = useDrone();
  const [isCompiling, setIsCompiling] = useState(false);

  const defaultCode = `# Custom PID Controller for Drone
# Modify the parameters below to change drone behavior

def get_pid_parameters():
    """
    Return PID parameters for pitch, roll, yaw, and altitude control
    """
    return {
        'pitch': {
            'kp': 2.0,    # Proportional gain
            'ki': 0.1,    # Integral gain  
            'kd': 0.5     # Derivative gain
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
    }

# You can add custom functions here
def custom_gain_adjustment(base_gain, altitude):
    """
    Example: Adjust gains based on altitude
    """
    if altitude > 20:
        return base_gain * 0.8  # Reduce gain at high altitude
    return base_gain

# Advanced users can implement custom control logic
def advanced_pid_logic(error, dt):
    """
    Custom PID calculation logic
    """
    return error * 2.0  # Simple proportional control example`;

  useEffect(() => {
    if (!code) {
      setCode(defaultCode);
    }
  }, []);

  const handleCompile = () => {
    setIsCompiling(true);
    setError("");
    
    try {
      const result = compileCode(code);
      if (result.success && result.pidParams) {
        updatePIDParams(result.pidParams);
        console.log("PID parameters updated:", result.pidParams);
      } else {
        setError(result.error || "Compilation failed");
      }
    } catch (err) {
      setError(`Compilation error: ${err}`);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const newValue = value.substring(0, start) + '    ' + value.substring(end);
        setCode(newValue);
        
        // Reset cursor position
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 4;
        }, 0);
      }
    }
  };

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      color: '#e5e5e5'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(30, 30, 30, 0.9)'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
          PID Controller Code
        </h3>
        <p style={{ margin: 0, fontSize: '12px', color: '#a0a0a0' }}>
          Modify the PID parameters and custom logic below
        </p>
      </div>

      {/* Code Editor */}
      <div style={{ flex: 1, position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            height: '100%',
            background: 'rgba(15, 15, 15, 0.95)',
            color: '#e5e5e5',
            border: 'none',
            padding: '16px',
            fontSize: '14px',
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            lineHeight: '1.5',
            resize: 'none',
            outline: 'none',
            whiteSpace: 'pre',
            overflowWrap: 'normal',
            overflowX: 'auto'
          }}
          placeholder="Enter your PID controller code here..."
          spellCheck={false}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(220, 38, 38, 0.1)',
          borderTop: '1px solid rgba(220, 38, 38, 0.3)',
          color: '#fca5a5',
          fontSize: '12px',
          fontFamily: 'Monaco, Consolas, "Courier New", monospace'
        }}>
          {error}
        </div>
      )}

      {/* Compile Button */}
      <div style={{ 
        padding: '16px', 
        borderTop: '1px solid rgba(255, 255, 255, 0.1)' 
      }}>
        <button
          onClick={handleCompile}
          disabled={isCompiling}
          style={{
            width: '100%',
            padding: '12px',
            background: isCompiling ? '#4a5568' : '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isCompiling ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {isCompiling ? 'Compiling...' : 'Compile & Apply'}
        </button>
      </div>
    </div>
  );
}
