import * as THREE from "three";
import { AABB } from "./stores/useEnvironment";

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
  private mass: number = 1.5; // kg
  private inertia: THREE.Vector3 = new THREE.Vector3(0.03, 0.03, 0.05); // kg⋅m²
  private drag: number = 0.1;
  private angularDrag: number = 0.5;
  private gravity: number = 9.81;
  private maxTilt: number = Math.PI / 3; // 60 degrees max tilt
  
  // Drone collision box half-extents
  private readonly DRONE_HALF_EXTENTS = new THREE.Vector3(0.6, 0.3, 0.6);

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
    const forces = this.calculateForces(newState, motorOutputs, windForce);
    const torques = this.calculateTorques(newState, motorOutputs);

    // Update angular velocity (torque / inertia)
    newState.angularVelocity.x += (torques.x / this.inertia.x) * dt;
    newState.angularVelocity.y += (torques.y / this.inertia.y) * dt;
    newState.angularVelocity.z += (torques.z / this.inertia.z) * dt;

    // Apply angular drag
    newState.angularVelocity.multiplyScalar(1 - this.angularDrag * dt);

    // Update rotation
    newState.rotation.x += newState.angularVelocity.x * dt;
    newState.rotation.y += newState.angularVelocity.y * dt;
    newState.rotation.z += newState.angularVelocity.z * dt;

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

    // Ground collision
    if (newState.position.y < 0.5) {
      newState.position.y = 0.5;
      newState.velocity.y = Math.max(0, newState.velocity.y);
      
      // Reduce velocity on ground contact
      if (newState.position.y <= 0.5) {
        newState.velocity.multiplyScalar(0.8);
        newState.angularVelocity.multiplyScalar(0.8);
      }
      
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
    windForce: THREE.Vector3
  ): THREE.Vector3 {
    const forces = new THREE.Vector3();

    // Gravity
    forces.y -= this.mass * this.gravity;

    // Thrust (always upward in drone's local frame)
    const thrustMagnitude = (motorOutputs.throttle + 0.5) * this.mass * this.gravity * 1.2;
    
    // Transform thrust to world coordinates based on drone rotation
    const thrustWorld = new THREE.Vector3(0, thrustMagnitude, 0);
    
    // Apply rotation to thrust vector
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(state.rotation.x, state.rotation.y, state.rotation.z, 'XYZ')
    );
    thrustWorld.applyMatrix4(rotationMatrix);
    
    forces.add(thrustWorld);

    // Wind forces
    forces.add(windForce);

    // Horizontal movement based on tilt
    const horizontalForce = 8; // Force multiplier for horizontal movement
    forces.x += Math.sin(state.rotation.z) * thrustMagnitude * 0.1;
    forces.z -= Math.sin(state.rotation.x) * thrustMagnitude * 0.1;

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
    const axes: Array<{axis: 'x' | 'y' | 'z', index: 0 | 1 | 2}> = [
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
