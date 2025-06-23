import { useEffect, useRef, useState } from "react";
import { useEditor } from "../lib/stores/useEditor";
import { compileCode } from "../lib/codeCompiler";
import { useDrone } from "../lib/stores/useDrone";

export default function CodeEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { code, setCode, error, setError } = useEditor();
  const { updatePIDParams, telemetry } = useDrone();
  const [isCompiling, setIsCompiling] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const defaultCode = `# Custom PID Controller for Drone
# Modify the parameters below to change drone behavior
# 
# LIVE TELEMETRY VARIABLES AVAILABLE:
# - altitude: Current drone altitude (meters)
# - speed: Current drone speed (m/s)
# - pitch: Current pitch angle (degrees)
# - roll: Current roll angle (degrees) 
# - yaw: Current yaw angle (degrees)
# - throttle: Current throttle input (0-1)

def get_pid_parameters():
    """
    Return PID parameters for pitch, roll, yaw, and altitude control
    You can use live telemetry variables to create dynamic PID controllers
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

# Example: Dynamic PID based on altitude
def get_dynamic_pid_parameters():
    """
    Example of using live telemetry for dynamic PID control
    """
    # Reduce gains at high altitude for stability
    altitude_factor = 1.0 if altitude < 20 else 0.8
    
    # Increase yaw gain based on current speed for better control
    speed_factor = 1.0 + (speed * 0.1)
    
    return {
        'pitch': {
            'kp': 2.0 * altitude_factor,
            'ki': 0.1 * altitude_factor,
            'kd': 0.5 * altitude_factor
        },
        'roll': {
            'kp': 2.0 * altitude_factor,
            'ki': 0.1 * altitude_factor,
            'kd': 0.5 * altitude_factor
        },
        'yaw': {
            'kp': 1.5 * speed_factor,
            'ki': 0.05,
            'kd': 0.3
        },
        'altitude': {
            'kp': 3.0,
            'ki': 0.2,
            'kd': 1.0
        }
    }

# Advanced: Custom gain adjustment based on multiple factors
def custom_gain_adjustment(base_gain, current_altitude, current_speed):
    """
    Example: Adjust gains based on multiple telemetry variables
    """
    factor = 1.0
    
    # Reduce gain at high altitude
    if current_altitude > 20:
        factor *= 0.8
    
    # Increase gain at high speed for better responsiveness
    if current_speed > 10:
        factor *= 1.2
        
    return base_gain * factor`;

  useEffect(() => {
    if (!code) {
      setCode(defaultCode);
    }
  }, []);

  const handleCompile = () => {
    setIsCompiling(true);
    setError("");
    
    console.log("Starting compilation...");
    console.log("Code to compile:", code);
    
    try {
      const result = compileCode(code, telemetry);
      console.log("Compilation result:", result);
      
      if (result.success && result.pidParams) {
        updatePIDParams(result.pidParams);
        console.log("✅ PID parameters successfully updated:", result.pidParams);
        setError(""); // Clear any previous errors
        setSuccessMessage("✅ Code compiled and PID parameters updated successfully!");
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        console.error("❌ Compilation failed:", result.error);
        setError(result.error || "Compilation failed - unknown error");
        setSuccessMessage(""); // Clear any previous success message
      }
    } catch (err) {
      console.error("❌ Compilation exception:", err);
      setError(`Compilation error: ${err}`);
    } finally {
      setIsCompiling(false);
      console.log("Compilation process finished");
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

      {/* Success Display */}
      {successMessage && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(34, 197, 94, 0.1)',
          borderTop: '1px solid rgba(34, 197, 94, 0.3)',
          color: '#86efac',
          fontSize: '12px',
          fontFamily: 'Monaco, Consolas, "Courier New", monospace'
        }}>
          {successMessage}
        </div>
      )}

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
