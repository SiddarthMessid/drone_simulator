import { create } from "zustand";
import * as THREE from "three";
import { PIDParams } from "../pidController";
import { defaultPIDParams } from "../codeCompiler";

export interface DroneState {
  position: THREE.Vector3;
  rotation: THREE.Vector3;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
}

export interface DroneTelemetry {
  altitude: number;
  speed: number;
  pitch: number;
  roll: number;
  yaw: number;
  throttle: number;
}

interface DroneStore {
  // State
  position: THREE.Vector3;
  rotation: THREE.Vector3;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  pidParams: PIDParams;
  telemetry: DroneTelemetry;

  // Actions
  updateDrone: (state: DroneState) => void;
  updatePIDParams: (params: PIDParams) => void;
  setTelemetry: (telemetry: DroneTelemetry) => void;
  reset: () => void;
  // Altitude-hold for main drone
  altitudeHoldEnabled: boolean;
  holdPosition: THREE.Vector3 | null;
  enableAltitudeHold: (enabled: boolean) => void;
}

export const useDrone = create<DroneStore>((set, get) => ({
  // Initial state - start at safe height above ground
  position: new THREE.Vector3(0, 10, 0),
  rotation: new THREE.Vector3(0, 0, 0),
  velocity: new THREE.Vector3(0, 0, 0),
  angularVelocity: new THREE.Vector3(0, 0, 0),
  pidParams: defaultPIDParams,
  telemetry: {
    altitude: 10,
    speed: 0,
    pitch: 0,
    roll: 0,
    yaw: 0,
    throttle: 0,
  },

  updateDrone: (state: DroneState) => {
    set({
      position: state.position.clone(),
      rotation: state.rotation.clone(),
      velocity: state.velocity.clone(),
      angularVelocity: state.angularVelocity.clone(),
    });
  },

  updatePIDParams: (params: PIDParams) => {
    console.log("Updating PID parameters:", params);
    set({ pidParams: params });
  },

  setTelemetry: (telemetry: DroneTelemetry) => {
    set({ telemetry });
  },

  // Altitude-hold for the main drone
  // When enabled, the store will keep a holdPosition that higher-level
  // controllers can read to hold the drone in place.
  // Note: this is intentionally lightweight — DroneController instances
  // can also implement their own local hold; this allows main drone UI
  // to toggle hold from the global store.
  altitudeHoldEnabled: false,
  holdPosition: null as unknown as THREE.Vector3 | null,
  enableAltitudeHold: (enabled: boolean) => {
    const state = get();
    if (enabled) {
      // capture current store position
      const p = state.position.clone();
      set({ altitudeHoldEnabled: true, holdPosition: p });
    } else {
      set({ altitudeHoldEnabled: false, holdPosition: null });
    }
  },

  reset: () => {
    set({
      position: new THREE.Vector3(0, 5, 0),
      rotation: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      angularVelocity: new THREE.Vector3(0, 0, 0),
      telemetry: {
        altitude: 5,
        speed: 0,
        pitch: 0,
        roll: 0,
        yaw: 0,
        throttle: 0,
      },
    });
  },
}));
