import { create } from 'zustand';
import * as THREE from 'three';
import { DroneController } from '../droneController.new';
import { DronePhysics } from '../dronePhysics';
import { SimulationDroneAdapter } from '../adapters/simulationAdapter';
import { PIDParams } from '../pidController';
import { useDrone } from './useDrone';

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

/**
 * Generate formation offsets relative to a leader for a given formation type.
 * - formation: 'triangle' | 'line' | 'circle'
 * - count: number of followers
 * - spacing: lateral/longitudinal spacing
 */
function generateFormationOffsets(formation: 'triangle' | 'line' | 'circle', count: number, spacing = 5) {
  const offsets: THREE.Vector3[] = [];
  if (count <= 0) return offsets;

  switch (formation) {
    case 'triangle': {
      // Arrange followers in an expanding V (rows behind leader)
      for (let i = 0; i < count; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const row = Math.floor(i / 2) + 1;
        offsets.push(new THREE.Vector3(
          side * spacing * row,
          0,
          -spacing * row
        ));
      }
      break;
    }

    case 'line': {
      // Horizontal line: drones alternating left and right of leader
      // Pattern: right, left, right, left, etc.
      for (let i = 0; i < count; i++) {
        const side = i % 2 === 0 ? 1 : -1; // Alternate right (+) and left (-)
        const distance = Math.floor(i / 2) + 1; // Distance from center (1, 1, 2, 2, 3, 3...)
        offsets.push(new THREE.Vector3(
          side * spacing * distance,  // X: alternate left/right
          0,                          // Y: same altitude
          0                           // Z: same forward/back position as leader
        ));
      }
      break;
    }

    case 'circle': {
      const radius = Math.max(spacing * 0.8, spacing * (count / (2 * Math.PI)));
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        offsets.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ));
      }
      break;
    }
  }

  return offsets;
}

export const useMultiDrone = create<{
  state: MultiDroneState;
  toggleEnabled: () => void;
  addDrone: () => void;
  autoAssignFormation: () => void;
  removeDrone: (id: string) => void;
  setActiveDrone: (id: string) => void;
  getDrone: (id: string) => DroneController | undefined;
  updateDronePosition: (id: string, position: THREE.Vector3) => void;
  formationFlight: (formation: 'triangle' | 'line' | 'circle') => void;
  updateFormationPositions: () => void;
  updateMainDroneFormation: () => void;
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

    // Get main drone position as reference for spawning
    const mainDronePos = useDrone.getState().position;

    // Determine leader position and whether there is an in-fleet leader.
    const activeId = state.activeDroneId;
    const leaderInFleet = activeId ? state.drones.has(activeId) : false;
    let leaderPos: THREE.Vector3;
    let leaderRot = new THREE.Vector3(0, 0, 0);
    if (leaderInFleet && activeId) {
      const leaderController = state.drones.get(activeId)!;
      const leaderState = leaderController.getState();
      leaderPos = leaderState.position.clone();
      leaderRot = leaderState.rotation.clone();
    } else {
      // Fallback to the global main drone as leader reference
      leaderPos = mainDronePos.clone();
    }

    // Compute formation offsets for current follower count (including the new drone)
    const spacing = 5;
    // If leader is inside fleet we exclude it from follower count;
    // otherwise all drones in the map are treated as followers of the global main drone.
    const followerCount = state.drones.size + 1 - (leaderInFleet ? 1 : 0);
    const offsets = generateFormationOffsets('circle', Math.max(0, followerCount), spacing);

    // Calculate the spawn position for the new drone (in world space)
    const newDroneOffset = offsets[followerCount - 1] || new THREE.Vector3(0, 0, -followerCount * spacing);

    // Transform offset to world space based on leader rotation
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationY(leaderRot.y);
    const worldOffset = newDroneOffset.clone();
    worldOffset.applyMatrix4(rotationMatrix);

    // Calculate spawn position (leader position + world offset)
    const spawnPosition = leaderPos.clone().add(worldOffset);

    // Ensure spawn altitude is reasonable (at least 5m above ground)
    spawnPosition.y = Math.max(5, leaderPos.y);

    // Initialize the new drone at the spawn position with zero rotation
    const initialState = {
      position: spawnPosition.clone(),
      rotation: new THREE.Vector3(0, 0, 0), // Zero pitch, yaw, and roll
      velocity: new THREE.Vector3(0, 0, 0),
      angularVelocity: new THREE.Vector3(0, 0, 0)
    };

    // Set up the controller with initial state
    controller.updateState(initialState);
    controller.setFormationTarget(newDroneOffset);
    controller.setAsLeader(false);
    controller.updateLeaderPosition(leaderPos, leaderRot);

    // Add to store
    state.drones.set(id, controller);
    state.dronePositions.set(id, spawnPosition.clone());
    state.droneColors.set(id, DEFAULT_COLORS[(state.droneColors.size) % DEFAULT_COLORS.length]);

    console.log(`Added drone ${id} at position:`, spawnPosition, 'with formation offset:', newDroneOffset);

    // Reassign formation offsets to all existing drones
    let posIndex = 0;
    state.drones.forEach((drone, curId) => {
      if (leaderInFleet && curId === activeId) {
        // This is the leader inside the fleet
        drone.setAsLeader(true);
        return;
      }

      // Assign formation offset
      const offset = posIndex < offsets.length ? offsets[posIndex++] : new THREE.Vector3(0, 0, -(posIndex + 1) * spacing);
      drone.setFormationTarget(offset);
      drone.setAsLeader(false);
      drone.updateLeaderPosition(leaderPos, leaderRot);

      // Sync the drone position in the store for UI and other systems
      const droneState = drone.getState();
      if (droneState && droneState.position) {
        state.dronePositions.set(curId, droneState.position.clone());
      }
    });

    // If this was the first drone, make it the active leader by default
    if (!state.activeDroneId) {
      state.activeDroneId = id;
      const added = state.drones.get(id);
      if (added) added.setAsLeader(true);
    }

    // Persist state (formation already assigned above, no need to call autoAssignFormation)
    set({ state: { ...state } });
  },

  autoAssignFormation: () => {
    const { state } = get();
    const { drones } = state;

    // Default to circle formation based on drone count
    const spacing = 5;
    const followerCount = drones.size;
    const positions = generateFormationOffsets('circle', followerCount, spacing);

    let posIndex = 0;
    drones.forEach((drone, id) => {
      if (posIndex < positions.length) {
        const offset = positions[posIndex++];
        drone.setFormationTarget(offset);
        drone.setAsLeader(false);
        console.log(`Auto-assigned drone ${id} formation offset:`, offset);
      }
    });
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
    const { drones, activeDroneId, dronePositions } = state;

    if (drones.size < 2) {
      console.log('Swarm behavior requires at least 2 drones');
      return;
    }

    console.log(`Activating ${behavior} swarm behavior with ${drones.size} drones`);

    // For now only 'follow' behavior is supported through the UI.
    switch (behavior) {
      case 'follow':
        // Set up continuous follow formation - drones follow leader in a line
        if (!activeDroneId) {
          console.log('No active drone set as leader');
          return;
        }

        const leaderPos = dronePositions.get(activeDroneId);
        if (!leaderPos) {
          console.error('Leader position not found');
          return;
        }

        const leader = drones.get(activeDroneId);
        if (leader) {
          leader.setAsLeader(true);
          console.log(`Setting ${activeDroneId} as leader for follow mode at:`, leaderPos);
        }

        // Set up follow positions behind the leader
        const followSpacing = 5;
        let followerIndex = 0;

        drones.forEach((drone, id) => {
          if (id !== activeDroneId) {
            drone.setAsLeader(false);
            // Position drones in a line behind the leader
            const followOffset = new THREE.Vector3(
              0,
              0,
              -(followerIndex + 1) * followSpacing
            );
            drone.setFormationTarget(followOffset);
            // Update leader position immediately
            const leaderState = leader?.getState();
            if (leaderState) {
              drone.updateLeaderPosition(leaderPos, leaderState.rotation);
            }
            console.log(`Drone ${id} set to follow at offset:`, followOffset);
            followerIndex++;
          }
        });
        break;

      case 'scatter':
        console.log('Scatter behavior is currently disabled in the simplified UI');
        break;

      case 'gather':
        console.log('Gather behavior is currently disabled in the simplified UI');
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
    const { drones, activeDroneId, dronePositions } = state;
    if (!activeDroneId || drones.size < 2) {
      console.log('Formation flight requires at least 2 drones and an active leader');
      return;
    }

    // Get leader's current position - this is critical!
    const leaderPos = dronePositions.get(activeDroneId);
    if (!leaderPos) {
      console.error('Leader position not found');
      return;
    }

    const leader = drones.get(activeDroneId);
    if (!leader) {
      console.error('Leader drone controller not found');
      return;
    }

    const leaderState = leader.getState();
    console.log(`Activating ${formation} formation with ${drones.size} drones, leader at:`, leaderPos);

    const spacing = 5; // Distance between drones - increased for better visibility
    const followerCount = drones.size - 1;
    const relativeOffsets = generateFormationOffsets(formation, followerCount, spacing);

    // Set leader status
    leader.setAsLeader(true);
    console.log(`Setting ${activeDroneId} as leader for ${formation} formation at position:`, leaderPos);

    // Assign formation offsets to follower drones
    let posIndex = 0;
    drones.forEach((drone, id) => {
      if (id !== activeDroneId) {
        drone.setAsLeader(false);
        if (posIndex < relativeOffsets.length) {
          const offset = relativeOffsets[posIndex++];
          drone.setFormationTarget(offset);
          // Immediately update leader position so formation targets are calculated
          drone.updateLeaderPosition(leaderPos, leaderState.rotation);
          console.log(`Drone ${id} formation offset:`, offset, 'Leader pos:', leaderPos);
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

  updateMainDroneFormation: () => {
    const { state } = get();
    const { drones, dronePositions } = state;

    if (drones.size === 0) return;

    // Get main drone position and rotation from the global drone store
    // Prefer the active drone in the fleet as the leader if available
    const activeId = state.activeDroneId;
    let leaderPos: THREE.Vector3 | null = null;
    let leaderRot: THREE.Vector3 | null = null;

    if (activeId && drones.has(activeId)) {
      const leaderController = drones.get(activeId)!;
      const leaderState = leaderController.getState();
      leaderPos = leaderState.position.clone();
      leaderRot = leaderState.rotation.clone();
    } else {
      // Fallback to the global main drone if no active fleet leader
      const mainDroneState = useDrone.getState();
      leaderPos = mainDroneState.position.clone();
      leaderRot = mainDroneState.rotation.clone();
    }

    // Update follower drones' leader position so they can calculate their formation targets
    drones.forEach((drone, id) => {
      // Skip updating the leader's own leader position
      if (id === activeId) return;

      if (leaderPos && leaderRot) {
        drone.updateLeaderPosition(leaderPos, leaderRot);
      }

      // Sync the drone position in the store for UI and other systems
      const droneState = drone.getState();
      if (droneState && droneState.position) {
        dronePositions.set(id, droneState.position.clone());
      }
    });

    set({ state: { ...state } });
  },
}));