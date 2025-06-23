import * as THREE from "three";

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

export class DronePhysics {
  private mass: number = 1.5; // kg
  private inertia: THREE.Vector3 = new THREE.Vector3(0.03, 0.03, 0.05); // kg⋅m²
  private drag: number = 0.1;
  private angularDrag: number = 0.5;
  private gravity: number = 9.81;
  private maxTilt: number = Math.PI / 3; // 60 degrees max tilt

  update(
    currentState: DroneState, 
    motorOutputs: MotorOutputs, 
    windForce: THREE.Vector3, 
    deltaTime: number
  ): DroneState {
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

    // Update position
    newState.position.x += newState.velocity.x * dt;
    newState.position.y += newState.velocity.y * dt;
    newState.position.z += newState.velocity.z * dt;

    // Ground collision
    if (newState.position.y < 0.5) {
      newState.position.y = 0.5;
      newState.velocity.y = Math.max(0, newState.velocity.y);
      
      // Reduce velocity on ground contact
      if (newState.position.y <= 0.5) {
        newState.velocity.multiplyScalar(0.8);
        newState.angularVelocity.multiplyScalar(0.8);
      }
    }

    return newState;
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
}
