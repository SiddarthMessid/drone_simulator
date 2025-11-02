/**
 * Drone Physics Engine
 * Realistic quadcopter physics simulation with collision detection
 */

import * as THREE from "three";
import { AABB } from "./stores/useEnvironment";
import { useEnvironment } from "./stores/useEnvironment";
import { DEFAULT_PHYSICS_CONFIG, PhysicsConfig } from './physicsConfig';
import { DroneState, MotorOutputs } from './interfaces/drone';

export interface CollisionResult {
    collided: boolean;
    axis: 'x' | 'y' | 'z' | null;
}

export class DronePhysics {
    private config: PhysicsConfig;
    private motorThrust: number = 0; // smoothed thrust (N)
    private readonly DRONE_HALF_EXTENTS = new THREE.Vector3(1.0, 0.5, 1.0);

    constructor(config?: Partial<PhysicsConfig>) {
        this.config = { ...DEFAULT_PHYSICS_CONFIG, ...(config || {}) };
    }

    update(
        currentState: DroneState,
        motorOutputs: MotorOutputs,
        windForce: THREE.Vector3,
        deltaTime: number,
        obstacles: AABB[] = []
    ): { newState: DroneState; collision: CollisionResult } {
        const dt = Math.min(deltaTime, 0.02); // cap for stability

        // Clone current state
        const newState: DroneState = {
            position: currentState.position.clone(),
            rotation: currentState.rotation.clone(),
            velocity: currentState.velocity.clone(),
            angularVelocity: currentState.angularVelocity.clone(),
        };

        // Calculate forces and torques
        const forces = this.calculateForces(newState, motorOutputs, windForce, dt);
        const torques = this.calculateTorques(motorOutputs);

        // Update angular velocity (torque / inertia)
        newState.angularVelocity.x += (torques.x / this.config.inertia.x) * dt;
        newState.angularVelocity.y += (torques.y / this.config.inertia.y) * dt;
        newState.angularVelocity.z += (torques.z / this.config.inertia.z) * dt;

        // Apply angular drag
        const dragFactor = Math.max(0, 1 - this.config.angularDrag * dt);
        newState.angularVelocity.multiplyScalar(dragFactor);

        // Limit yaw rate
        const maxYawRate = 2.0;
        if (Math.abs(newState.angularVelocity.y) > maxYawRate) {
            newState.angularVelocity.y = Math.sign(newState.angularVelocity.y) * maxYawRate;
        }

        // Update rotation
        newState.rotation.x += newState.angularVelocity.x * dt;
        newState.rotation.y += newState.angularVelocity.y * dt;
        newState.rotation.z += newState.angularVelocity.z * dt;

        // Normalize yaw to [-π, π]
        while (newState.rotation.y > Math.PI) newState.rotation.y -= 2 * Math.PI;
        while (newState.rotation.y < -Math.PI) newState.rotation.y += 2 * Math.PI;

        // Limit tilt angles
        newState.rotation.x = Math.max(-this.config.maxTilt, Math.min(this.config.maxTilt, newState.rotation.x));
        newState.rotation.z = Math.max(-this.config.maxTilt, Math.min(this.config.maxTilt, newState.rotation.z));

        // Update linear velocity (F = ma)
        newState.velocity.x += (forces.x / this.config.mass) * dt;
        newState.velocity.y += (forces.y / this.config.mass) * dt;
        newState.velocity.z += (forces.z / this.config.mass) * dt;

        // Apply linear drag
        newState.velocity.multiplyScalar(1 - this.config.drag * dt);

        // Clamp velocity to maximum speed (20 m/s)
        const MAX_SPEED = 20.0; // m/s
        const currentSpeed = newState.velocity.length();
        if (currentSpeed > MAX_SPEED) {
            newState.velocity.multiplyScalar(MAX_SPEED / currentSpeed);
        }

        // Calculate proposed movement
        const proposedPosition = newState.position.clone();
        const deltaPosition = new THREE.Vector3(
            newState.velocity.x * dt,
            newState.velocity.y * dt,
            newState.velocity.z * dt
        );

        // Collision detection and resolution
        const collision = this.resolveCollisions(proposedPosition, deltaPosition, newState.velocity, obstacles);

        // Apply final position
        newState.position.copy(proposedPosition);

        // Terrain collision
        const terrainCollision = this.handleTerrainCollision(newState);
        if (terrainCollision && !collision.collided) {
            collision.collided = true;
            collision.axis = 'y';
        }

        return { newState, collision };
    }

    private calculateForces(
        state: DroneState,
        motorOutputs: MotorOutputs,
        windForce: THREE.Vector3,
        dt: number
    ): THREE.Vector3 {
        const forces = new THREE.Vector3();

        // Gravity
        forces.y -= this.config.mass * this.config.gravity;

        // Thrust with motor dynamics (first-order lag)
        const maxThrust = this.config.thrustFactor * this.config.mass * this.config.gravity;
        const desiredThrust = Math.max(0, Math.min(1, motorOutputs.throttle)) * maxThrust;
        const alpha = 1 - Math.exp(-Math.max(dt, 1e-6) / this.config.motorTau);
        this.motorThrust += (desiredThrust - this.motorThrust) * alpha;

        // Transform thrust to world frame
        // Manual body-frame transformation: apply yaw first, then pitch/roll
        const thrustWorld = new THREE.Vector3(0, this.motorThrust, 0);

        // Step 1: Apply pitch and roll (body-frame rotations)
        const pitchQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), state.rotation.x);
        const rollQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), state.rotation.z);
        const bodyQuat = new THREE.Quaternion().multiplyQuaternions(pitchQuat, rollQuat);
        thrustWorld.applyQuaternion(bodyQuat);

        // Step 2: Apply yaw (world-frame rotation)
        const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), state.rotation.y);
        thrustWorld.applyQuaternion(yawQuat);

        forces.add(thrustWorld);

        // Wind forces
        forces.add(windForce);

        return forces;
    }

    private calculateTorques(motorOutputs: MotorOutputs): THREE.Vector3 {
        const torqueStrength = 2.0;

        // Direct torque application without gyroscopic coupling
        // This gives cleaner, more intuitive control
        return new THREE.Vector3(
            motorOutputs.pitch * torqueStrength,
            motorOutputs.yaw * torqueStrength * 0.5,
            motorOutputs.roll * torqueStrength
        );
    }

    private resolveCollisions(
        proposedPosition: THREE.Vector3,
        deltaPosition: THREE.Vector3,
        velocity: THREE.Vector3,
        obstacles: AABB[]
    ): CollisionResult {
        const collision: CollisionResult = { collided: false, axis: null };

        // Per-axis collision detection
        const axes: Array<{ axis: 'x' | 'y' | 'z', index: 0 | 1 | 2 }> = [
            { axis: 'x', index: 0 },
            { axis: 'y', index: 1 },
            { axis: 'z', index: 2 },
        ];

        for (const { axis, index } of axes) {
            proposedPosition.setComponent(index, proposedPosition.getComponent(index) + deltaPosition.getComponent(index));

            const droneAABB: AABB = {
                center: proposedPosition.clone(),
                half: this.DRONE_HALF_EXTENTS.clone(),
            };

            for (const obstacle of obstacles) {
                if (this.aabbIntersect(droneAABB, obstacle)) {
                    const overlap = this.calculateOverlap(droneAABB, obstacle, axis);
                    const sign = Math.sign(deltaPosition.getComponent(index));

                    proposedPosition.setComponent(index, proposedPosition.getComponent(index) - overlap * sign);
                    velocity.setComponent(index, 0);

                    // Tangential damping
                    const dampingFactor = 0.9;
                    for (let i = 0; i < 3; i++) {
                        if (i !== index) {
                            velocity.setComponent(i, velocity.getComponent(i) * dampingFactor);
                        }
                    }

                    collision.collided = true;
                    collision.axis = axis;
                    break;
                }
            }
        }

        return collision;
    }

    private handleTerrainCollision(state: DroneState): boolean {
        const { terrain } = useEnvironment.getState();
        let terrainHeight = 0;

        if (terrain && terrain.heightMap) {
            // Multi-point sampling for better accuracy
            const sampleRadius = 0.5;
            const samples = [
                { x: state.position.x, z: state.position.z },
                { x: state.position.x + sampleRadius, z: state.position.z },
                { x: state.position.x - sampleRadius, z: state.position.z },
                { x: state.position.x, z: state.position.z + sampleRadius },
                { x: state.position.x, z: state.position.z - sampleRadius },
            ];

            terrainHeight = Math.max(...samples.map(s =>
                useEnvironment.getState().getTerrainHeight(s.x, s.z)
            ));
        }

        const droneBottom = state.position.y - this.DRONE_HALF_EXTENTS.y;
        const minClearance = 0.05;
        const groundLevel = terrainHeight + minClearance;

        if (droneBottom < groundLevel) {
            const targetCenterHeight = terrainHeight + minClearance + this.DRONE_HALF_EXTENTS.y;
            const penetration = targetCenterHeight - state.position.y;

            // Spring-damper contact model
            const k_contact = 500;
            const k_damping = 50;
            const contactAccel = (k_contact * penetration - k_damping * state.velocity.y) / this.config.mass;
            state.velocity.y += contactAccel * 0.016; // approximate dt

            // Hard limit
            if (droneBottom < terrainHeight) {
                state.position.y = terrainHeight + this.DRONE_HALF_EXTENTS.y + minClearance;
                state.velocity.y = Math.max(0, state.velocity.y);
            }

            // Friction
            const frictionFactor = 0.85;
            state.velocity.x *= frictionFactor;
            state.velocity.z *= frictionFactor;
            state.angularVelocity.multiplyScalar(frictionFactor);

            return true;
        }

        return false;
    }

    private aabbIntersect(a: AABB, b: AABB): boolean {
        return (
            Math.abs(a.center.x - b.center.x) < (a.half.x + b.half.x) &&
            Math.abs(a.center.y - b.center.y) < (a.half.y + b.half.y) &&
            Math.abs(a.center.z - b.center.z) < (a.half.z + b.half.z)
        );
    }

    private calculateOverlap(a: AABB, b: AABB, axis: 'x' | 'y' | 'z'): number {
        const axisMap = { x: 0, y: 1, z: 2 };
        const index = axisMap[axis];
        const distance = Math.abs(a.center.getComponent(index) - b.center.getComponent(index));
        const combinedHalf = a.half.getComponent(index) + b.half.getComponent(index);
        return combinedHalf - distance;
    }
}
