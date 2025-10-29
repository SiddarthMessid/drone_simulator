import { create } from 'zustand';
import * as THREE from 'three';
import { SimpleDroneController } from '../droneController.simple';
import { DronePhysics } from '../dronePhysics';
import { SimulationDroneAdapter } from '../adapters/simulationAdapter';
import { useDrone } from './useDrone';

export interface MultiDroneState {
    enabled: boolean;
    drones: Map<string, SimpleDroneController>;
    activeDroneId: string | null;
    maxDrones: number;
    dronePositions: Map<string, THREE.Vector3>;
    droneColors: Map<string, string>;
    currentFormation: 'triangle' | 'line' | 'circle';
}

const DEFAULT_MAX_DRONES = 5;
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
 * Generate formation offsets in LOCAL SPACE (relative to leader)
 * Local space: +X = right, +Z = forward, -Z = behind
 * These offsets will be rotated by leader's yaw to get world positions
 */
function generateFormationOffsets(formation: 'triangle' | 'line' | 'circle', count: number, spacing = 6) {
    const offsets: THREE.Vector3[] = [];
    if (count <= 0) return offsets;

    switch (formation) {
        case 'triangle': {
            // V-formation: drones behind and to the sides of leader
            // Pattern: alternates left-right, moving back in rows
            for (let i = 0; i < count; i++) {
                const side = i % 2 === 0 ? -1 : 1; // Alternate left (-) and right (+)
                const row = Math.floor(i / 2) + 1; // Row number (1, 2, 3...)
                offsets.push(new THREE.Vector3(
                    side * spacing * row,  // X: left/right
                    0,                      // Y: same altitude
                    -spacing * row          // Z: behind leader
                ));
            }
            break;
        }

        case 'line': {
            // Horizontal line: drones side-by-side perpendicular to leader's forward
            // All drones at same Z (slightly behind), spread along X axis
            const start = -spacing * (count - 1) / 2;
            for (let i = 0; i < count; i++) {
                offsets.push(new THREE.Vector3(
                    start + spacing * i,    // X: spread left to right
                    0,                      // Y: same altitude
                    -spacing * 0.5          // Z: slightly behind leader for visibility
                ));
            }
            break;
        }

        case 'circle': {
            // Circle: drones arranged in circle around leader
            // Start from behind (angle=0 at -Z) and go counter-clockwise
            const radius = spacing * 1.2;
            for (let i = 0; i < count; i++) {
                // Start at back (-Z) and rotate counter-clockwise
                const angle = (i / count) * Math.PI * 2;
                offsets.push(new THREE.Vector3(
                    Math.sin(angle) * radius,  // X: side position
                    0,                          // Y: same altitude
                    -Math.cos(angle) * radius   // Z: forward/back position (negative = behind)
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
    removeDrone: (id: string) => void;
    setActiveDrone: (id: string) => void;
    getDrone: (id: string) => SimpleDroneController | undefined;
    updateDronePosition: (id: string, position: THREE.Vector3) => void;
    formationFlight: (formation: 'triangle' | 'line' | 'circle') => void;
    updateFormationPositions: () => void;
    updateMainDroneFormation: () => void;
    swarmBehavior: (behavior: 'follow' | 'scatter' | 'gather') => Promise<void>;
    emergencyLandAll: () => Promise<void>;
    getDroneCount: () => number;
    autoAssignFormation: () => void;
}>((set, get) => ({
    state: {
        enabled: false,
        drones: new Map(),
        activeDroneId: null,
        maxDrones: DEFAULT_MAX_DRONES,
        dronePositions: new Map(),
        droneColors: new Map(),
        currentFormation: 'triangle',
    },

    addDrone: () => {
        const { state } = get();
        if (state.drones.size >= state.maxDrones) {
            console.warn('Maximum number of drones reached');
            return;
        }

        const id = `drone_${state.drones.size + 1}`;

        // Create controller
        const physics = new DronePhysics();
        const adapter = new SimulationDroneAdapter(physics);
        const controller = new SimpleDroneController(adapter, {
            maxSpeed: 5.0,
            maxAltitude: 50.0,
        });

        // Get leader position, rotation, and velocity (use main drone as reference)
        const mainDroneState = useDrone.getState();
        const mainDronePos = mainDroneState.position;
        const mainDroneRot = mainDroneState.rotation;
        const mainDroneVel = mainDroneState.velocity;
        const leaderPos = mainDronePos.clone();
        const leaderRot = mainDroneRot.clone();

        // Calculate formation offset for this drone
        const droneIndex = state.drones.size;
        const offsets = generateFormationOffsets(state.currentFormation, droneIndex + 1, 6);
        const offset = offsets[droneIndex] || new THREE.Vector3(0, 0, -(droneIndex + 1) * 6);

        // Transform offset to world space using leader rotation
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(leaderRot.y);
        const worldOffset = offset.clone();
        worldOffset.applyMatrix4(rotationMatrix);

        // Calculate spawn position (leader + world offset)
        const spawnPos = leaderPos.clone().add(worldOffset);
        spawnPos.y = Math.max(5, leaderPos.y); // Safe altitude

        // Initialize drone state
        const initialState = {
            position: spawnPos,
            rotation: new THREE.Vector3(0, leaderRot.y, 0), // Match leader yaw
            velocity: new THREE.Vector3(0, 0, 0),
            angularVelocity: new THREE.Vector3(0, 0, 0)
        };

        controller.updateState(initialState);
        controller.setFormationTarget(offset);
        controller.setAsLeader(false);
        controller.updateLeaderPosition(leaderPos, leaderRot, mainDroneVel);

        // Add to store
        state.drones.set(id, controller);
        state.dronePositions.set(id, spawnPos.clone());
        state.droneColors.set(id, DEFAULT_COLORS[state.droneColors.size % DEFAULT_COLORS.length]);

        console.log(`Added drone ${id} at ${spawnPos.toArray()} with offset ${offset.toArray()}`);

        // Automatically reassign formation to all drones when count >= 2
        if (state.drones.size >= 2) {
            // Reassign formation offsets to all drones
            const allOffsets = generateFormationOffsets(state.currentFormation, state.drones.size, 6);
            let idx = 0;
            state.drones.forEach((drone, droneId) => {
                const newOffset = allOffsets[idx++] || new THREE.Vector3(0, 0, -idx * 6);
                drone.setFormationTarget(newOffset);
                drone.updateLeaderPosition(leaderPos, leaderRot);
                console.log(`Reassigned drone ${droneId} offset:`, newOffset.toArray());
            });
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

        // Reassign formation to remaining drones
        if (state.drones.size >= 2) {
            const mainDronePos = useDrone.getState().position;
            const mainDroneRot = useDrone.getState().rotation;
            const mainDroneState = useDrone.getState();
            const allOffsets = generateFormationOffsets(state.currentFormation, state.drones.size, 6);
            let idx = 0;
            state.drones.forEach((drone, droneId) => {
                const newOffset = allOffsets[idx++] || new THREE.Vector3(0, 0, -idx * 6);
                drone.setFormationTarget(newOffset);
                drone.updateLeaderPosition(mainDroneState.position, mainDroneState.rotation, mainDroneState.velocity);
            });
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
        state.dronePositions.set(id, position.clone());
    },

    formationFlight: (formation: 'triangle' | 'line' | 'circle') => {
        const { state } = get();
        state.currentFormation = formation;

        if (state.drones.size === 0) return;

        // Get leader position, rotation, and velocity
        const mainDroneState = useDrone.getState();
        const mainDronePos = mainDroneState.position;
        const mainDroneRot = mainDroneState.rotation;
        const mainDroneVel = mainDroneState.velocity;

        // Generate offsets for all drones
        const offsets = generateFormationOffsets(formation, state.drones.size, 6);

        // Assign offsets
        let index = 0;
        state.drones.forEach((drone, id) => {
            const offset = offsets[index] || new THREE.Vector3(0, 0, -(index + 1) * 6);

            drone.setFormationTarget(offset);
            drone.setAsLeader(false);
            drone.updateLeaderPosition(mainDronePos, mainDroneRot, mainDroneVel);

            index++;
        });

        set({ state: { ...state } });
    },

    updateFormationPositions: () => {
        // Not needed in simple version
    },

    updateMainDroneFormation: () => {
        const { state } = get();
        if (state.drones.size === 0) return;

        // Get main drone as leader (position, rotation, AND velocity)
        const mainDroneState = useDrone.getState();
        const mainDronePos = mainDroneState.position;
        const mainDroneRot = mainDroneState.rotation;
        const mainDroneVel = mainDroneState.velocity;

        // Update all drones with leader position, rotation, and velocity
        state.drones.forEach((drone, id) => {
            drone.updateLeaderPosition(mainDronePos, mainDroneRot, mainDroneVel);

            // Update stored position
            const droneState = drone.getState();
            state.dronePositions.set(id, droneState.position.clone());
        });
    },

    swarmBehavior: async (behavior: 'follow' | 'scatter' | 'gather') => {
        // Just use formation flight for now
        get().formationFlight('line');
    },

    emergencyLandAll: async () => {
        const { state } = get();
        state.drones.forEach(drone => drone.emergencyStop());
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

    autoAssignFormation: () => {
        get().formationFlight(get().state.currentFormation);
    },
}));
