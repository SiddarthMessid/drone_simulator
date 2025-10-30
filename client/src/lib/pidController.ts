/**
 * PID Controller
 * Proportional-Integral-Derivative controller for drone stabilization
 */

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
    private previousDerivative: PIDState;
    private derivativeTau: number = 0.05; // low-pass filter time constant
    private lastThrottle: number = 0.5;
    private throttleRateLimit: number = 1.5; // units/sec

    constructor(params: PIDParams) {
        this.params = params;
        this.integral = { pitch: 0, roll: 0, yaw: 0, altitude: 0 };
        this.previousError = { pitch: 0, roll: 0, yaw: 0, altitude: 0 };
        this.previousDerivative = { pitch: 0, roll: 0, yaw: 0, altitude: 0 };
    }

    updateParams(newParams: PIDParams): void {
        this.params = newParams;
    }

    update(currentState: PIDState, setpoints: PIDSetpoints, deltaTime: number): PIDOutputs {
        const dt = Math.min(deltaTime, 0.1); // cap for stability

        // Calculate errors with angle wrapping for yaw
        const errors = {
            pitch: setpoints.pitch - currentState.pitch,
            roll: setpoints.roll - currentState.roll,
            yaw: this.angleDifference(setpoints.yaw, currentState.yaw),
        };

        // Calculate PID outputs for attitude
        const outputs: PIDOutputs = {
            pitch: this.calculatePID('pitch', errors.pitch, dt),
            roll: this.calculatePID('roll', errors.roll, dt),
            yaw: this.calculatePID('yaw', errors.yaw, dt),
            throttle: this.applyThrottleRateLimit(Math.max(0, Math.min(1, setpoints.throttle)), dt),
        };

        // Update previous errors
        this.previousError = {
            pitch: errors.pitch,
            roll: errors.roll,
            yaw: errors.yaw,
            altitude: this.previousError.altitude,
        };

        return outputs;
    }

    private calculatePID(axis: keyof PIDParams, error: number, dt: number): number {
        const params = this.params[axis];

        // Proportional
        const proportional = params.kp * error;

        // Integral with anti-windup
        this.integral[axis] += error * dt;
        const maxIntegral = 10;
        this.integral[axis] = Math.max(-maxIntegral, Math.min(maxIntegral, this.integral[axis]));
        const integral = params.ki * this.integral[axis];

        // Derivative with low-pass filter
        const rawDerivative = (error - this.previousError[axis]) / Math.max(dt, 1e-6);
        const alpha = Math.max(0, Math.min(1, dt / (this.derivativeTau + dt)));
        this.previousDerivative[axis] += (rawDerivative - this.previousDerivative[axis]) * alpha;
        const derivative = params.kd * this.previousDerivative[axis];

        // Combine and clamp
        return Math.max(-2, Math.min(2, proportional + integral + derivative));
    }

    private angleDifference(target: number, current: number): number {
        let diff = target - current;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        return diff;
    }

    private applyThrottleRateLimit(desired: number, dt: number): number {
        const maxDelta = this.throttleRateLimit * dt;
        const delta = desired - this.lastThrottle;
        const clipped = Math.max(-maxDelta, Math.min(maxDelta, delta));
        this.lastThrottle += clipped;
        return this.lastThrottle;
    }

    reset(): void {
        this.integral = { pitch: 0, roll: 0, yaw: 0, altitude: 0 };
        this.previousError = { pitch: 0, roll: 0, yaw: 0, altitude: 0 };
        this.previousDerivative = { pitch: 0, roll: 0, yaw: 0, altitude: 0 };
    }
}
