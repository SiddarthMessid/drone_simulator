export interface PIDParams {
  pitch: { kp: number; ki: number; kd: number };
  roll: { kp: number; ki: number; kd: number };
  yaw: { kp: number; ki: number; kd: number };
  altitude: { kp: number; ki: number; kd: number };
}

export interface PIDState {
  pitch: number;
  roll: number;
  yaw: number;
  altitude: number;
}

export interface PIDSetpoints {
  pitch: number;
  roll: number;
  yaw: number;
  throttle: number;
}

export interface PIDOutputs {
  pitch: number;
  roll: number;
  yaw: number;
  throttle: number;
}

export class PIDController {
  private params: PIDParams;
  private integral: PIDState;
  private previousError: PIDState;
  private lastTime: number;

  constructor(params: PIDParams) {
    this.params = params;
    this.integral = { pitch: 0, roll: 0, yaw: 0, altitude: 0 };
    this.previousError = { pitch: 0, roll: 0, yaw: 0, altitude: 0 };
    this.lastTime = performance.now();
  }

  updateParams(newParams: PIDParams) {
    this.params = newParams;
  }

  update(currentState: PIDState, setpoints: PIDSetpoints, deltaTime: number): PIDOutputs {
    const now = performance.now();
    const dt = Math.min(deltaTime, 0.1); // Cap delta time to prevent instability

    // Calculate errors
    const errors = {
      pitch: setpoints.pitch - currentState.pitch,
      roll: setpoints.roll - currentState.roll,
      yaw: setpoints.yaw - currentState.yaw,
      altitude: setpoints.throttle // Use throttle input for altitude control
    };

    // Calculate PID for each axis
    const outputs: PIDOutputs = {
      pitch: this.calculatePID('pitch', errors.pitch, dt),
      roll: this.calculatePID('roll', errors.roll, dt),
      yaw: this.calculatePID('yaw', errors.yaw, dt),
      throttle: this.calculatePID('altitude', errors.altitude, dt)
    };

    // Update previous errors
    this.previousError = {
      pitch: errors.pitch,
      roll: errors.roll,
      yaw: errors.yaw,
      altitude: errors.altitude
    };

    this.lastTime = now;
    return outputs;
  }

  private calculatePID(axis: keyof PIDParams, error: number, dt: number): number {
    const params = this.params[axis];
    
    // Proportional term
    const proportional = params.kp * error;
    
    // Integral term with windup protection
    this.integral[axis] += error * dt;
    const maxIntegral = 10; // Prevent integral windup
    this.integral[axis] = Math.max(-maxIntegral, Math.min(maxIntegral, this.integral[axis]));
    const integral = params.ki * this.integral[axis];
    
    // Derivative term
    const derivative = params.kd * (error - this.previousError[axis]) / dt;
    
    // Combine PID terms
    const output = proportional + integral + derivative;
    
    // Clamp output to reasonable range
    return Math.max(-2, Math.min(2, output));
  }

  reset() {
    this.integral = { pitch: 0, roll: 0, yaw: 0, altitude: 0 };
    this.previousError = { pitch: 0, roll: 0, yaw: 0, altitude: 0 };
  }
}
