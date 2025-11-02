/**
 * Drone Controller
 * High-level API for drone control with autopilot capabilities
 */

import * as THREE from "three";
import { PIDSetpoints } from "./pidController";
import { useDrone } from "./stores/useDrone";
import { useEnvironment } from "./stores/useEnvironment";
import { useMultiDrone } from "./stores/useMultiDrone.simple";
import { DroneAdapter, DroneState, DroneCommand, DroneControllerConfig } from './interfaces/drone';

const DEFAULT_CONFIG: DroneControllerConfig = {
    maxSpeed: 5.0,
    maxAltitude: 50.0,
    positionTolerance: 0.5,
    altitudeTolerance: 0.5,
    angleTolerance: 0.05,
    commandTimeout: 30000,
    safetyLimits: {
        maxTiltAngle: Math.PI / 3,
        maxYawRate: 2.0,
        maxVerticalSpeed: 3.0,
    },
};

interface MovementTarget {
    position?: THREE.Vector3;
    altitude?: number;
    heading?: number;
    pitch?: number;
    roll?: number;
    throttle?: number;
}

export class DroneController {
    private adapter: DroneAdapter;
    private state: DroneState | null = null;
    private currentCommand: DroneCommand | null = null;
    private targets: MovementTarget = {};
    private config: DroneControllerConfig;
    private isAutopilot = false;
    private manualSetpoints: PIDSetpoints = { pitch: 0, roll: 0, yaw: 0, throttle: 0 };
    private holdThrottleExpire: number | null = null;
    private lastManualActive: boolean = false;

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

        if (Math.abs(state.rotation.x) > maxTiltAngle || Math.abs(state.rotation.z) > maxTiltAngle) {
            console.error('Safety limit exceeded: Max tilt angle');
            this.emergencyStop();
            return;
        }

        if (Math.abs(state.angularVelocity.y) > maxYawRate) {
            console.error('Safety limit exceeded: Max yaw rate');
            this.emergencyStop();
            return;
        }

        if (Math.abs(state.velocity.y) > maxVerticalSpeed) {
            console.error('Safety limit exceeded: Max vertical speed');
            this.emergencyStop();
            return;
        }
    }

    async takeoff(targetAltitude: number = 10): Promise<void> {
        const droneStore = useDrone.getState();
        const currentPos = droneStore.position;
        const groundHeight = this.getGroundHeightAtPosition(currentPos);
        const minTakeoffHeight = groundHeight + 2.0; // Minimum 2m above ground

        // Ensure takeoff altitude is above ground
        const safeAltitude = Math.max(targetAltitude, minTakeoffHeight);

        console.log(`[TAKEOFF] Current position: (${currentPos.x.toFixed(1)}, ${currentPos.y.toFixed(2)}, ${currentPos.z.toFixed(1)})`);
        console.log(`[TAKEOFF] Ground height at position: ${groundHeight.toFixed(2)}m`);
        console.log(`[TAKEOFF] Requested altitude: ${targetAltitude}m, Safe altitude: ${safeAltitude}m`);

        if (safeAltitude !== targetAltitude) {
            console.warn(`[TAKEOFF] ⚠️ Adjusted altitude from ${targetAltitude}m to ${safeAltitude}m (ground at ${groundHeight.toFixed(2)}m)`);
        }

        return new Promise((resolve, reject) => {
            this.cancelCurrentCommand();
            this.isAutopilot = true;

            const command: DroneCommand = {
                id: `takeoff_${Date.now()}`,
                type: 'takeoff',
                parameters: { targetAltitude: safeAltitude },
                resolve,
                reject,
                startTime: Date.now(),
                timeout: 15000,
            };

            this.targets = { altitude: safeAltitude };
            this.executeCommand(command);
        });
    }

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
                timeout: 20000,
            };

            this.targets = { altitude: 0.5 };
            this.executeCommand(command);
        });
    }

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
                timeout: 10000,
            };

            this.targets = {
                position: droneStore.position.clone(),
                altitude: droneStore.position.y,
                heading: droneStore.rotation.y,
            };

            this.executeCommand(command);
        });
    }

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
                timeout: 5000,
            };

            this.targets.pitch = radians;
            this.executeCommand(command);
        });
    }

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
                timeout: 5000,
            };

            this.targets.roll = radians;
            this.executeCommand(command);
        });
    }

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
                timeout: 5000,
            };

            this.targets.heading = radians;
            this.executeCommand(command);
        });
    }

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
                timeout: 1000,
            };

            this.targets.throttle = throttle;
            this.executeCommand(command);
        });
    }

    async dir(fromX: number, fromY: number, fromZ: number, toX: number, toY: number, toZ: number): Promise<void> {
        const toVec = new THREE.Vector3(toX, toY, toZ);
        return this.moveTo(toVec);
    }

    async moveTo(targetPosition: THREE.Vector3, options: { speed?: number, timeout?: number } = {}): Promise<void> {
        return new Promise((resolve, reject) => {
            const command: DroneCommand = {
                id: `moveTo_${Date.now()}`,
                type: 'moveTo',
                startTime: Date.now(),
                parameters: { targetPosition, speed: options.speed || 5.0 },
                resolve,
                reject,
                timeout: options.timeout || this.config.commandTimeout
            };

            this.targets.position = targetPosition.clone();
            this.targets.altitude = targetPosition.y;
            this.isAutopilot = true;
            this.executeCommand(command);
        });
    }

    enableManualControl(): void {
        this.cancelCurrentCommand();
        this.isAutopilot = false;
        this.targets = {};
    }

    isAutopilotActive(): boolean {
        return this.isAutopilot;
    }

    getCurrentCommand(): DroneCommand | null {
        return this.currentCommand;
    }

    cancelCurrentCommand(): void {
        if (this.currentCommand) {
            this.currentCommand.reject(new Error('Command cancelled'));
            this.currentCommand = null;
        }
    }

    update(manualControls: PIDSetpoints, deltaTime: number): PIDSetpoints {
        this.manualSetpoints = manualControls;
        this.checkCommandTimeout();

        const droneStore = useDrone.getState();

        // Autopilot command active
        if (this.isAutopilot && this.currentCommand) {
            const setpoints = this.calculateAutopilotSetpoints(deltaTime);
            this.checkCommandCompletion();
            return setpoints;
        }

        // Altitude hold disabled
        if (!droneStore.altitudeHoldEnabled) {
            return manualControls;
        }

        // Check for manual input (excluding yaw - allow yaw in altitude hold)
        const deadzone = 0.05;
        const hasInput =
            Math.abs(manualControls.throttle) > deadzone ||
            Math.abs(manualControls.pitch) > deadzone ||
            Math.abs(manualControls.roll) > deadzone;

        // Check for yaw input separately by comparing with current rotation
        // If the target yaw differs from current yaw, user is actively yawing
        const yawDifference = Math.abs(manualControls.yaw - droneStore.rotation.y);
        const normalizedYawDiff = Math.min(yawDifference, 2 * Math.PI - yawDifference); // Handle wrap-around
        const hasYawInput = normalizedYawDiff > 0.01; // Small threshold for active yaw input

        if (hasInput) {
            // Manual input - disable hold
            this.targets.position = undefined;
            this.targets.altitude = undefined;
            this.targets.throttle = undefined;
            this.targets.heading = undefined;
            this.targets.pitch = undefined;
            this.targets.roll = undefined;
            this.isAutopilot = false;
            this.lastManualActive = true;
            droneStore.holdPosition = null;
            return manualControls;
        } else {
            // No input - engage altitude hold
            this.isAutopilot = true;

            if (this.lastManualActive || !droneStore.holdPosition) {
                useDrone.getState().enableAltitudeHold(true);
                this.targets.position = droneStore.position.clone();
                this.targets.altitude = droneStore.position.y;
                this.targets.heading = droneStore.rotation.y;
                this.targets.throttle = 0.4;
                this.holdThrottleExpire = Date.now() + 500;
                this.targets.pitch = undefined;
                this.targets.roll = undefined;
            } else if (droneStore.holdPosition) {
                this.targets.position = droneStore.holdPosition.clone();
                this.targets.altitude = droneStore.holdPosition.y;
                if (this.targets.heading === undefined) {
                    this.targets.heading = droneStore.rotation.y;
                }
            }

            // Allow manual yaw control in altitude hold mode
            if (hasYawInput) {
                // User is yawing - clear heading target to allow manual control
                this.targets.heading = undefined;
            } else {
                // No yaw input - lock to current heading
                this.targets.heading = droneStore.rotation.y;
            }

            this.lastManualActive = false;
        }

        if (!this.isAutopilot) {
            return manualControls;
        }

        const setpoints = this.calculateAutopilotSetpoints(deltaTime);
        this.checkCommandCompletion();
        return setpoints;
    }

    private executeCommand(command: DroneCommand): void {
        this.currentCommand = command;
    }

    private calculateAutopilotSetpoints(deltaTime: number): PIDSetpoints {
        const droneStore = useDrone.getState();
        const setpoints: PIDSetpoints = { pitch: 0, roll: 0, yaw: 0, throttle: 0 };

        // Expire hold throttle
        if (this.holdThrottleExpire && Date.now() > this.holdThrottleExpire) {
            this.targets.throttle = undefined;
            this.holdThrottleExpire = null;
        }

        // Throttle control
        if (this.targets.throttle !== undefined) {
            setpoints.throttle = this.targets.throttle;
        } else if (this.targets.altitude !== undefined) {
            const altitudeError = this.targets.altitude - droneStore.position.y;
            const verticalVelocity = droneStore.velocity.y;
            const kp_altitude = 0.2;
            const kd_altitude = 0.4;
            const throttleCorrection = (kp_altitude * altitudeError) - (kd_altitude * verticalVelocity);
            const hoverThrottle = 0.4;
            setpoints.throttle = Math.max(0, Math.min(1, hoverThrottle + throttleCorrection));
        }

        // Simple position control: point at target and move forward
        if (this.targets.position) {
            const posError = new THREE.Vector3().subVectors(this.targets.position, droneStore.position);
            const distance = Math.sqrt(posError.x ** 2 + posError.z ** 2);

            // Calculate desired heading to target
            const targetYaw = Math.atan2(posError.x, -posError.z);

            // Set heading target
            this.targets.heading = targetYaw;

            if (distance > this.config.positionTolerance) {
                // Move forward toward target
                const speed = Math.min(distance * 0.3, 3.0); // Speed proportional to distance, max 3 m/s
                const pitchAmount = speed * 0.08; // Convert speed to pitch angle

                setpoints.pitch = -pitchAmount; // Negative = forward
                setpoints.roll = 0; // No roll, just go straight

                // Limit pitch
                const maxPitch = 0.15;
                setpoints.pitch = Math.max(-maxPitch, Math.min(maxPitch, setpoints.pitch));
            } else {
                // At target - stop and level
                setpoints.pitch = 0;
                setpoints.roll = 0;
            }
        } else {
            // No position target - keep level (altitude hold mode)
            setpoints.pitch = 0;
            setpoints.roll = 0;
        }

        // Heading control (allow manual yaw to override)
        if (this.targets.heading !== undefined) {
            setpoints.yaw = this.targets.heading;
        } else {
            // Pass through manual yaw control from stored manual setpoints
            setpoints.yaw = this.manualSetpoints.yaw;
        }

        // Direct angle control
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
                const altitudeReached = Math.abs(droneStore.position.y - targetAlt) < this.config.altitudeTolerance;
                const verticallyStable = Math.abs(droneStore.velocity.y) < 0.3;
                isComplete = altitudeReached && verticallyStable;
                break;

            case 'hover':
                const hoverTime = Date.now() - this.currentCommand.startTime;
                const isStable = droneStore.velocity.length() < 0.5;
                const hasPosition = this.targets.position !== undefined;
                const isNearTarget = hasPosition && this.targets.position
                    ? droneStore.position.distanceTo(this.targets.position) < 1.0
                    : true;
                isComplete = hoverTime > 1000 && isStable && isNearTarget;
                break;

            case 'moveTo':
                if (this.targets.position) {
                    const distance = droneStore.position.distanceTo(this.targets.position);
                    const speed = droneStore.velocity.length();
                    console.log(`MoveTo: distance=${distance.toFixed(2)}m, speed=${speed.toFixed(2)}m/s, tolerance=${this.config.positionTolerance}m`);
                    isComplete = distance < this.config.positionTolerance && speed < 2.0;
                }
                break;

            case 'setPitch':
                isComplete = Math.abs(droneStore.rotation.x - (this.targets.pitch || 0)) < this.config.angleTolerance;
                break;

            case 'setRoll':
                isComplete = Math.abs(droneStore.rotation.z - (this.targets.roll || 0)) < this.config.angleTolerance;
                break;

            case 'setYaw':
                isComplete = Math.abs(droneStore.rotation.y - (this.targets.heading || 0)) < this.config.angleTolerance;
                break;

            case 'setThrottle':
                isComplete = true;
                break;
        }

        if (isComplete) {
            this.currentCommand.resolve();
            this.currentCommand = null;
            this.targets = {};
            this.isAutopilot = false;
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
        if (this.currentCommand) {
            this.currentCommand.reject(new Error('Emergency stop'));
            this.currentCommand = null;
        }
        this.isAutopilot = false;
        this.targets = {};
        this.adapter.sendCommand({
            id: `emergency_${Date.now()}`,
            type: 'emergencyStop',
            parameters: {},
            timeout: 1000,
            startTime: Date.now(),
            resolve: () => { },
            reject: () => { },
        });
    }

    // Utility functions for ground height checking
    private getGroundHeightAtPosition(position: THREE.Vector3): number {
        try {
            const envState = useEnvironment.getState();
            const { getTerrainHeight, terrain } = envState;

            // Debug: Check if terrain exists
            if (!terrain || !terrain.heightMap) {
                console.warn('[GROUND CHECK] No terrain data available, using ground level 0');
                return 0;
            }

            const height = getTerrainHeight(position.x, position.z);
            console.log(`[GROUND CHECK] Position (${position.x.toFixed(1)}, ${position.z.toFixed(1)}) -> Height: ${height.toFixed(2)}m`);
            return height;
        } catch (error) {
            console.error('[GROUND CHECK] Failed to get terrain height:', error);
            return 0; // Default ground level
        }
    }

    /**
     * Check if target altitude is safe (above ground)
     * @param targetAltitude - Desired altitude in meters
     * @param position - Position to check (defaults to current drone position)
     * @returns Object with isSafe flag and adjusted altitude
     */
    checkAltitudeSafety(targetAltitude: number, position?: THREE.Vector3): {
        isSafe: boolean;
        groundHeight: number;
        requestedAltitude: number;
        safeAltitude: number;
        clearance: number;
    } {
        const droneStore = useDrone.getState();
        const checkPosition = position || droneStore.position;
        const groundHeight = this.getGroundHeightAtPosition(checkPosition);
        const minClearance = 2.0; // Minimum 2m above ground
        const safeAltitude = Math.max(targetAltitude, groundHeight + minClearance);

        return {
            isSafe: targetAltitude >= groundHeight + minClearance,
            groundHeight,
            requestedAltitude: targetAltitude,
            safeAltitude,
            clearance: targetAltitude - groundHeight,
        };
    }

    /**
     * Get current altitude above ground level (AGL)
     * @returns Height above ground in meters
     */
    getAltitudeAGL(): number {
        const droneStore = useDrone.getState();
        const groundHeight = this.getGroundHeightAtPosition(droneStore.position);
        return droneStore.position.y - groundHeight;
    }

    /**
     * Check if drone is safe to land at current position
     * @returns Object with safety information
     */
    checkLandingSafety(): {
        isSafe: boolean;
        groundHeight: number;
        currentAltitude: number;
        agl: number;
        message: string;
    } {
        const droneStore = useDrone.getState();
        const groundHeight = this.getGroundHeightAtPosition(droneStore.position);
        const currentAltitude = droneStore.position.y;
        const agl = currentAltitude - groundHeight;

        const isSafe = agl > 0.5; // Safe if more than 0.5m above ground
        const message = isSafe
            ? `Safe to land (${agl.toFixed(2)}m AGL)`
            : `Too close to ground (${agl.toFixed(2)}m AGL)`;

        return {
            isSafe,
            groundHeight,
            currentAltitude,
            agl,
            message,
        };
    }

    /**
     * Validate a flight path for ground clearance
     * @param waypoints - Array of positions to check
     * @param minClearance - Minimum clearance above ground (default: 2m)
     * @returns Object with validation results
     */
    validateFlightPath(waypoints: THREE.Vector3[], minClearance: number = 2.0): {
        isValid: boolean;
        violations: Array<{
            index: number;
            position: THREE.Vector3;
            groundHeight: number;
            altitude: number;
            clearance: number;
        }>;
        message: string;
    } {
        const violations: Array<{
            index: number;
            position: THREE.Vector3;
            groundHeight: number;
            altitude: number;
            clearance: number;
        }> = [];

        waypoints.forEach((waypoint, index) => {
            const groundHeight = this.getGroundHeightAtPosition(waypoint);
            const clearance = waypoint.y - groundHeight;

            if (clearance < minClearance) {
                violations.push({
                    index,
                    position: waypoint,
                    groundHeight,
                    altitude: waypoint.y,
                    clearance,
                });
            }
        });

        const isValid = violations.length === 0;
        const message = isValid
            ? `Flight path valid (${waypoints.length} waypoints checked)`
            : `Flight path has ${violations.length} ground clearance violations`;

        return {
            isValid,
            violations,
            message,
        };
    }

    /**
     * Get current drone position
     * @returns Object with x, y, z coordinates
     */
    getPosition(): { x: number; y: number; z: number } {
        const droneStore = useDrone.getState();
        return {
            x: droneStore.position.x,
            y: droneStore.position.y,
            z: droneStore.position.z,
        };
    }

    /**
     * Get current drone rotation in degrees
     * @returns Object with pitch, roll, yaw in degrees
     */
    getRotation(): { pitch: number; roll: number; yaw: number } {
        const droneStore = useDrone.getState();
        return {
            pitch: (droneStore.rotation.x * 180) / Math.PI,
            roll: (droneStore.rotation.z * 180) / Math.PI,
            yaw: (droneStore.rotation.y * 180) / Math.PI,
        };
    }

    /**
     * Get current drone velocity
     * @returns Object with x, y, z velocity and total speed
     */
    getVelocity(): { x: number; y: number; z: number; speed: number } {
        const droneStore = useDrone.getState();
        const vel = droneStore.velocity;
        return {
            x: vel.x,
            y: vel.y,
            z: vel.z,
            speed: Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z),
        };
    }

    /**
     * Get complete telemetry data
     * @returns All telemetry information
     */
    getTelemetry(): {
        position: { x: number; y: number; z: number };
        rotation: { pitch: number; roll: number; yaw: number };
        velocity: { x: number; y: number; z: number; speed: number };
        altitude: number;
        agl: number;
    } {
        const pos = this.getPosition();
        const rot = this.getRotation();
        const vel = this.getVelocity();
        const agl = this.getAltitudeAGL();

        return {
            position: pos,
            rotation: rot,
            velocity: vel,
            altitude: pos.y,
            agl: agl,
        };
    }

    /**
     * Create a position object (helper to avoid using THREE.Vector3)
     * @param x - X coordinate
     * @param y - Y coordinate (altitude)
     * @param z - Z coordinate
     * @returns THREE.Vector3 position
     */
    createPosition(x: number, y: number, z: number): THREE.Vector3 {
        return new THREE.Vector3(x, y, z);
    }

    /**
     * Get ground height at specific coordinates
     * @param x - X coordinate
     * @param z - Z coordinate
     * @returns Ground height in meters
     */
    getGroundHeight(x: number, z: number): number {
        const pos = new THREE.Vector3(x, 0, z);
        return this.getGroundHeightAtPosition(pos);
    }

    /**
     * Check if drone is flying (not on ground)
     * @returns true if drone is airborne
     */
    isFlying(): boolean {
        const agl = this.getAltitudeAGL();
        return agl > 0.5; // More than 0.5m above ground
    }

    /**
     * Check if drone is stable (low velocity)
     * @param threshold - Velocity threshold (default: 0.5 m/s)
     * @returns true if drone is stable
     */
    isStable(threshold: number = 0.5): boolean {
        const vel = this.getVelocity();
        return vel.speed < threshold;
    }

    /**
     * Enable altitude hold mode
     */
    enableAltitudeHold(): void {
        const droneStore = useDrone.getState();
        droneStore.enableAltitudeHold(true);
    }

    /**
     * Disable altitude hold mode
     */
    disableAltitudeHold(): void {
        const droneStore = useDrone.getState();
        droneStore.enableAltitudeHold(false);
    }

    /**
     * Check if altitude hold is enabled
     */
    isAltitudeHoldEnabled(): boolean {
        const droneStore = useDrone.getState();
        return droneStore.altitudeHoldEnabled;
    }

    /**
     * Toggle altitude hold mode
     */
    toggleAltitudeHold(): void {
        const droneStore = useDrone.getState();
        droneStore.enableAltitudeHold(!droneStore.altitudeHoldEnabled);
    }

    /**
     * Swarm control API
     */
    swarm = {
        /**
         * Enable multi-drone mode
         */
        enable: (): void => {
            const multiDrone = useMultiDrone.getState();
            if (!multiDrone.state.enabled) {
                multiDrone.toggleEnabled();
            }
        },

        /**
         * Disable multi-drone mode
         */
        disable: (): void => {
            const multiDrone = useMultiDrone.getState();
            if (multiDrone.state.enabled) {
                multiDrone.toggleEnabled();
            }
        },

        /**
         * Check if swarm mode is enabled
         */
        isEnabled: (): boolean => {
            return useMultiDrone.getState().state.enabled;
        },

        /**
         * Add a new drone to the swarm
         */
        addDrone: (): void => {
            useMultiDrone.getState().addDrone();
        },

        /**
         * Remove a drone from the swarm
         */
        removeDrone: (id: string): void => {
            useMultiDrone.getState().removeDrone(id);
        },

        /**
         * Get number of drones in swarm
         */
        count: (): number => {
            return useMultiDrone.getState().getDroneCount();
        },

        /**
         * Set formation type
         * @param formation - 'V' (triangle), 'line', or 'circle'
         */
        form: (formation: 'V' | 'line' | 'circle'): void => {
            const formationType = formation === 'V' ? 'triangle' : formation;
            useMultiDrone.getState().formationFlight(formationType as 'triangle' | 'line' | 'circle');
        },

        /**
         * Execute swarm behavior
         * @param behavior - 'follow', 'scatter', or 'gather'
         */
        behavior: async (behavior: 'follow' | 'scatter' | 'gather'): Promise<void> => {
            await useMultiDrone.getState().swarmBehavior(behavior);
        },

        /**
         * Emergency land all drones
         */
        emergencyLandAll: async (): Promise<void> => {
            await useMultiDrone.getState().emergencyLandAll();
        },

        /**
         * Get list of all drone IDs
         */
        getDroneIds: (): string[] => {
            const drones = useMultiDrone.getState().state.drones;
            return Array.from(drones.keys());
        },

        /**
         * Set active drone (leader)
         */
        setLeader: (id: string): void => {
            useMultiDrone.getState().setActiveDrone(id);
        },

        /**
         * Get active drone ID (leader)
         */
        getLeader: (): string | null => {
            return useMultiDrone.getState().state.activeDroneId;
        },
    };

    /**
     * Delay execution (like Arduino delay)
     * @param seconds - Time to wait in seconds
     */
    async delay(seconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }

    /**
     * Wait for drone to stabilize
     * @param timeout - Maximum time to wait in seconds (default: 10)
     * @param threshold - Velocity threshold for stability (default: 0.5 m/s)
     */
    async waitForStable(timeout: number = 10, threshold: number = 0.5): Promise<boolean> {
        const startTime = Date.now();
        const timeoutMs = timeout * 1000;

        while (Date.now() - startTime < timeoutMs) {
            if (this.isStable(threshold)) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return false; // Timeout
    }

    /**
     * Wait for drone to reach target altitude
     * @param targetAltitude - Target altitude in meters
     * @param tolerance - Altitude tolerance (default: 0.5m)
     * @param timeout - Maximum time to wait in seconds (default: 15)
     */
    async waitForAltitude(targetAltitude: number, tolerance: number = 0.5, timeout: number = 15): Promise<boolean> {
        const startTime = Date.now();
        const timeoutMs = timeout * 1000;

        while (Date.now() - startTime < timeoutMs) {
            const pos = this.getPosition();
            if (Math.abs(pos.y - targetAltitude) < tolerance) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return false; // Timeout
    }
}

// Export singleton
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
            maxVerticalSpeed: 3.0,
        },
    }
);
