import * as THREE from "three";
import { DroneAdapter, DroneState, DroneCommand, DroneControllerConfig } from './interfaces/drone';
import { PIDSetpoints, PIDParams } from './pidController';
import { DEFAULT_PHYSICS_CONFIG } from './physicsConfig';

const DEFAULT_CONFIG: DroneControllerConfig = {
  maxSpeed: 5.0,
  maxAltitude: 50.0,
  positionTolerance: 0.5,
  altitudeTolerance: 0.3,
  angleTolerance: 0.05,
  commandTimeout: 30000,
  safetyLimits: {
    maxTiltAngle: Math.PI / 3,
    maxYawRate: 2.0,
    maxVerticalSpeed: 3.0
  }
};

interface MovementTarget {
  position?: THREE.Vector3;
  altitude?: number;
  heading?: number;
  pitch?: number;
  roll?: number;
  throttle?: number;
}

/**
 * High-level drone control wrapper that provides an intuitive API
 * for controlling drone movement, takeoff, landing, and navigation.
 */
export class DroneController {
  private adapter: DroneAdapter;
  private state: DroneState | null = null;
  private currentCommand: DroneCommand | null = null;
  private commandQueue: DroneCommand[] = [];
  private targets: MovementTarget = {};
  private config: DroneControllerConfig;
  private isAutopilot = false;
  private manualSetpoints: PIDSetpoints = { pitch: 0, roll: 0, yaw: 0, throttle: 0 };
  private formationTarget: THREE.Vector3 | null = null;
  private isLeader = false;
  private leaderPosition: THREE.Vector3 | null = null;
  private leaderRotation: THREE.Vector3 | null = null;
  private altitudeTarget: number | null = null;
  // Position hold state: when enabled the controller will hold `holdPosition`
  private positionHold: boolean = false;
  private holdPosition: THREE.Vector3 | null = null;
  // Short-lived throttle applied when engaging position-hold to prevent
  // immediate descent while controllers engage.
  private holdThrottleExpire: number | null = null;
  // Track previous manual-active state to detect transitions into hold
  private lastManualActive: boolean = false;
  private pidParams: PIDParams = {
    pitch: { kp: 2.2, ki: 0.15, kd: 0.35 },
    roll: { kp: 2.2, ki: 0.15, kd: 0.35 },
    yaw: { kp: 0.6, ki: 0.02, kd: 0.08 },
    altitude: { kp: 1.0, ki: 0.1, kd: 0.2 }
  };
  // Use centralized physics defaults so DroneController and DronePhysics match
  private physicsMass: number = DEFAULT_PHYSICS_CONFIG.mass;
  private physicsGravity: number = DEFAULT_PHYSICS_CONFIG.gravity;
  private thrustFactor: number = DEFAULT_PHYSICS_CONFIG.thrustFactor; // maxThrust = thrustFactor * mass * g

  constructor(adapter: DroneAdapter, config: Partial<DroneControllerConfig> = {}) {
    this.adapter = adapter;
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.adapter.onStateUpdate(this.handleStateUpdate.bind(this));
  }

  private handleStateUpdate(newState: DroneState): void {
    this.state = newState;
    this.validateSafetyLimits(newState);
    this.adapter.sendTelemetry(newState);
  }

  private validateSafetyLimits(state: DroneState): void {
    const { maxTiltAngle, maxYawRate, maxVerticalSpeed } = this.config.safetyLimits;

    // Check tilt angles
    if (Math.abs(state.rotation.x) > maxTiltAngle ||
      Math.abs(state.rotation.z) > maxTiltAngle) {
      console.error('Safety limit exceeded: Max tilt angle');
      this.emergencyStop();
      return;
    }

    // Check yaw rate
    if (Math.abs(state.angularVelocity.y) > maxYawRate) {
      console.error('Safety limit exceeded: Max yaw rate');
      this.emergencyStop();
      return;
    }

    // Check vertical speed
    if (Math.abs(state.velocity.y) > maxVerticalSpeed) {
      console.error('Safety limit exceeded: Max vertical speed');
      this.emergencyStop();
      return;
    }
  }

  emergencyStop(): void {
    // Disable autopilot
    this.isAutopilot = false;

    // Clear all targets
    this.targets = {};

    // Send emergency stop command to adapter
    this.adapter.sendCommand({
      id: `emergency_${Date.now()}`,
      type: 'emergencyStop',
      parameters: {},
      timeout: 1000,
      startTime: Date.now(),
      resolve: () => { },
      reject: () => { }
    });
  }

  // New methods for multi-drone support
  getState(): DroneState {
    return this.state || {
      position: new THREE.Vector3(),
      rotation: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      angularVelocity: new THREE.Vector3()
    };
  }

  getSetpoints(): PIDSetpoints {
    // If position-hold is enabled, only allow manual override via throttle
    // (pilot must give throttle > deadzone to regain manual control).
    const deadzone = 0.05;
    if (this.positionHold) {
      const manualActive = Math.abs(this.manualSetpoints.throttle) > deadzone;

      if (manualActive) {
        // Pilot is commanding vertical motion: allow manual controls
        this.targets.position = undefined;
        this.isAutopilot = false;
        this.lastManualActive = true;
        return this.manualSetpoints;
      } else {
        // Throttle released: engage autopilot hold.
        this.isAutopilot = true;

        // If we just transitioned from manual -> hold, recapture current position
        // so the hold point is where throttle was released.
        if (this.lastManualActive || !this.holdPosition) {
          if (this.state) {
            this.holdPosition = this.state.position.clone();
          }
          // Small hover throttle to prevent initial drop
          const hoverThrottle = 1 / Math.max(0.0001, this.thrustFactor);
          this.targets.throttle = hoverThrottle;
          this.holdThrottleExpire = Date.now() + 500; // ms
        }

        this.lastManualActive = false;
        // Use formation setpoints which handle positionHold internally
        if (!this.isLeader && (this.formationTarget || this.altitudeTarget !== null || this.holdPosition)) {
          return this.calculateFormationSetpoints();
        }
        return this.calculateAutopilotSetpoints();
      }
    }

    // If we have an altitude target or formation target, use formation setpoints
    // (calculateFormationSetpoints handles both cases)
    if (!this.isLeader && (this.formationTarget || this.altitudeTarget !== null)) {
      return this.calculateFormationSetpoints();
    }
    return this.isAutopilot ? this.calculateAutopilotSetpoints() : this.manualSetpoints;
  }

  setAsLeader(isLeader: boolean): void {
    this.isLeader = isLeader;
    if (isLeader) {
      this.formationTarget = null;
      this.leaderPosition = null;
      this.leaderRotation = null;
      this.isAutopilot = false;
    }
  }

  setFormationTarget(target: THREE.Vector3): void {
    this.formationTarget = target.clone();
    // When assigned a formation target, follow leader altitude dynamically
    // (do not lock to a fixed altitude target which prevents following leader)
    this.altitudeTarget = null;
    this.isAutopilot = true;
  }

  clearFormationTarget(): void {
    this.formationTarget = null;
    this.leaderPosition = null;
    this.leaderRotation = null;
  }

  setHoverMode(enabled: boolean): void {
    if (enabled) {
      // Set altitude target to current position if available
      if (this.state && this.altitudeTarget === null) {
        this.altitudeTarget = this.state.position.y;
      }
      this.isAutopilot = false;
    } else {
      this.manualSetpoints.throttle = 0;
      this.altitudeTarget = null;
    }
  }

  /**
   * Enable or disable position-hold mode for this drone.
   * When enabled the drone will capture its current world position and hold it
   * (i.e. the formation/controller will use that position as the navigation target).
   */
  enablePositionHold(enabled: boolean): void {
    this.positionHold = enabled;
    if (enabled && this.state) {
      // Capture current position as hold target
      this.holdPosition = this.state.position.clone();
      // Ensure autopilot is active so setpoints are generated
      this.isAutopilot = true;
    } else {
      this.holdPosition = null;
    }
  }

  isPositionHoldEnabled(): boolean {
    return this.positionHold;
  }

  setAltitudeTarget(altitude: number): void {
    this.altitudeTarget = Math.max(0, Math.min(this.config.maxAltitude, altitude));
    console.log(`Altitude target set to ${this.altitudeTarget}`);
  }

  updateLeaderPosition(position: THREE.Vector3, rotation: THREE.Vector3): void {
    if (!this.isLeader && this.formationTarget) {
      this.leaderPosition = position.clone();
      this.leaderRotation = rotation.clone();
    }
  }

  private calculateFormationSetpoints(): PIDSetpoints {
    // Expire any short-lived hold throttle buffer
    if (this.holdThrottleExpire && Date.now() > this.holdThrottleExpire) {
      this.targets.throttle = undefined;
      this.holdThrottleExpire = null;
    }

    // Default hover setpoints with altitude hold
    const setpoints: PIDSetpoints = { pitch: 0, roll: 0, yaw: 0, throttle: 0.5 };

    // Safety check: ensure we have valid state
    if (!this.state) {
      return setpoints;
    }

    // If we have an explicit altitude target (from hover mode), maintain it
    if (this.altitudeTarget !== null) {
      const altitudeError = this.altitudeTarget - this.state.position.y;
      // Compute desired vertical acceleration (m/s^2) using PD on altitude
      const kp_pos = 1.0; // m -> m/s^2
      const kd_pos = 0.5; // damping on vertical velocity
      const a_des = kp_pos * altitudeError - kd_pos * this.state.velocity.y;

      // Convert required acceleration to thrust and then to normalized throttle
      const maxThrust = this.thrustFactor * this.physicsMass * this.physicsGravity;
      const requiredThrust = this.physicsMass * (a_des + this.physicsGravity);
      setpoints.throttle = Math.max(0, Math.min(1, requiredThrust / maxThrust));

      // If no formation target, just hover in place
      if (!this.formationTarget) {
        return setpoints;
      }
    }

    // If position-hold is enabled, override the formation target and use the captured hold position
    if (this.positionHold && this.holdPosition) {
      const targetWorld = this.holdPosition.clone();

      // Clamp target altitude to config limits
      targetWorld.y = Math.max(1.0, Math.min(this.config.maxAltitude, targetWorld.y));

      // Calculate position error (distance vector to target)
      const positionError = new THREE.Vector3().subVectors(targetWorld, this.state.position);
      const distance = positionError.length();

      // Calculate altitude control (throttle) by converting desired accel -> thrust
      const altitudeError = targetWorld.y - this.state.position.y;
      const kp_pos = 1.0;
      const kd_pos = 0.5;
      const a_des = kp_pos * altitudeError - kd_pos * this.state.velocity.y;
      const maxThrust = this.thrustFactor * this.physicsMass * this.physicsGravity;
      const requiredThrust = this.physicsMass * (a_des + this.physicsGravity);
      setpoints.throttle = Math.max(0, Math.min(1, requiredThrust / maxThrust));

      // Only apply horizontal control if we have a valid distance
      if (distance > 0.01) {
        // Normalize the horizontal error
        const horizontalError = new THREE.Vector2(positionError.x, positionError.z);
        const horizontalDistance = horizontalError.length();

        if (horizontalDistance > 0.05) {
          // Calculate desired yaw to face the target (dx, dz)
          const targetYaw = Math.atan2(positionError.x, positionError.z);
          let yawError = targetYaw - this.state.rotation.y;

          // Normalize yaw error to [-PI, PI]
          while (yawError > Math.PI) yawError -= 2 * Math.PI;
          while (yawError < -Math.PI) yawError += 2 * Math.PI;

          // Limit yaw authority to avoid excessive yaw rates (safety)
          setpoints.yaw = Math.max(-0.5, Math.min(0.5, yawError * 0.35));

          // Position -> desired velocity -> desired accel -> tilt (outer velocity loop)
          // Compute local frame errors
          const forwardError = positionError.z * Math.cos(this.state.rotation.y) +
            positionError.x * Math.sin(this.state.rotation.y);
          const lateralError = -positionError.z * Math.sin(this.state.rotation.y) +
            positionError.x * Math.cos(this.state.rotation.y);

          // Desired horizontal velocity (m/s) in local frame (P on position)
          const kp_pos_vel = 0.8; // position->velocity gain
          let desiredForwardVel = kp_pos_vel * forwardError;
          let desiredLateralVel = kp_pos_vel * lateralError;

          // Clamp desired horizontal speed to controller maxSpeed
          const maxSpeed = this.config.maxSpeed || 5.0;
          const speedMag = Math.hypot(desiredForwardVel, desiredLateralVel);
          if (speedMag > maxSpeed) {
            const s = maxSpeed / speedMag;
            desiredForwardVel *= s;
            desiredLateralVel *= s;
          }

          // Local current velocity
          const localVelocityForward = this.state.velocity.z * Math.cos(this.state.rotation.y) +
            this.state.velocity.x * Math.sin(this.state.rotation.y);
          const localVelocityLateral = -this.state.velocity.z * Math.sin(this.state.rotation.y) +
            this.state.velocity.x * Math.cos(this.state.rotation.y);

          // Desired acceleration (simple P on velocity error)
          const kv_vel = 1.6; // velocity->accel gain
          const a_des_forward = kv_vel * (desiredForwardVel - localVelocityForward);
          const a_des_lateral = kv_vel * (desiredLateralVel - localVelocityLateral);

          // Convert desired lateral acceleration to desired tilt angles (small-angle approx)
          const pitchSetpoint = Math.max(-this.config.safetyLimits.maxTiltAngle, Math.min(this.config.safetyLimits.maxTiltAngle, -a_des_forward / this.physicsGravity));
          const rollSetpoint = Math.max(-this.config.safetyLimits.maxTiltAngle, Math.min(this.config.safetyLimits.maxTiltAngle, a_des_lateral / this.physicsGravity));

          // Apply to setpoints with an overall cap (smaller than max tilt for safety)
          const tiltCap = Math.min(0.6, this.config.safetyLimits.maxTiltAngle);
          setpoints.pitch = Math.max(-tiltCap, Math.min(tiltCap, pitchSetpoint));
          setpoints.roll = Math.max(-tiltCap, Math.min(tiltCap, rollSetpoint));

          // Reduce aggressiveness when far to avoid aggressive overshoot
          if (distance > 8) {
            const distanceScale = Math.max(0.25, Math.min(1, 8 / distance));
            setpoints.pitch *= distanceScale;
            setpoints.roll *= distanceScale;
          }
        }
      }

      return setpoints;
    }
    if (this.formationTarget && this.leaderPosition && this.leaderRotation && this.state) {
      // Transform formation target to world space based on leader's position and rotation
      const targetWorld = this.formationTarget.clone();
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeRotationY(this.leaderRotation.y);
      targetWorld.applyMatrix4(rotationMatrix);
      targetWorld.add(this.leaderPosition);

      // Keep target altitude close to leader altitude (formation offsets are relative)
      targetWorld.y = Math.max(0.5, Math.min(this.config.maxAltitude, this.leaderPosition.y));

      // Calculate position error (distance vector to target)
      const positionError = new THREE.Vector3().subVectors(targetWorld, this.state.position);
      const distance = positionError.length();

      // Calculate altitude control (throttle) - only if significant error
      const altitudeError = targetWorld.y - this.state.position.y;
      const altitudeTolerance = 0.3;

      if (Math.abs(altitudeError) > altitudeTolerance || Math.abs(this.state.velocity.y) > 0.1) {
        const kp_pos = 1.0;
        const kd_pos = 0.5;
        const a_des = kp_pos * altitudeError - kd_pos * this.state.velocity.y;
        const maxThrust = this.thrustFactor * this.physicsMass * this.physicsGravity;
        const requiredThrust = this.physicsMass * (a_des + this.physicsGravity);
        setpoints.throttle = Math.max(0, Math.min(1, requiredThrust / maxThrust));
      } else {
        // Within altitude tolerance - no throttle
        setpoints.throttle = 0;
      }

      // Only apply horizontal control if we have a valid distance
      if (distance > 0.5) {
        // Normalize the horizontal error
        const horizontalError = new THREE.Vector2(positionError.x, positionError.z);
        const horizontalDistance = horizontalError.length();

        if (horizontalDistance > 0.05) {
          // Calculate desired yaw to face the target (dx, dz)
          const targetYaw = Math.atan2(positionError.x, positionError.z);
          let yawError = targetYaw - this.state.rotation.y;

          // Normalize yaw error to [-PI, PI]
          while (yawError > Math.PI) yawError -= 2 * Math.PI;
          while (yawError < -Math.PI) yawError += 2 * Math.PI;

          // Limit yaw authority to avoid excessive yaw rates (safety)
          setpoints.yaw = Math.max(-0.5, Math.min(0.5, yawError * 0.35));

          // Position -> desired velocity -> desired accel -> tilt (outer velocity loop)
          // Compute local frame errors
          const forwardError = positionError.z * Math.cos(this.state.rotation.y) +
            positionError.x * Math.sin(this.state.rotation.y);
          const lateralError = -positionError.z * Math.sin(this.state.rotation.y) +
            positionError.x * Math.cos(this.state.rotation.y);

          // Desired horizontal velocity (m/s) in local frame (P on position)
          const kp_pos_vel = 0.8; // position->velocity gain
          let desiredForwardVel = kp_pos_vel * forwardError;
          let desiredLateralVel = kp_pos_vel * lateralError;

          // Clamp desired horizontal speed to controller maxSpeed
          const maxSpeed = this.config.maxSpeed || 5.0;
          const speedMag = Math.hypot(desiredForwardVel, desiredLateralVel);
          if (speedMag > maxSpeed) {
            const s = maxSpeed / speedMag;
            desiredForwardVel *= s;
            desiredLateralVel *= s;
          }

          // Local current velocity
          const localVelocityForward = this.state.velocity.z * Math.cos(this.state.rotation.y) +
            this.state.velocity.x * Math.sin(this.state.rotation.y);
          const localVelocityLateral = -this.state.velocity.z * Math.sin(this.state.rotation.y) +
            this.state.velocity.x * Math.cos(this.state.rotation.y);

          // Desired acceleration (simple P on velocity error)
          const kv_vel = 1.6; // velocity->accel gain
          const a_des_forward = kv_vel * (desiredForwardVel - localVelocityForward);
          const a_des_lateral = kv_vel * (desiredLateralVel - localVelocityLateral);

          // Convert desired lateral acceleration to desired tilt angles (small-angle approx)
          // a_forward ≈ g * pitch  => pitch ≈ a_forward / g
          // a_lateral ≈ g * roll   => roll ≈ a_lateral / g
          const pitchSetpoint = Math.max(-this.config.safetyLimits.maxTiltAngle, Math.min(this.config.safetyLimits.maxTiltAngle, a_des_forward / this.physicsGravity));
          const rollSetpoint = Math.max(-this.config.safetyLimits.maxTiltAngle, Math.min(this.config.safetyLimits.maxTiltAngle, a_des_lateral / this.physicsGravity));

          // Apply to setpoints with an overall cap (smaller than max tilt for safety)
          const tiltCap = Math.min(0.6, this.config.safetyLimits.maxTiltAngle);
          setpoints.pitch = Math.max(-tiltCap, Math.min(tiltCap, pitchSetpoint));
          setpoints.roll = Math.max(-tiltCap, Math.min(tiltCap, rollSetpoint));

          // Reduce aggressiveness when far to avoid aggressive overshoot
          if (distance > 8) {
            const distanceScale = Math.max(0.25, Math.min(1, 8 / distance));
            setpoints.pitch *= distanceScale;
            setpoints.roll *= distanceScale;
          }
        } else {
          // Within horizontal tolerance - zero tilt and yaw
          setpoints.pitch = 0;
          setpoints.roll = 0;
          setpoints.yaw = 0;
        }
      } else {
        // Within position tolerance - zero tilt and yaw
        setpoints.pitch = 0;
        setpoints.roll = 0;
        setpoints.yaw = 0;
      }
    }

    return setpoints;
  }

  getPIDParams(): PIDParams {
    return this.pidParams;
  }

  updateState(newState: DroneState): void {
    this.state = newState;
    this.adapter.sendTelemetry(newState);
  }

  private calculateAutopilotSetpoints(): PIDSetpoints {
    // Your existing autopilot logic here
    return { pitch: 0, roll: 0, yaw: 0, throttle: 0 };
  }

  async moveTo(target: THREE.Vector3): Promise<void> {
    return new Promise((resolve, reject) => {
      const command: DroneCommand = {
        id: `move_${Date.now()}`,
        type: 'moveTo',
        parameters: {
          position: target
        },
        timeout: this.config.commandTimeout,
        startTime: Date.now(),
        resolve,
        reject
      };

      this.targets.position = target;
      this.isAutopilot = true;
      // Clear altitude target to allow moveTo to control altitude
      this.altitudeTarget = null;
      this.commandQueue.push(command);
      this.processCommandQueue();
    });
  }

  async land(): Promise<void> {
    return new Promise((resolve, reject) => {
      const command: DroneCommand = {
        id: `land_${Date.now()}`,
        type: 'land',
        parameters: {},
        timeout: this.config.commandTimeout,
        startTime: Date.now(),
        resolve,
        reject
      };

      this.isAutopilot = false;
      this.commandQueue.push(command);
      this.processCommandQueue();
    });
  }

  private processCommandQueue(): void {
    if (!this.currentCommand && this.commandQueue.length > 0) {
      this.currentCommand = this.commandQueue.shift() || null;
      if (this.currentCommand) {
        this.executeCommand(this.currentCommand);
      }
    }
  }

  private async executeCommand(command: DroneCommand): Promise<void> {
    try {
      await this.adapter.sendCommand(command);
      this.currentCommand = null;
      this.processCommandQueue();
    } catch (error) {
      console.error('Command execution failed:', error);
      this.currentCommand = null;
      this.processCommandQueue();
    }
  }

  private cancelCurrentCommand(): void {
    if (this.currentCommand) {
      this.currentCommand.reject(new Error('Command cancelled'));
      this.currentCommand = null;
    }
    this.commandQueue = [];
  }
}