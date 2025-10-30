import * as THREE from "three";

export interface DroneState {
  position: THREE.Vector3;
  rotation: THREE.Vector3;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
}

export interface DroneCommand {
  id: string;
  type: 'takeoff' | 'land' | 'setPitch' | 'setRoll' | 'setYaw' | 'setThrottle' | 'moveTo' | 'hover' | 'emergencyStop';
  parameters: Record<string, any>;
  resolve: () => void;
  reject: (error: Error) => void;
  startTime: number;
  timeout: number;
}

export interface DroneControllerConfig {
  maxSpeed: number;
  maxAltitude: number;
  positionTolerance: number;
  altitudeTolerance: number;
  angleTolerance: number;
  commandTimeout: number;
  safetyLimits: {
    maxTiltAngle: number;
    maxYawRate: number;
    maxVerticalSpeed: number;
  };
}

export interface DroneAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendCommand(command: DroneCommand): Promise<void>;
  sendTelemetry(state: DroneState): void;
  onStateUpdate(callback: (state: DroneState) => void): void;
}