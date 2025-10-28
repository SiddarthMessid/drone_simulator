import * as THREE from "three";
import { DroneAdapter, DroneState, DroneCommand, DroneControllerConfig } from './interfaces/drone';
import { PIDSetpoints, PIDParams } from './pidController';

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
  private pidParams: PIDParams = {
    pitch: { kp: 1, ki: 0.1, kd: 0.2 },
    roll: { kp: 1, ki: 0.1, kd: 0.2 },
    yaw: { kp: 1, ki: 0.1, kd: 0.2 },
    altitude: { kp: 1, ki: 0.1, kd: 0.2 }
  };

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
      resolve: () => {},
      reject: () => {}
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
    // Default hover setpoints with altitude hold
    const setpoints: PIDSetpoints = { pitch: 0, roll: 0, yaw: 0, throttle: 0.5 };
    
    // If we have an explicit altitude target (from hover mode), maintain it
    if (this.altitudeTarget !== null && this.state) {
      const altitudeError = this.altitudeTarget - this.state.position.y;
      const altitudeGain = 0.5;
      const dampingGain = 0.3;
      
      // Proportional-Derivative control for smooth altitude hold
      setpoints.throttle = Math.max(0, Math.min(1, 
        0.5 + altitudeError * altitudeGain - this.state.velocity.y * dampingGain
      ));
      
      // If no formation target, just hover in place
      if (!this.formationTarget) {
        return setpoints;
      }
    }
    
    if (this.formationTarget && this.leaderPosition && this.leaderRotation && this.state) {
      // Transform formation target to world space based on leader's position and rotation
      const targetWorld = this.formationTarget.clone();
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeRotationY(this.leaderRotation.y);
      targetWorld.applyMatrix4(rotationMatrix);
      targetWorld.add(this.leaderPosition);

      // Clamp target altitude to config limits
      targetWorld.y = Math.max(0.5, Math.min(this.config.maxAltitude, targetWorld.y));

      // Calculate position error (distance vector to target)
      const positionError = new THREE.Vector3().subVectors(targetWorld, this.state.position);
      const distance = positionError.length();
      
      // Debug logging (only log occasionally to avoid spam)
      if (Math.random() < 0.01) {
        console.log('Formation control:', {
          formationOffset: this.formationTarget,
          leaderPos: this.leaderPosition,
          targetWorld: targetWorld,
          currentPos: this.state.position,
          distance: distance.toFixed(2)
        });
      }
      
      // Calculate altitude control (throttle) with damping
      const altitudeError = targetWorld.y - this.state.position.y;
      const altitudeGain = 0.5;
      const dampingGain = 0.3;
      setpoints.throttle = Math.max(0, Math.min(1, 
        0.5 + altitudeError * altitudeGain - this.state.velocity.y * dampingGain
      ));
      
      // Only apply horizontal control if we're reasonably close in altitude
      if (distance > 0.5) {
        // Normalize the horizontal error
        const horizontalError = new THREE.Vector2(positionError.x, positionError.z);
        const horizontalDistance = horizontalError.length();
        
        if (horizontalDistance > 0.1) {
          // Calculate desired yaw to face the target
          const targetYaw = Math.atan2(positionError.x, positionError.z);
          let yawError = targetYaw - this.state.rotation.y;
          
          // Normalize yaw error to [-PI, PI]
          while (yawError > Math.PI) yawError -= 2 * Math.PI;
          while (yawError < -Math.PI) yawError += 2 * Math.PI;
          
          // Smooth yaw control
          setpoints.yaw = Math.max(-0.5, Math.min(0.5, yawError * 0.5));
          
          // Use proportional control for pitch and roll based on position error
          // With velocity damping to prevent oscillation
          const maxTiltGain = 0.3;
          const dampingGain = 0.1;
          
          // Calculate control in drone's local frame
          const forwardError = positionError.z * Math.cos(this.state.rotation.y) + 
                               positionError.x * Math.sin(this.state.rotation.y);
          const lateralError = -positionError.z * Math.sin(this.state.rotation.y) + 
                               positionError.x * Math.cos(this.state.rotation.y);
          
          // Transform velocity to drone's local frame for proper damping
          const localVelocityForward = this.state.velocity.z * Math.cos(this.state.rotation.y) + 
                                        this.state.velocity.x * Math.sin(this.state.rotation.y);
          const localVelocityLateral = -this.state.velocity.z * Math.sin(this.state.rotation.y) + 
                                        this.state.velocity.x * Math.cos(this.state.rotation.y);
          
          // Apply proportional control with velocity damping in local frame
          setpoints.pitch = Math.max(-0.3, Math.min(0.3, 
            -forwardError * maxTiltGain - localVelocityForward * dampingGain));
          setpoints.roll = Math.max(-0.3, Math.min(0.3, 
            -lateralError * maxTiltGain - localVelocityLateral * dampingGain));
          
          // Reduce control authority when far from target to prevent overshoot
          if (distance > 5) {
            const distanceScale = Math.max(0.3, Math.min(1, 5 / distance));
            setpoints.pitch *= distanceScale;
            setpoints.roll *= distanceScale;
          }
        }
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