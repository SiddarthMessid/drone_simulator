import * as THREE from "three";
import { PIDSetpoints } from "./pidController";
import { useDrone } from "./stores/useDrone";
import { DroneAdapter, DroneState, DroneCommand, DroneControllerConfig } from './interfaces/drone';
import { DEFAULT_PHYSICS_CONFIG } from './physicsConfig';

const DEFAULT_CONFIG: DroneControllerConfig = {
  maxSpeed: 5.0,
  maxAltitude: 50.0,
  positionTolerance: 0.5, // Tighter tolerance for responsive position hold
  altitudeTolerance: 0.5,
  angleTolerance: 0.05,
  commandTimeout: 30000, // 30 seconds default timeout
  safetyLimits: {
    maxTiltAngle: Math.PI / 3, // 60 degrees
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
  // Short-lived throttle applied when engaging position-hold to prevent
  // an immediate descent while the altitude controller stabilizes.
  private holdThrottleExpire: number | null = null;
  // Track previous manual-active state to detect transitions into hold
  private lastManualActive: boolean = false;
  // Track previous yaw setpoint to detect if user is actively changing yaw
  private previousYawSetpoint: number = 0;

  constructor(adapter: DroneAdapter, config: Partial<DroneControllerConfig> = {}) {
    this.adapter = adapter;
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.adapter.onStateUpdate(this.handleStateUpdate.bind(this));
  }

  async connect(): Promise<void> {
    await this.adapter.connect();
  }

  async disconnect(): Promise<void> {
    await this.adapter.disconnect();
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

  /**
   * Take off to specified altitude
   */
  async takeoff(targetAltitude: number = 10): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cancelCurrentCommand();
      this.isAutopilot = true;

      const command: DroneCommand = {
        id: `takeoff_${Date.now()}`,
        type: 'takeoff',
        parameters: { targetAltitude },
        resolve,
        reject,
        startTime: Date.now(),
        timeout: 15000 // 15 second timeout
      };

      this.targets = { altitude: targetAltitude };
      this.executeCommand(command);
    });
  }

  /**
   * Land the drone
   */
  async land(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cancelCurrentCommand();
      this.isAutopilot = true;

      const command: DroneCommand = {
        id: `land_${Date.now()}`,
        type: 'land',
        parameters: {},
        resolve,
        reject,
        startTime: Date.now(),
        timeout: 20000 // 20 second timeout
      };

      this.targets = { altitude: 0.5 };
      this.executeCommand(command);
    });
  }

  /**
   * Hover at current position
   */
  async hover(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cancelCurrentCommand();
      this.isAutopilot = true;

      const droneStore = useDrone.getState();

      const command: DroneCommand = {
        id: `hover_${Date.now()}`,
        type: 'hover',
        parameters: {},
        resolve,
        reject,
        startTime: Date.now(),
        timeout: 1500 // 1.5 second timeout to allow for completion
      };

      this.targets = {
        position: droneStore.position.clone(),
        altitude: droneStore.position.y,
        heading: droneStore.rotation.y
      };

      this.executeCommand(command);
    });
  }

  /**
   * Set drone pitch angle in degrees
   */
  async setPitch(degrees: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const radians = (degrees * Math.PI) / 180;

      this.cancelCurrentCommand();
      this.isAutopilot = true;

      const command: DroneCommand = {
        id: `setPitch_${Date.now()}`,
        type: 'setPitch',
        parameters: { degrees, radians },
        resolve,
        reject,
        startTime: Date.now(),
        timeout: 5000
      };

      this.targets.pitch = radians;
      this.executeCommand(command);
    });
  }

  /**
   * Set drone roll angle in degrees
   */
  async setRoll(degrees: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const radians = (degrees * Math.PI) / 180;

      this.cancelCurrentCommand();
      this.isAutopilot = true;

      const command: DroneCommand = {
        id: `setRoll_${Date.now()}`,
        type: 'setRoll',
        parameters: { degrees, radians },
        resolve,
        reject,
        startTime: Date.now(),
        timeout: 5000
      };

      this.targets.roll = radians;
      this.executeCommand(command);
    });
  }

  /**
   * Set drone yaw heading in degrees
   */
  async setYaw(degrees: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const radians = (degrees * Math.PI) / 180;

      this.cancelCurrentCommand();
      this.isAutopilot = true;

      const command: DroneCommand = {
        id: `setYaw_${Date.now()}`,
        type: 'setYaw',
        parameters: { degrees, radians },
        resolve,
        reject,
        startTime: Date.now(),
        timeout: 5000
      };

      this.targets.heading = radians;
      this.executeCommand(command);
    });
  }

  /**
   * Set throttle percentage (0-100)
   */
  async setThrottle(percentage: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const throttle = Math.max(-1, Math.min(1, percentage / 100));

      this.cancelCurrentCommand();
      this.isAutopilot = true;

      const command: DroneCommand = {
        id: `setThrottle_${Date.now()}`,
        type: 'setThrottle',
        parameters: { percentage, throttle },
        resolve,
        reject,
        startTime: Date.now(),
        timeout: 1000
      };

      // Add throttle target to maintain the throttle level
      this.targets.throttle = throttle;
      this.executeCommand(command);
    });
  }

  /**
   * Move drone from one direction to another
   */
  async dir(fromX: number, fromY: number, fromZ: number, toX: number, toY: number, toZ: number): Promise<void> {
    const fromVec = new THREE.Vector3(fromX, fromY, fromZ);
    const toVec = new THREE.Vector3(toX, toY, toZ);
    return this.moveTo(toVec);
  }

  /**
   * Move drone to target position
   */
  async moveTo(targetPosition: THREE.Vector3, options: { speed?: number, timeout?: number } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cancelCurrentCommand();
      this.isAutopilot = true;

      const command: DroneCommand = {
        id: `moveTo_${Date.now()}`,
        type: 'moveTo',
        parameters: { targetPosition: targetPosition.clone(), options },
        resolve,
        reject,
        startTime: Date.now(),
        timeout: options.timeout || 30000 // 30 second default timeout
      };

      this.targets = {
        position: targetPosition.clone(),
        altitude: targetPosition.y
      };

      this.executeCommand(command);
    });
  }

  /**
   * Enable manual control mode
   */
  enableManualControl(): void {
    this.cancelCurrentCommand();
    this.isAutopilot = false;
    this.targets = {};
  }

  /**
   * Check if drone is in autopilot mode
   */
  isAutopilotActive(): boolean {
    return this.isAutopilot;
  }

  /**
   * Get current command status
   */
  getCurrentCommand(): DroneCommand | null {
    return this.currentCommand;
  }

  /**
   * Cancel current command
   */
  cancelCurrentCommand(): void {
    if (this.currentCommand) {
      this.currentCommand.reject(new Error('Command cancelled'));
      this.currentCommand = null;
    }
    this.commandQueue = [];
  }

  /**
   * Update method called each frame to calculate PID setpoints
   * This should be called from the simulation loop
   */
  update(manualControls: PIDSetpoints, deltaTime: number): PIDSetpoints {
    // Store manual controls for fallback
    this.manualSetpoints = manualControls;

    // Check command timeout
    this.checkCommandTimeout();

    // Special handling: global main-drone position-hold from store
    const droneStore = useDrone.getState();

    // If autopilot is active (from commands like takeoff/land), let it run
    // regardless of position hold state
    if (this.isAutopilot && this.currentCommand) {
      // Autopilot command is running - generate autopilot setpoints
      const setpoints = this.calculateAutopilotSetpoints(deltaTime);
      this.checkCommandCompletion();
      return setpoints;
    }

    // If position hold is disabled and no autopilot command, use manual controls
    if (!droneStore.positionHoldEnabled) {
      return manualControls;
    }

    // Position hold is enabled - check for manual input
    if (droneStore.positionHoldEnabled) {
      // Check if pilot is giving any manual input (simple deadzone check)
      const deadzone = 0.05;
      const hasAnyInput =
        Math.abs(manualControls.throttle) > deadzone ||
        Math.abs(manualControls.pitch) > deadzone ||
        Math.abs(manualControls.roll) > deadzone;

      if (hasAnyInput) {
        // Debug: log when manual input detected
        if (Math.random() < 0.1) {
          console.log('Manual input detected, disabling position hold:', {
            pitch: manualControls.pitch.toFixed(2),
            roll: manualControls.roll.toFixed(2),
            throttle: manualControls.throttle.toFixed(2)
          });
        }

        // ANY manual input disables position hold temporarily
        this.targets.position = undefined;
        this.targets.altitude = undefined;
        this.targets.throttle = undefined;
        this.targets.heading = undefined;
        this.targets.pitch = undefined;
        this.targets.roll = undefined;
        this.isAutopilot = false;
        this.lastManualActive = true;

        // Clear the stored hold position
        const droneState = useDrone.getState();
        droneState.holdPosition = null;

        return manualControls;
      } else {
        // No input - engage full position hold
        this.isAutopilot = true;

        // If we just transitioned from manual -> hold, capture current state
        if (this.lastManualActive || !droneStore.holdPosition) {
          // Capture current position and heading
          useDrone.getState().enablePositionHold(true);
          this.targets.position = droneStore.position.clone();
          this.targets.altitude = droneStore.position.y;
          this.targets.heading = droneStore.rotation.y;

          // Brief hover throttle to prevent drop
          this.targets.throttle = 0.4;
          this.holdThrottleExpire = Date.now() + 500;

          // Clear any angle targets
          this.targets.pitch = undefined;
          this.targets.roll = undefined;
        } else if (droneStore.holdPosition) {
          // Continue holding the stored position
          this.targets.position = droneStore.holdPosition.clone();
          this.targets.altitude = droneStore.holdPosition.y;
          // Keep heading locked to what it was when hold engaged
          if (this.targets.heading === undefined) {
            this.targets.heading = droneStore.rotation.y;
          }
        }

        this.lastManualActive = false;
        // Fall through to autopilot setpoint generation
      }
    }

    if (!this.isAutopilot) {
      // Use manual controls when not in autopilot mode
      return manualControls;
    }

    // Generate autopilot setpoints based on targets when in autopilot mode
    const setpoints = this.calculateAutopilotSetpoints(deltaTime);

    // Check if command is complete
    this.checkCommandCompletion();

    return setpoints;
  }

  private executeCommand(command: DroneCommand): void {
    this.currentCommand = command;
  }

  private calculateAutopilotSetpoints(deltaTime: number): PIDSetpoints {
    const droneStore = useDrone.getState();
    const setpoints: PIDSetpoints = { pitch: 0, roll: 0, yaw: 0, throttle: 0 };

    // Expire any short-lived hold throttle
    if (this.holdThrottleExpire && Date.now() > this.holdThrottleExpire) {
      this.targets.throttle = undefined;
      this.holdThrottleExpire = null;
    }

    // Direct throttle control (takes priority over altitude control)
    if (this.targets.throttle !== undefined) {
      setpoints.throttle = this.targets.throttle;
    }
    // Altitude control (when no direct throttle is set)
    else if (this.targets.altitude !== undefined) {
      const altitudeError = this.targets.altitude - droneStore.position.y;
      const verticalVelocity = droneStore.velocity.y;

      // Proportional-Derivative control for smooth altitude hold
      const kp_altitude = 0.2; // Reduced for smoother response
      const kd_altitude = 0.4; // Reduced to prevent over-damping

      const throttleCorrection = (kp_altitude * altitudeError) - (kd_altitude * verticalVelocity);

      // Hover throttle baseline - calibrated to 40% for this drone
      const hoverThrottle = 0.4;
      setpoints.throttle = Math.max(0, Math.min(1, hoverThrottle + throttleCorrection));
    }

    // Simple position control - use small tilts to move toward target
    if (this.targets.position) {
      const distance = droneStore.position.distanceTo(this.targets.position);

      // Always log for debugging
      console.log(`MoveTo: distance=${distance.toFixed(2)}m, target=(${this.targets.position.x}, ${this.targets.position.y}, ${this.targets.position.z})`);

      if (distance > this.config.positionTolerance) {
        // Calculate direction to target (in world frame)
        const toTarget = this.targets.position.clone().sub(droneStore.position);

        // Simple: tilt toward target
        // Positive Z error = tilt forward (negative pitch)
        // Positive X error = tilt right (positive roll)
        const tiltGain = 0.02; // Very small tilts
        const maxTilt = 0.1;

        setpoints.pitch = Math.max(-maxTilt, Math.min(maxTilt, -toTarget.z * tiltGain));
        setpoints.roll = Math.max(-maxTilt, Math.min(maxTilt, toTarget.x * tiltGain));

        console.log(`Applying tilt: pitch=${setpoints.pitch.toFixed(3)}, roll=${setpoints.roll.toFixed(3)}`);
      } else {
        setpoints.pitch = 0;
        setpoints.roll = 0;
      }
    } else {
      setpoints.pitch = 0;
      setpoints.roll = 0;
    }

    // Heading control (with angle wrapping)
    if (this.targets.heading !== undefined) {
      let headingError = this.targets.heading - droneStore.rotation.y;
      // Normalize angle difference to -PI to PI (shortest path)
      while (headingError > Math.PI) headingError -= 2 * Math.PI;
      while (headingError < -Math.PI) headingError += 2 * Math.PI;
      setpoints.yaw = this.targets.heading; // Use target angle directly, PID will handle it
    }

    // Direct angle control (takes priority over position-based control)
    if (this.targets.pitch !== undefined) {
      setpoints.pitch = this.targets.pitch;
    }

    if (this.targets.roll !== undefined) {
      setpoints.roll = this.targets.roll;
    }

    return setpoints;
  }

  private checkCommandCompletion(): void {
    if (!this.currentCommand) return;

    const droneStore = useDrone.getState();
    let isComplete = false;

    switch (this.currentCommand.type) {
      case 'takeoff':
      case 'land':
        const targetAlt = this.currentCommand.type === 'takeoff'
          ? this.currentCommand.parameters.targetAltitude
          : 0.5;
        isComplete = Math.abs(droneStore.position.y - targetAlt) < this.config.altitudeTolerance;
        break;

      case 'hover':
        // Consider hovering complete after stabilization time
        isComplete = Date.now() - this.currentCommand.startTime > 1000;
        break;

      case 'moveTo':
        if (this.targets.position) {
          const distance = droneStore.position.distanceTo(this.targets.position);
          isComplete = distance < this.config.positionTolerance;
        }
        break;

      case 'setPitch':
        // Check if pitch target is achieved and maintained
        isComplete = Math.abs(droneStore.rotation.x - (this.targets.pitch || 0)) < this.config.angleTolerance;
        break;

      case 'setRoll':
        // Check if roll target is achieved and maintained  
        isComplete = Math.abs(droneStore.rotation.z - (this.targets.roll || 0)) < this.config.angleTolerance;
        break;

      case 'setYaw':
        // Check if yaw target is achieved and maintained
        isComplete = Math.abs(droneStore.rotation.y - (this.targets.heading || 0)) < this.config.angleTolerance;
        break;

      case 'setThrottle':
        // Throttle commands resolve immediately after setting the target
        isComplete = true;
        break;
    }

    if (isComplete) {
      const commandType = this.currentCommand.type;
      this.currentCommand.resolve();
      this.currentCommand = null;

      // Only return to hover mode for movement commands, not for persistent commands
      if (this.isAutopilot && (commandType === 'moveTo' || commandType === 'takeoff' || commandType === 'land')) {
        this.targets = {
          position: droneStore.position.clone(),
          altitude: droneStore.position.y,
          heading: droneStore.rotation.y
        };
      }
      // For angle and throttle commands, keep the targets persistent until manually cancelled
    }
  }

  private checkCommandTimeout(): void {
    if (!this.currentCommand) return;

    const elapsed = Date.now() - this.currentCommand.startTime;
    if (this.currentCommand.timeout && elapsed > this.currentCommand.timeout) {
      this.currentCommand.reject(new Error(`Command ${this.currentCommand.type} timed out after ${elapsed}ms`));
      this.currentCommand = null;
      this.isAutopilot = false;
    }
  }

  emergencyStop(): void {
    // Clear all pending commands
    this.commandQueue = [];

    // Cancel current command if any
    if (this.currentCommand) {
      this.currentCommand.reject(new Error('Emergency stop initiated'));
      this.currentCommand = null;
    }

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
}

// Export singleton instance with simulation adapter
import { SimulationDroneAdapter } from './adapters/simulationAdapter';
import { DronePhysics } from './dronePhysics';

export const drone = new DroneController(
  new SimulationDroneAdapter(new DronePhysics()),
  {
    maxSpeed: 5.0,
    maxAltitude: 50.0,
    safetyLimits: {
      maxTiltAngle: Math.PI / 3,
      maxYawRate: 2.0,
      maxVerticalSpeed: 3.0
    }
  }
);