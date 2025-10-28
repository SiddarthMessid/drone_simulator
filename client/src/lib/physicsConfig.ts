import * as THREE from 'three';

export interface PhysicsConfig {
  mass: number; // kg
  gravity: number; // m/s^2
  thrustFactor: number; // multiplier for mass*gravity to get max thrust
  motorTau: number; // motor time constant (s)
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  mass: 1.5,
  gravity: 9.81,
  thrustFactor: 2.5,
  motorTau: 0.07,
};
