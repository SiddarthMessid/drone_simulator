/**
 * Simulation Drone Adapter
 * Connects the drone controller to the physics simulation
 */

import { DroneAdapter, DroneState, DroneCommand } from '../interfaces/drone';
import { DronePhysics } from '../dronePhysics';

export class SimulationDroneAdapter implements DroneAdapter {
    private stateUpdateCallback: ((state: DroneState) => void) | null = null;

    constructor(private physics: DronePhysics) { }

    async connect(): Promise<void> {
        return Promise.resolve();
    }

    async disconnect(): Promise<void> {
        this.stateUpdateCallback = null;
        return Promise.resolve();
    }

    async sendCommand(command: DroneCommand): Promise<void> {
        // Commands are handled by DroneController
        return Promise.resolve();
    }

    sendTelemetry(state: DroneState): void {
        // Telemetry is handled by the simulation loop
    }

    onStateUpdate(callback: (state: DroneState) => void): void {
        this.stateUpdateCallback = callback;
    }

    updateState(state: DroneState): void {
        if (this.stateUpdateCallback) {
            this.stateUpdateCallback(state);
        }
    }
}
