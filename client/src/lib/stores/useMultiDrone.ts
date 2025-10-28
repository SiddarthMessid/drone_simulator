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
    
    // Set initial position with offset from main drone to avoid collisions
    const offsetIndex = state.drones.size;
    const position = new THREE.Vector3(
      mainDronePos.x + ((offsetIndex * 3) % 9) - 4, // Spread around main drone
      mainDronePos.y, // Same altitude as main drone
      mainDronePos.z + Math.floor(offsetIndex / 3) * 3 - 3 // Offset in Z
    );

    console.log(`Adding drone ${id} at position:`, position, 'Main drone at:', mainDronePos);

    // Initialize drone state with proper altitude target
    const initialState = {
      position: position.clone(),
      rotation: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      angularVelocity: new THREE.Vector3(0, 0, 0)
    };
    controller.updateState(initialState);
    
    // Set initial altitude target to maintain current height
    controller.setAltitudeTarget(position.y);

    state.drones.set(id, controller);
    state.dronePositions.set(id, position);
    state.droneColors.set(id, DEFAULT_COLORS[state.drones.size - 1]);

    // All drones are followers of the main drone
    controller.setAsLeader(false);
    
    // Auto-assign formation position based on drone count
    get().autoAssignFormation();

    set({ state: { ...state } });
  },

  autoAssignFormation: () => {
    const { state } = get();
    const { drones } = state;
    
    // Default to V-formation (triangle) for automatic following
    const spacing = 5;
    const positions: THREE.Vector3[] = [];
    const droneCount = drones.size;

    // Generate V-formation positions for all drones
    for (let i = 0; i < droneCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 2) + 1;
      positions.push(new THREE.Vector3(
        side * spacing * row,  // Lateral spread
        0,                      // Same altitude as main drone
        -spacing * row          // Behind main drone
      ));
    }

    // Assign positions to all drones
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
        // Clear formation mode first
        drones.forEach((drone, id) => {
          if (id !== activeDroneId) {
            drone.setAsLeader(false);
            drone.clearFormationTarget();
          }
        });

        // Get leader position as reference point for scattering
        const scatterLeaderPos = activeDroneId ? dronePositions.get(activeDroneId) : null;
        const basePos = scatterLeaderPos || new THREE.Vector3(0, 5, 0);
        
        // Pre-calculate scatter positions to avoid Math.random in render
        const scatterPositions: Map<string, THREE.Vector3> = new Map();
        let droneIndex = 0;
        drones.forEach((drone, id) => {
          if (id !== activeDroneId) {
            // Use deterministic positions based on drone index
            const angle = (droneIndex / (drones.size - 1)) * Math.PI * 2;
            const radius = 10 + droneIndex * 2;
            scatterPositions.set(id, new THREE.Vector3(
              basePos.x + Math.cos(angle) * radius,
              basePos.y + (droneIndex % 3) * 2, // Vary altitude slightly
              basePos.z + Math.sin(angle) * radius
            ));
            droneIndex++;
          }
        });

        // Move drones to scatter positions
        const scatterPromises = Array.from(drones.entries())
          .filter(([id]) => id !== activeDroneId)
          .map(([id, drone]) => {
            const targetPos = scatterPositions.get(id);
            if (targetPos) {
              console.log(`Scattering drone ${id} to:`, targetPos);
              return drone.moveTo(targetPos);
            }
            return Promise.resolve();
          });
        
        await Promise.all(scatterPromises);
        break;

      case 'gather':
        // Clear formation mode first
        drones.forEach((drone, id) => {
          if (id !== activeDroneId) {
            drone.setAsLeader(false);
            drone.clearFormationTarget();
          }
        });

        // Get leader position as gather point, or use current average position
        const gatherLeaderPos = activeDroneId ? dronePositions.get(activeDroneId) : null;
        let gatherPos: THREE.Vector3;
        
        if (gatherLeaderPos) {
          gatherPos = gatherLeaderPos.clone();
        } else {
          // Calculate center of all drones
          gatherPos = new THREE.Vector3(0, 0, 0);
          let count = 0;
          dronePositions.forEach((pos) => {
            gatherPos.add(pos);
            count++;
          });
          if (count > 0) {
            gatherPos.divideScalar(count);
          }
        }

        console.log(`Gathering all drones to:`, gatherPos);
        
        // Move all follower drones to gather position
        const gatherPromises = Array.from(drones.entries())
          .filter(([id]) => id !== activeDroneId)
          .map(([id, drone]) => {
            console.log(`Gathering drone ${id} to:`, gatherPos);
            return drone.moveTo(gatherPos);
          });
        
        await Promise.all(gatherPromises);
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
    const relativeOffsets: THREE.Vector3[] = [];
    const followerCount = drones.size - 1;

    // Calculate formation offsets relative to leader in local space
    switch (formation) {
      case 'triangle':
        // V-formation (triangle) - classic flight formation
        // Followers arranged in a V behind the leader
        for (let i = 0; i < followerCount; i++) {
          const side = i % 2 === 0 ? -1 : 1; // Alternate left and right
          const row = Math.floor(i / 2) + 1;
          relativeOffsets.push(new THREE.Vector3(
            side * spacing * row,  // Lateral offset (left/right)
            0,                      // Same altitude as leader
            -spacing * row          // Behind the leader
          ));
        }
        break;

      case 'line':
        // Horizontal line formation - all at same Z, spread in X
        const lineStart = -spacing * followerCount / 2;
        for (let i = 0; i < followerCount; i++) {
          relativeOffsets.push(new THREE.Vector3(
            lineStart + spacing * (i + 1), // Spread horizontally
            0,                               // Same altitude
            0                                // Same Z as leader
          ));
        }
        break;

      case 'circle':
        // Circular formation around the leader
        const radius = spacing * 1.5;
        for (let i = 0; i < followerCount; i++) {
          const angle = (i / followerCount) * Math.PI * 2;
          relativeOffsets.push(new THREE.Vector3(
            Math.cos(angle) * radius,  // X position on circle
            0,                          // Same altitude
            Math.sin(angle) * radius    // Z position on circle
          ));
        }
        break;
    }

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
    const mainDroneState = useDrone.getState();
    const mainDronePos = mainDroneState.position.clone();
    const mainDroneRot = mainDroneState.rotation.clone();
    
    // Update all fleet drones' leader position so they can calculate their formation targets
    drones.forEach((drone, id) => {
      // Update where the leader (main drone) is
      drone.updateLeaderPosition(mainDronePos, mainDroneRot);
      
      // Sync the drone position in the store for UI and other systems
      const droneState = drone.getState();
      if (droneState && droneState.position) {
        dronePositions.set(id, droneState.position.clone());
      }
    });
    
    set({ state: { ...state } });
  },
}));