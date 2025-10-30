import * as THREE from "three";
import { AABB } from "./stores/useEnvironment";
import { useEnvironment } from "./stores/useEnvironment";
import { DEFAULT_PHYSICS_CONFIG, PhysicsConfig } from './physicsConfig';

export interface DroneState {
  position: THREE.Vector3;
  rotation: THREE.Vector3;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
}

export interface MotorOutputs {
  pitch: number;
  roll: number;
  yaw: number;
  throttle: number;
}

export interface CollisionResult {
  collided: boolean;
  axis: 'x' | 'y' | 'z' | null;
}

export class DronePhysics {
  private mass: number; // kg
  private inertia: THREE.Vector3 = new THREE.Vector3(0.03, 0.03, 0.05); // kg⋅m²
  private drag: number = 0.1;
  private angularDrag: number = 5.0; // Moderate drag - active damping handles stopping
  private gravity: number;
  private maxTilt: number = Math.PI / 3; // 60 degrees max tilt
  // Physical thrust model (configurable)
  private thrustFactor: number;
  private maxThrust: number;
  // Smoothed internal motor thrust (N)
  private motorThrust: number = 0;
  // Motor time constant (seconds) used for first-order filtering of thrust commands
  private motorTau: number;

  constructor(config?: Partial<PhysicsConfig>) {
    const c = { ...DEFAULT_PHYSICS_CONFIG, ...(config || {}) };
    this.mass = c.mass;
    this.gravity = c.gravity;
    this.thrustFactor = c.thrustFactor;
    this.motorTau = c.motorTau;
    this.maxThrust = this.thrustFactor * this.mass * this.gravity;
  }

  // Drone collision box half-extents
  // The drone body is 2x0.3x2, landing gear extends 0.6 down (to -0.4 from center)
  // Total height from center: 0.15 (body top) + 0.6 (landing gear) = 0.75
  // Width/Depth: rotors extend to ±1.8, but we use a smaller collision box for the body
  private readonly DRONE_HALF_EXTENTS = new THREE.Vector3(1.0, 0.5, 1.0);

  update(
    currentState: DroneState,
    motorOutputs: MotorOutputs,
    windForce: THREE.Vector3,
    deltaTime: number,
    obstacles: AABB[] = []
  ): { newState: DroneState; collision: CollisionResult } {
    const dt = Math.min(deltaTime, 0.02); // Cap delta time for stability

    // Create new state
    const newState: DroneState = {
      position: currentState.position.clone(),
      rotation: currentState.rotation.clone(),
      velocity: currentState.velocity.clone(),
      angularVelocity: currentState.angularVelocity.clone()
    };

    // Calculate forces
    const forces = this.calculateForces(newState, motorOutputs, windForce, dt);
    const torques = this.calculateTorques(newState, motorOutputs);

    // Update angular velocity (torque / inertia)
    newState.angularVelocity.x += (torques.x / this.inertia.x) * dt;
    newState.angularVelocity.y += (torques.y / this.inertia.y) * dt;
    newState.angularVelocity.z += (torques.z / this.inertia.z) * dt;

    // Apply angular drag
    const dragFactor = Math.max(0, 1 - this.angularDrag * dt);
    newState.angularVelocity.x *= dragFactor;
    newState.angularVelocity.y *= dragFactor * 1.5; // Moderate extra damping for yaw
    newState.angularVelocity.z *= dragFactor;

    // Hard limit on yaw angular velocity to prevent runaway
    const maxYawRate = 2.0; // rad/s
    if (Math.abs(newState.angularVelocity.y) > maxYawRate) {
      newState.angularVelocity.y = Math.sign(newState.angularVelocity.y) * maxYawRate;
    }

    // Update rotation
    newState.rotation.x += newState.angularVelocity.x * dt;
    newState.rotation.y += newState.angularVelocity.y * dt;
    newState.rotation.z += newState.angularVelocity.z * dt;

    // Normalize yaw angle to -PI to PI range to prevent accumulation
    while (newState.rotation.y > Math.PI) newState.rotation.y -= 2 * Math.PI;
    while (newState.rotation.y < -Math.PI) newState.rotation.y += 2 * Math.PI;

    // Limit rotation angles
    newState.rotation.x = Math.max(-this.maxTilt, Math.min(this.maxTilt, newState.rotation.x));
    newState.rotation.z = Math.max(-this.maxTilt, Math.min(this.maxTilt, newState.rotation.z));

    // Update linear velocity (force / mass)
    newState.velocity.x += (forces.x / this.mass) * dt;
    newState.velocity.y += (forces.y / this.mass) * dt;
    newState.velocity.z += (forces.z / this.mass) * dt;

    // Apply drag
    newState.velocity.multiplyScalar(1 - this.drag * dt);

    // Calculate proposed movement
    const proposedPosition = newState.position.clone();
    const deltaPosition = new THREE.Vector3(
      newState.velocity.x * dt,
      newState.velocity.y * dt,
      newState.velocity.z * dt
    );

    // Per-axis collision detection and resolution
    const collision = this.resolveCollisions(proposedPosition, deltaPosition, newState.velocity, obstacles);

    // Apply final position
    newState.position.copy(proposedPosition);

    // Robust terrain collision with multi-point sampling
    const { terrain } = useEnvironment.getState();

    let terrainHeight = 0; // Default ground level

    if (terrain && terrain.heightMap) {
      // Sample terrain height at multiple points under the drone for better accuracy
      const sampleRadius = 0.5; // Sample in a small radius around drone center
      const samples = [
        { x: newState.position.x, z: newState.position.z }, // Center
        { x: newState.position.x + sampleRadius, z: newState.position.z }, // Right
        { x: newState.position.x - sampleRadius, z: newState.position.z }, // Left
        { x: newState.position.x, z: newState.position.z + sampleRadius }, // Front
        { x: newState.position.x, z: newState.position.z - sampleRadius }, // Back
      ];

      // Get the maximum height from all samples (most conservative)
      terrainHeight = Math.max(...samples.map(s =>
        useEnvironment.getState().getTerrainHeight(s.x, s.z)
      ));
    }

    // Calculate the bottom of the drone's collision box
    // The collision box extends DRONE_HALF_EXTENTS.y below the center
    const droneBottom = newState.position.y - this.DRONE_HALF_EXTENTS.y;

    // Very small clearance for tight terrain following
    const minClearance = 0.05;

    // Apply ground collision when drone bottom is below terrain + clearance
    const groundLevel = terrainHeight + minClearance;
    if (droneBottom < groundLevel) {
      // Calculate how much the drone center needs to move up
      const targetCenterHeight = terrainHeight + minClearance + this.DRONE_HALF_EXTENTS.y;
      const penetration = targetCenterHeight - newState.position.y;

      // Very strong spring-damper for immediate response
      const k_contact = 500; // N/m - much stronger
      const k_damping = 50; // N*s/m - stronger damping

      // compute contact acceleration to push drone out
      const contactAccel = (k_contact * penetration - k_damping * newState.velocity.y) / this.mass;

      // apply corrective velocity change
      newState.velocity.y += contactAccel * dt;

      // Hard limit: don't let drone bottom go below ground level
      if (droneBottom < terrainHeight) {
        newState.position.y = terrainHeight + this.DRONE_HALF_EXTENTS.y + minClearance;
        newState.velocity.y = Math.max(0, newState.velocity.y);
      }

      // Friction on ground contact
      const frictionFactor = 0.85;
      newState.velocity.x *= frictionFactor;
      newState.velocity.z *= frictionFactor;
      newState.angularVelocity.multiplyScalar(frictionFactor);

      if (!collision.collided) {
        collision.collided = true;
        collision.axis = 'y';
      }
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
    forces.y -= this.mass * this.gravity;

    // Desired thrust based on normalized throttle [0,1]
    const desiredThrottle = Math.max(0, Math.min(1, motorOutputs.throttle));
    const desiredThrust = desiredThrottle * this.maxThrust;

    // First-order motor model (smooth thrust changes)
    const alpha = 1 - Math.exp(-Math.max(dt, 1e-6) / this.motorTau);
    this.motorThrust += (desiredThrust - this.motorThrust) * alpha;

    // Transform thrust to world coordinates based on drone rotation (body up is +Y)
    const thrustWorld = new THREE.Vector3(0, this.motorThrust, 0);
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(state.rotation.x, state.rotation.y, state.rotation.z, 'XYZ')
    );
    thrustWorld.applyMatrix4(rotationMatrix);
    forces.add(thrustWorld);

    // Wind forces
    forces.add(windForce);

    // Note: lateral acceleration naturally comes from projecting the thrust
    // vector into world frame (no separate heuristic horizontal force needed).

    return forces;
  }

  private calculateTorques(state: DroneState, motorOutputs: MotorOutputs): THREE.Vector3 {
    const torques = new THREE.Vector3();

    const torqueStrength = 2.0;

    // Pitch torque (around X-axis)
    torques.x = motorOutputs.pitch * torqueStrength;

    // Yaw torque (around Y-axis)  
    torques.y = motorOutputs.yaw * torqueStrength * 0.5;

    // Roll torque (around Z-axis)
    torques.z = motorOutputs.roll * torqueStrength;

    return torques;
  }

  private resolveCollisions(
    proposedPosition: THREE.Vector3,
    deltaPosition: THREE.Vector3,
    velocity: THREE.Vector3,
    obstacles: AABB[]
  ): CollisionResult {
    const collision: CollisionResult = { collided: false, axis: null };

    // Test per-axis movement: X -> Y -> Z
    const axes: Array<{ axis: 'x' | 'y' | 'z', index: 0 | 1 | 2 }> = [
      { axis: 'x', index: 0 },
      { axis: 'y', index: 1 },
      { axis: 'z', index: 2 }
    ];

    for (const { axis, index } of axes) {
      // Move along this axis
      proposedPosition.setComponent(index, proposedPosition.getComponent(index) + deltaPosition.getComponent(index));

      // Create drone AABB at new position
      const droneAABB: AABB = {
        center: proposedPosition.clone(),
        half: this.DRONE_HALF_EXTENTS.clone()
      };

      // Check collision with all obstacles
      for (const obstacle of obstacles) {
        if (this.aabbIntersect(droneAABB, obstacle)) {
          // Calculate overlap and resolve
          const overlap = this.calculateOverlap(droneAABB, obstacle, axis);
          const sign = Math.sign(deltaPosition.getComponent(index));

          // Push drone out of obstacle
          proposedPosition.setComponent(
            index,
            proposedPosition.getComponent(index) - overlap * sign
          );

          // Stop velocity on collision axis
          velocity.setComponent(index, 0);

          // Apply tangential damping for sliding effect
          const dampingFactor = 0.9;
          for (let i = 0; i < 3; i++) {
            if (i !== index) {
              velocity.setComponent(i, velocity.getComponent(i) * dampingFactor);
            }
          }

          collision.collided = true;
          collision.axis = axis;
          break; // Only resolve first collision per axis
        }
      }
    }

    return collision;
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
