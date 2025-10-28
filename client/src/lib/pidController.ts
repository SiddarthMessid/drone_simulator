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
  // For derivative filtering
  private previousDerivative: PIDState = { pitch: 0, roll: 0, yaw: 0, altitude: 0 };
  private derivativeTau: number = 0.05; // seconds for derivative low-pass

  // Throttle smoothing / rate limiting (units/sec)
  private lastThrottle: number = 0.5;
  private throttleRateLimit: number = 1.5; // units per second

  // Yaw setpoint smoothing (rate limit in rad/sec)
  private lastYawSetpoint: number = 0;
  private yawRateLimit: number = 1.0; // rad/s

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

    // Smooth yaw setpoint to limit instantaneous yaw setpoint jumps
    const desiredYaw = setpoints.yaw;
    const maxYawDelta = this.yawRateLimit * dt;
    const yawDelta = desiredYaw - this.lastYawSetpoint;
    const clippedYawDelta = Math.max(-maxYawDelta, Math.min(maxYawDelta, yawDelta));
    const smoothedYaw = this.lastYawSetpoint + clippedYawDelta;

    // Calculate errors (use smoothed yaw)
    const errors = {
      pitch: setpoints.pitch - currentState.pitch,
      roll: setpoints.roll - currentState.roll,
      yaw: smoothedYaw - currentState.yaw
    };

    // Calculate PID for attitude axes. Throttle (altitude) is handled by the high-level controller
    const outputs: PIDOutputs = {
      pitch: this.calculatePID('pitch', errors.pitch, dt),
      roll: this.calculatePID('roll', errors.roll, dt),
      yaw: this.calculatePID('yaw', errors.yaw, dt),
      // Throttle: apply rate limit smoothing here (units/sec)
      throttle: this.applyThrottleRateLimit(Math.max(0, Math.min(1, setpoints.throttle)), dt)
    };

    // store smoothed yaw
    this.lastYawSetpoint = smoothedYaw;

    // Update previous errors (keep altitude previous error unchanged because throttle is a direct setpoint)
    this.previousError = {
      pitch: errors.pitch,
      roll: errors.roll,
      yaw: errors.yaw,
      altitude: this.previousError.altitude
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
    
  // Derivative term (with low-pass filtering to reduce noise)
  const rawDerivative = (error - this.previousError[axis]) / Math.max(dt, 1e-6);
  const alpha = Math.max(0, Math.min(1, dt / (this.derivativeTau + dt)));
  this.previousDerivative[axis] = this.previousDerivative[axis] + (rawDerivative - this.previousDerivative[axis]) * alpha;
  const derivative = params.kd * this.previousDerivative[axis];
    
    // Combine PID terms
    const output = proportional + integral + derivative;
    
    // Clamp output to reasonable range
    return Math.max(-2, Math.min(2, output));
  }

  private applyThrottleRateLimit(desired: number, dt: number): number {
    const maxDelta = this.throttleRateLimit * dt;
    const delta = desired - this.lastThrottle;
    const clipped = Math.max(-maxDelta, Math.min(maxDelta, delta));
    const out = this.lastThrottle + clipped;
    this.lastThrottle = out;
    return out;
  }

  reset() {
    this.integral = { pitch: 0, roll: 0, yaw: 0, altitude: 0 };
    this.previousError = { pitch: 0, roll: 0, yaw: 0, altitude: 0 };
  }
}
