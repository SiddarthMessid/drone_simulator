/**
 * Physics Configuration
 * Core physical parameters for drone simulation
 */

export interface PhysicsConfig {
    mass: number;              // kg
    gravity: number;           // m/s²
    drag: number;              // linear drag coefficient
    angularDrag: number;       // angular drag coefficient
    thrustFactor: number;      // thrust multiplier (max_thrust = mass * gravity * factor)
    motorTau: number;          // motor response time constant (seconds)
    maxTilt: number;           // maximum tilt angle (radians)
    inertia: {                 // moment of inertia (kg⋅m²)
        x: number;               // pitch axis
        y: number;               // yaw axis
        z: number;               // roll axis
    };
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
    mass: 1.5,                 // 1.5 kg drone
    gravity: 9.81,             // Earth gravity
    drag: 0.1,                 // moderate air resistance
    angularDrag: 5.0,          // moderate rotational damping
    thrustFactor: 2.5,         // can produce 2.5x its weight in thrust
    motorTau: 0.07,            // 70ms motor response time
    maxTilt: Math.PI / 3,      // 60° maximum tilt
    inertia: {
        x: 0.03,                 // pitch inertia
        y: 0.03,                 // yaw inertia
        z: 0.05,                 // roll inertia (slightly higher)
    },
};
