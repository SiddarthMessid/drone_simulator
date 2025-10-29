import * as THREE from "three";
import { DroneAdapter, DroneState, DroneCommand, DroneControllerConfig } from './interfaces/drone';
import { PIDSetpoints, PIDParams } from './pidController';

const DEFAULT_CONFIG: DroneControllerConfig = {
    maxSpeed: 5.0,
    maxAltitude: 50.0,
    positionTolerance: 0.5,
    altitudeTolerance: 0.3,
    angleTolerance: 0.05,
    commandTimeout: 30000,
    safetyLimits: {
        maxTiltAngle: Math.PI / 3,
        maxYawRate: 2.0,
        maxVerticalSpeed: 3.0
    }
};

/**
 * Simplified drone controller for multi-drone fleet
 * Focuses on stable formation flying with minimal complexity
 */
export class SimpleDroneController {
    private adapter: DroneAdapter;
    private state: DroneState;
    private config: DroneControllerConfig;

    // Formation control
    private isLeader = false;
    private formationOffset: THREE.Vector3 | null = null;
    private leaderPosition: THREE.Vector3 | null = null;
    private leaderRotation: THREE.Vector3 | null = null;
    private leaderVelocity: THREE.Vector3 | null = null;
    private emergencyHoldPosition: THREE.Vector3 | null = null;

    // PID parameters
    private pidParams: PIDParams = {
        pitch: { kp: 2.2, ki: 0.15, kd: 0.35 },
        roll: { kp: 2.2, ki: 0.15, kd: 0.35 },
        yaw: { kp: 0.6, ki: 0.02, kd: 0.08 },
        altitude: { kp: 1.0, ki: 0.1, kd: 0.2 }
    };

    constructor(adapter: DroneAdapter, config: Partial<DroneControllerConfig> = {}) {
        this.adapter = adapter;
        this.config = { ...DEFAULT_CONFIG, ...config };

        // Initialize with default state
        this.state = {
            position: new THREE.Vector3(0, 5, 0),
            rotation: new THREE.Vector3(0, 0, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            angularVelocity: new THREE.Vector3(0, 0, 0)
        };

        this.adapter.onStateUpdate(this.handleStateUpdate.bind(this));
    }

    private handleStateUpdate(newState: DroneState): void {
        this.state = newState;
        this.adapter.sendTelemetry(newState);
    }

    // Public API
    getState(): DroneState {
        return this.state;
    }

    updateState(newState: DroneState): void {
        this.state = newState;
        this.adapter.sendTelemetry(newState);
    }

    setAsLeader(isLeader: boolean): void {
        this.isLeader = isLeader;
        if (isLeader) {
            // Leaders don't follow anyone
            this.formationOffset = null;
            this.leaderPosition = null;
            this.leaderRotation = null;
            this.leaderVelocity = null;
        }
    }

    setFormationTarget(offset: THREE.Vector3): void {
        // Validate offset
        if (isNaN(offset.x) || isNaN(offset.y) || isNaN(offset.z)) {
            console.error('Invalid formation offset:', offset);
            return;
        }
        this.formationOffset = offset.clone();
        // Clear emergency hold when setting new formation
        this.emergencyHoldPosition = null;
    }

    updateLeaderPosition(position: THREE.Vector3, rotation: THREE.Vector3, velocity?: THREE.Vector3): void {
        if (!this.isLeader) {
            // Validate position and rotation
            if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
                console.error('Invalid leader position:', position);
                return;
            }
            if (isNaN(rotation.x) || isNaN(rotation.y) || isNaN(rotation.z)) {
                console.error('Invalid leader rotation:', rotation);
                return;
            }
            this.leaderPosition = position.clone();
            this.leaderRotation = rotation.clone();

            // Store leader velocity for predictive following
            if (velocity) {
                this.leaderVelocity = velocity.clone();
            }
        }
    }

    getPIDParams(): PIDParams {
        return this.pidParams;
    }

    /**
     * Calculate setpoints for this drone
     * Returns PID setpoints based on formation position
     */
    getSetpoints(): PIDSetpoints {
        // Default hover setpoints
        const setpoints: PIDSetpoints = {
            pitch: 0,
            roll: 0,
            yaw: 0,
            throttle: 0.5 // Hover throttle
        };

        // Leaders just hover in place
        if (this.isLeader) {
            return setpoints;
        }

        // Check if in emergency hold mode
        if (this.emergencyHoldPosition) {
            // Hold current position
            const posError = new THREE.Vector3().subVectors(this.emergencyHoldPosition, this.state.position);
            const distance = posError.length();

            // Altitude control
            const altError = this.emergencyHoldPosition.y - this.state.position.y;
            const kp_alt = 0.3;
            const kd_alt = 0.2;
            const throttleAdjust = kp_alt * altError - kd_alt * this.state.velocity.y;
            setpoints.throttle = Math.max(0, Math.min(1, 0.5 + throttleAdjust));

            // Position hold with gentle control
            if (distance > 0.3) {
                const kp_pos = 0.2;
                const desiredVel = posError.clone().multiplyScalar(kp_pos);

                const kv = 0.05;
                const yaw = this.state.rotation.y;
                const cosYaw = Math.cos(-yaw);
                const sinYaw = Math.sin(-yaw);
                const localVelX = desiredVel.x * cosYaw - desiredVel.z * sinYaw;
                const localVelZ = desiredVel.x * sinYaw + desiredVel.z * cosYaw;

                const maxTilt = 0.1;
                setpoints.roll = Math.max(-maxTilt, Math.min(maxTilt, localVelX * kv));
                setpoints.pitch = Math.max(-maxTilt, Math.min(maxTilt, -localVelZ * kv));
            }

            setpoints.yaw = this.state.rotation.y; // Maintain heading
            return setpoints;
        }

        // Followers need formation offset and leader position
        if (!this.formationOffset || !this.leaderPosition || !this.leaderRotation) {
            return setpoints;
        }

        // Calculate target position in world space
        const targetWorld = this.formationOffset.clone();

        // Rotate offset by leader's yaw
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(this.leaderRotation.y);
        targetWorld.applyMatrix4(rotationMatrix);

        // Add leader position
        targetWorld.add(this.leaderPosition);

        // Match leader altitude (ignore formation Y offset)
        targetWorld.y = this.leaderPosition.y;

        // Validate target position
        if (isNaN(targetWorld.x) || isNaN(targetWorld.y) || isNaN(targetWorld.z)) {
            console.error('Invalid target position calculated:', targetWorld);
            return setpoints;
        }

        // Calculate position error
        const posError = new THREE.Vector3().subVectors(targetWorld, this.state.position);
        const distance = posError.length();

        // Validate distance
        if (isNaN(distance)) {
            console.error('Invalid distance calculated');
            return setpoints;
        }

        // Altitude control (simple PD)
        const altError = targetWorld.y - this.state.position.y;
        const kp_alt = 0.3;
        const kd_alt = 0.2;
        const throttleAdjust = kp_alt * altError - kd_alt * this.state.velocity.y;
        setpoints.throttle = Math.max(0, Math.min(1, 0.5 + throttleAdjust));

        // Horizontal position control (only if distance is significant)
        if (distance > 0.5) {
            // Calculate desired velocity toward target (proportional control)
            const kp_pos = 0.3; // Much gentler position gain
            const desiredVel = posError.clone().multiplyScalar(kp_pos);

            // Add leader velocity for velocity matching (feedforward control)
            // Use only a fraction of leader velocity to prevent overshoot
            if (this.leaderVelocity) {
                const velocityMatchGain = 0.5; // Only match 50% of leader velocity
                desiredVel.x += this.leaderVelocity.x * velocityMatchGain;
                desiredVel.z += this.leaderVelocity.z * velocityMatchGain;
            }

            // Limit speed
            const speed = desiredVel.length();
            const maxSpeed = this.config.maxSpeed * 0.6; // Use only 60% of max speed
            if (speed > maxSpeed) {
                desiredVel.multiplyScalar(maxSpeed / speed);
            }

            // Convert desired velocity to tilt angles
            const kv = 0.08; // Much gentler velocity to tilt conversion

            // Transform desired velocity from world to local frame
            const yaw = this.state.rotation.y;
            const cosYaw = Math.cos(-yaw);
            const sinYaw = Math.sin(-yaw);
            const localVelX = desiredVel.x * cosYaw - desiredVel.z * sinYaw;
            const localVelZ = desiredVel.x * sinYaw + desiredVel.z * cosYaw;

            // Apply velocity to tilt with strict limits
            const maxTilt = 0.15; // Much smaller max tilt for stability
            setpoints.roll = Math.max(-maxTilt, Math.min(maxTilt, localVelX * kv));
            setpoints.pitch = Math.max(-maxTilt, Math.min(maxTilt, -localVelZ * kv));

            // Yaw control: DON'T point toward target, maintain leader's heading
            // This prevents formation from breaking when leader yaws
            if (this.leaderRotation) {
                // Match leader's yaw instead of pointing at target
                setpoints.yaw = this.leaderRotation.y;
            } else {
                // Fallback: maintain current heading
                setpoints.yaw = this.state.rotation.y;
            }
        } else {
            // Within tolerance - hold position with zero tilt
            setpoints.pitch = 0;
            setpoints.roll = 0;
            // Match leader's yaw
            if (this.leaderRotation) {
                setpoints.yaw = this.leaderRotation.y;
            } else {
                setpoints.yaw = this.state.rotation.y;
            }
        }

        return setpoints;
    }

    emergencyStop(): void {
        // Capture current position and hover in place
        this.emergencyHoldPosition = this.state.position.clone();
        this.formationOffset = null;
        this.leaderPosition = null;
        this.leaderRotation = null;
        this.leaderVelocity = null;
        console.log('Emergency stop - holding position:', this.emergencyHoldPosition.toArray());
    }

    async land(): Promise<void> {
        return Promise.resolve();
    }

    async moveTo(target: THREE.Vector3): Promise<void> {
        return Promise.resolve();
    }
}
