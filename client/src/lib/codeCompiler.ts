import { PIDParams } from "./pidController";

interface CompilationResult {
  success: boolean;
  pidParams?: PIDParams;
  error?: string;
}

export function compileCode(code: string): CompilationResult {
  try {
    // Remove Python comments and clean up the code
    const cleanCode = code
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .join(' ');

    // Extract the get_pid_parameters function content
    const functionMatch = cleanCode.match(/def\s+get_pid_parameters\s*\(\s*\)\s*:(.*?)(?=def\s+|$)/s);
    
    if (!functionMatch) {
      return {
        success: false,
        error: "Could not find get_pid_parameters() function"
      };
    }

    const functionBody = functionMatch[1];
    
    // Extract return statement
    const returnMatch = functionBody.match(/return\s+\{(.*?)\}/s);
    
    if (!returnMatch) {
      return {
        success: false,
        error: "Could not find return statement with dictionary"
      };
    }

    // Parse the PID parameters manually
    const pidParams = parsePIDParameters(code);
    
    if (!pidParams) {
      return {
        success: false,
        error: "Failed to parse PID parameters from code"
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
      Object.values(axis).every(value => !isNaN(value) && value >= 0)
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
      
      if (isNaN(value) || value < 0) {
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
