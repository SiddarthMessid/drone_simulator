import * as THREE from "three";
import { PIDSetpoints } from "./pidController";
import { useDrone } from "./stores/useDrone";

export interface DroneCommand {
  id: string;
  type: 'takeoff' | 'land' | 'setPitch' | 'setRoll' | 'setYaw' | 'setThrottle' | 'moveTo' | 'hover';
  parameters: any;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  startTime: number;
  timeout?: number;
}

export interface DroneControllerOptions {
  maxSpeed?: number;
  positionTolerance?: number;
  altitudeTolerance?: number;
  angleTolerance?: number;
}

export interface MovementTarget {
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
  private currentCommand: DroneCommand | null = null;
  private commandQueue: DroneCommand[] = [];
  private targets: MovementTarget = {};
  private options: Required<DroneControllerOptions>;
  private isAutopilot = false;
  private manualSetpoints: PIDSetpoints = { pitch: 0, roll: 0, yaw: 0, throttle: 0 };
  
  constructor(options: DroneControllerOptions = {}) {
    this.options = {
      maxSpeed: 5.0,
      positionTolerance: 0.5,
      altitudeTolerance: 0.3,
      angleTolerance: 0.05,
      ...options
    };
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
        timeout: 1000 // 1 second to stabilize
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
    
    if (!this.isAutopilot) {
      // Use manual controls when not in autopilot mode
      return manualControls;
    }

    // Generate autopilot setpoints based on targets when in autopilot mode
    const setpoints = this.calculateAutopilotSetpoints();
    
    // Check if command is complete
    this.checkCommandCompletion();
    
    return setpoints;
  }

  private executeCommand(command: DroneCommand): void {
    this.currentCommand = command;
  }

  private calculateAutopilotSetpoints(): PIDSetpoints {
    const droneStore = useDrone.getState();
    const setpoints: PIDSetpoints = { pitch: 0, roll: 0, yaw: 0, throttle: 0 };
    
    // Direct throttle control (takes priority over altitude control)
    if (this.targets.throttle !== undefined) {
      setpoints.throttle = this.targets.throttle;
    }
    // Altitude control (when no direct throttle is set)
    else if (this.targets.altitude !== undefined) {
      const altitudeError = this.targets.altitude - droneStore.position.y;
      setpoints.throttle = Math.max(-1, Math.min(1, altitudeError * 2));
    }
    
    // Position control
    if (this.targets.position) {
      const positionError = this.targets.position.clone().sub(droneStore.position);
      const distance = positionError.length();
      
      if (distance > this.options.positionTolerance) {
        // Calculate desired pitch and roll based on position error
        const maxTilt = 0.3; // 17 degrees
        setpoints.pitch = Math.max(-maxTilt, Math.min(maxTilt, -positionError.z * 0.5));
        setpoints.roll = Math.max(-maxTilt, Math.min(maxTilt, positionError.x * 0.5));
      }
    }
    
    // Heading control
    if (this.targets.heading !== undefined) {
      const headingError = this.targets.heading - droneStore.rotation.y;
      setpoints.yaw = Math.max(-1, Math.min(1, headingError * 2));
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
        isComplete = Math.abs(droneStore.position.y - targetAlt) < this.options.altitudeTolerance;
        break;
        
      case 'hover':
        // Consider hovering complete after stabilization time
        isComplete = Date.now() - this.currentCommand.startTime > 1000;
        break;
        
      case 'moveTo':
        if (this.targets.position) {
          const distance = droneStore.position.distanceTo(this.targets.position);
          isComplete = distance < this.options.positionTolerance;
        }
        break;
        
      case 'setPitch':
        // Check if pitch target is achieved and maintained
        isComplete = Math.abs(droneStore.rotation.x - (this.targets.pitch || 0)) < this.options.angleTolerance;
        break;
        
      case 'setRoll':
        // Check if roll target is achieved and maintained  
        isComplete = Math.abs(droneStore.rotation.z - (this.targets.roll || 0)) < this.options.angleTolerance;
        break;
        
      case 'setYaw':
        // Check if yaw target is achieved and maintained
        isComplete = Math.abs(droneStore.rotation.y - (this.targets.heading || 0)) < this.options.angleTolerance;
        break;
        
      case 'setThrottle':
        // Throttle commands resolve immediately after setting the target
        isComplete = true;
        break;
    }
    
    if (isComplete) {
      const commandType = this.currentCommand.type;
      this.currentCommand.resolve(true);
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
}

// Export singleton instance
export const drone = new DroneController();