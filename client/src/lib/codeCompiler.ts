import { PIDParams } from "./pidController";

interface CompilationResult {
  success: boolean;
  pidParams?: PIDParams;
  error?: string;
}

export function compileCode(code: string): CompilationResult {
  try {
    console.log("Compiling Python-like code:", code);

    // Create a safe execution environment that mimics Python
    const compilationResult = executePythonLikeCode(code);
    
    if (!compilationResult.success) {
      return compilationResult;
    }

    // Parse the PID parameters from the executed result
    const pidParams = parsePIDParameters(code);
    
    if (!pidParams) {
      return {
        success: false,
        error: "Failed to extract PID parameters from get_pid_parameters() function"
      };
    }

    // Validate parameters
    const validation = validatePIDParams(pidParams);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    console.log("Compilation successful. PID parameters:", pidParams);

    return {
      success: true,
      pidParams
    };

  } catch (error) {
    return {
      success: false,
      error: `Compilation error: ${error}`
    };
  }
}

function executePythonLikeCode(code: string): CompilationResult {
  try {
    // Check for required function
    if (!code.includes('def get_pid_parameters()')) {
      return {
        success: false,
        error: "Missing required function: get_pid_parameters()"
      };
    }

    // Check for return statement
    if (!code.includes('return {') && !code.includes('return{')) {
      return {
        success: false,
        error: "get_pid_parameters() function must return a dictionary"
      };
    }

    // Basic syntax validation
    const lines = code.split('\n');
    let indentLevel = 0;
    let inFunction = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;

      // Check function definition
      if (line.startsWith('def ')) {
        if (!line.endsWith(':')) {
          return {
            success: false,
            error: `Line ${i + 1}: Function definition must end with ':'`
          };
        }
        inFunction = true;
        continue;
      }

      // Check indentation in function
      if (inFunction && line && !line.startsWith(' ') && !line.startsWith('\t') && !line.startsWith('def ')) {
        return {
          success: false,
          error: `Line ${i + 1}: Code inside function must be indented`
        };
      }

      // Check for balanced braces in return statement
      if (line.includes('return {')) {
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        
        let j = i;
        let totalOpen = openBraces;
        let totalClose = closeBraces;
        
        // Check subsequent lines for closing braces if needed
        while (totalOpen > totalClose && j < lines.length - 1) {
          j++;
          const nextLine = lines[j].trim();
          totalOpen += (nextLine.match(/\{/g) || []).length;
          totalClose += (nextLine.match(/\}/g) || []).length;
        }
        
        if (totalOpen !== totalClose) {
          return {
            success: false,
            error: `Line ${i + 1}: Unmatched braces in return statement`
          };
        }
      }
    }

    // Simulate Python execution by evaluating mathematical expressions
    const mathExpressions = code.match(/[\d.]+\s*[\+\-\*\/]\s*[\d.]+/g);
    if (mathExpressions) {
      for (const expr of mathExpressions) {
        try {
          // Safely evaluate simple mathematical expressions
          const result = Function(`"use strict"; return (${expr})`)();
          if (!isFinite(result)) {
            return {
              success: false,
              error: `Invalid mathematical expression: ${expr}`
            };
          }
        } catch (e) {
          return {
            success: false,
            error: `Error in mathematical expression: ${expr}`
          };
        }
      }
    }

    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: `Python syntax error: ${error}`
    };
  }
}

function parsePIDParameters(code: string): PIDParams | null {
  try {
    // Extract numeric values from the code using regex
    const extractParam = (axis: string, param: string): number => {
      const pattern = new RegExp(`'${axis}'[\\s\\S]*?'${param}'\\s*:\\s*([0-9]*\\.?[0-9]+)`, 'i');
      const match = code.match(pattern);
      return match ? parseFloat(match[1]) : 0;
    };

    const pidParams: PIDParams = {
      pitch: {
        kp: extractParam('pitch', 'kp'),
        ki: extractParam('pitch', 'ki'),
        kd: extractParam('pitch', 'kd')
      },
      roll: {
        kp: extractParam('roll', 'kp'),
        ki: extractParam('roll', 'ki'),
        kd: extractParam('roll', 'kd')
      },
      yaw: {
        kp: extractParam('yaw', 'kp'),
        ki: extractParam('yaw', 'ki'),
        kd: extractParam('yaw', 'kd')
      },
      altitude: {
        kp: extractParam('altitude', 'kp'),
        ki: extractParam('altitude', 'ki'),
        kd: extractParam('altitude', 'kd')
      }
    };

    // Check if we got valid values
    const hasValidValues = Object.values(pidParams).every(axis => 
      Object.values(axis).every(value => typeof value === 'number' && !isNaN(value) && value >= 0)
    );

    return hasValidValues ? pidParams : null;
  } catch (error) {
    console.error("Error parsing PID parameters:", error);
    return null;
  }
}

function validatePIDParams(params: PIDParams): { valid: boolean; error?: string } {
  const axes = ['pitch', 'roll', 'yaw', 'altitude'] as const;
  const pidTypes = ['kp', 'ki', 'kd'] as const;

  for (const axis of axes) {
    for (const pidType of pidTypes) {
      const value = params[axis][pidType];
      
      if (typeof value !== 'number' || isNaN(value) || value < 0) {
        return {
          valid: false,
          error: `Invalid ${pidType} value for ${axis}: ${value}. Must be a positive number.`
        };
      }
      
      if (value > 100) {
        return {
          valid: false,
          error: `${pidType} value for ${axis} is too large: ${value}. Maximum is 100.`
        };
      }
    }
  }

  return { valid: true };
}

// Default PID parameters
export const defaultPIDParams: PIDParams = {
  pitch: { kp: 2.0, ki: 0.1, kd: 0.5 },
  roll: { kp: 2.0, ki: 0.1, kd: 0.5 },
  yaw: { kp: 1.5, ki: 0.05, kd: 0.3 },
  altitude: { kp: 3.0, ki: 0.2, kd: 1.0 }
};
