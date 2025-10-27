import { create } from 'zustand';
import * as THREE from 'three';
import { DroneController } from '../droneController.new';
import { DronePhysics } from '../dronePhysics';
import { SimulationDroneAdapter } from '../adapters/simulationAdapter';
import { PIDParams } from '../pidController';

export interface MultiDroneState {
  enabled: boolean;
  drones: Map<string, DroneController>;
  activeDroneId: string | null;
  maxDrones: number;
  dronePositions: Map<string, THREE.Vector3>;
  droneColors: Map<string, string>;
}

const DEFAULT_MAX_DRONES = 7;
const DEFAULT_COLORS = [
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
];

export const useMultiDrone = create<{
  state: MultiDroneState;
  toggleEnabled: () => void;
  addDrone: () => void;
  removeDrone: (id: string) => void;
  setActiveDrone: (id: string) => void;
  getDrone: (id: string) => DroneController | undefined;
  updateDronePosition: (id: string, position: THREE.Vector3) => void;
  formationFlight: (formation: 'triangle' | 'line' | 'circle') => void;
  updateFormationPositions: () => void;
  swarmBehavior: (behavior: 'follow' | 'scatter' | 'gather') => Promise<void>;
  emergencyLandAll: () => Promise<void>;
  getDroneCount: () => number;
}>((set, get) => ({
  state: {
    enabled: false,
    drones: new Map(),
    activeDroneId: null,
    maxDrones: DEFAULT_MAX_DRONES,
    dronePositions: new Map(),
    droneColors: new Map(),
  },

  addDrone: () => {
    const { state } = get();
    if (state.drones.size >= state.maxDrones) {
      console.warn('Maximum number of drones reached');
      return;
    }

    const id = `drone_${state.drones.size + 1}`;
    const physics = new DronePhysics();
    const adapter = new SimulationDroneAdapter(physics);
    const controller = new DroneController(adapter, {
      maxSpeed: 5.0,
      maxAltitude: 50.0,
      positionTolerance: 0.5,
    });

    // Set initial position with offset to avoid collisions
    const position = new THREE.Vector3(
      (state.drones.size * 3) % 9, // X position
      5, // Y position (height)
      Math.floor(state.drones.size / 3) * 3 // Z position
    );

    // Set default hover mode for fleet drones
    controller.setHoverMode(true);

    state.drones.set(id, controller);
    state.dronePositions.set(id, position);
    state.droneColors.set(id, DEFAULT_COLORS[state.drones.size - 1]);

    if (!state.activeDroneId) {
      state.activeDroneId = id;
    }

    set({ state: { ...state } });
  },

  removeDrone: (id: string) => {
    const { state } = get();
    if (!state.drones.has(id)) return;

    const drone = state.drones.get(id);
    if (drone) {
      drone.emergencyStop();
    }

    state.drones.delete(id);
    state.dronePositions.delete(id);
    state.droneColors.delete(id);

    if (state.activeDroneId === id) {
      state.activeDroneId = state.drones.size > 0 ? 
        Array.from(state.drones.keys())[0] : null;
    }

    set({ state: { ...state } });
  },

  setActiveDrone: (id: string) => {
    const { state } = get();
    if (state.drones.has(id)) {
      state.activeDroneId = id;
      set({ state: { ...state } });
    }
  },

  getDrone: (id: string) => {
    return get().state.drones.get(id);
  },

  updateDronePosition: (id: string, position: THREE.Vector3) => {
    const { state } = get();
    if (state.dronePositions.has(id)) {
      state.dronePositions.set(id, position);
      set({ state: { ...state } });
    }
  },



  // Swarm behaviors
  swarmBehavior: async (behavior: 'follow' | 'scatter' | 'gather') => {
    const { state } = get();
    const drones = Array.from(state.drones.entries());
    if (drones.length < 2) return;

    switch (behavior) {
      case 'follow':
        // Follow the leader (first drone)
        const [leaderId, leader] = drones[0];
        const leaderPos = state.dronePositions.get(leaderId);
        if (!leaderPos) return;

        await Promise.all(drones.slice(1).map(async ([id, drone], index) => {
          const followPos = new THREE.Vector3(
            leaderPos.x - ((index + 1) * 2),
            leaderPos.y,
            leaderPos.z
          );
          await drone.moveTo(followPos);
        }));
        break;

      case 'scatter':
        // Random scatter pattern
        await Promise.all(drones.map(async ([_, drone]) => {
          const randomPos = new THREE.Vector3(
            (Math.random() - 0.5) * 20,
            5 + Math.random() * 5,
            (Math.random() - 0.5) * 20
          );
          await drone.moveTo(randomPos);
        }));
        break;

      case 'gather':
        // Gather at center point
        const centerPos = new THREE.Vector3(0, 10, 0);
        await Promise.all(drones.map(async ([_, drone]) => {
          await drone.moveTo(centerPos);
        }));
        break;
    }
  },

  emergencyLandAll: async () => {
    const { state } = get();
    await Promise.all(
      Array.from(state.drones.values()).map(drone => drone.land())
    );
  },

  toggleEnabled: () => {
    const { state } = get();
    set({
      state: {
        ...state,
        enabled: !state.enabled,
      },
    });
  },

  getDroneCount: () => {
    return get().state.drones.size;
  },

  formationFlight: (formation: 'triangle' | 'line' | 'circle') => {
    const { state } = get();
    const { drones, activeDroneId } = state;
    if (!activeDroneId || drones.size < 2) return;

    const spacing = 3; // Distance between drones
    const positions: THREE.Vector3[] = [];

    switch (formation) {
      case 'triangle':
        positions.push(
          new THREE.Vector3(-spacing, 0, -spacing),
          new THREE.Vector3(spacing, 0, -spacing),
          new THREE.Vector3(0, 0, -spacing * 2),
          new THREE.Vector3(-spacing * 2, 0, -spacing * 2),
          new THREE.Vector3(spacing * 2, 0, -spacing * 2),
          new THREE.Vector3(0, 0, -spacing * 3)
        );
        break;

      case 'line':
        for (let i = 0; i < state.maxDrones - 1; i++) {
          positions.push(new THREE.Vector3(spacing * (i - (state.maxDrones - 2) / 2), 0, -spacing));
        }
        break;

      case 'circle':
        const radius = spacing * 1.5;
        for (let i = 0; i < state.maxDrones - 1; i++) {
          const angle = (i / (state.maxDrones - 1)) * Math.PI * 2;
          positions.push(new THREE.Vector3(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius - spacing
          ));
        }
        break;
    }

    // Set leader and formation positions
    const leader = drones.get(activeDroneId);
    if (leader) {
      leader.setAsLeader(true);
    }

    let posIndex = 0;
    drones.forEach((drone, id) => {
      if (id !== activeDroneId) {
        drone.setAsLeader(false);
        if (posIndex < positions.length) {
          drone.setFormationTarget(positions[posIndex++]);
        }
      }
    });
  },

  updateFormationPositions: () => {
    const { state } = get();
    const { drones, activeDroneId, dronePositions } = state;
    
    if (!activeDroneId) return;
    
    const leaderPos = dronePositions.get(activeDroneId);
    const leader = drones.get(activeDroneId);
    
    if (leaderPos && leader) {
      const leaderState = leader.getState();
      drones.forEach((drone, id) => {
        if (id !== activeDroneId) {
          drone.updateLeaderPosition(leaderPos, leaderState.rotation);
        }
      });
    }
  },
}));