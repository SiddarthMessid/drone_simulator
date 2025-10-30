# Custom Drone Library - Rebuilt from Scratch

## Overview

The custom drone control library has been completely rebuilt with a clean, modular architecture focused on realistic drone physics and intuitive control.

## Architecture

### Core Components

#### 1. **physicsConfig.ts**

- Defines physical parameters (mass, gravity, drag, inertia)
- Configurable thrust factor and motor response time
- Default config: 1.5kg drone with 2.5x thrust-to-weight ratio

#### 2. **dronePhysics.ts**

- Realistic quadcopter physics simulation
- Features:
  - 6-DOF rigid body dynamics
  - First-order motor lag model
  - Thrust vectoring based on orientation
  - AABB collision detection (per-axis resolution)
  - Multi-point terrain sampling
  - Spring-damper ground contact model
  - Wind force integration

#### 3. **pidController.ts**

- PID controller for attitude stabilization
- Features:
  - Separate tuning for pitch, roll, yaw, altitude
  - Anti-windup protection
  - Low-pass filtered derivative
  - Throttle rate limiting
  - Angle wrapping for yaw

#### 4. **droneController.ts**

- High-level autopilot API
- Commands:
  - `takeoff(altitude)` - Autonomous takeoff
  - `land()` - Autonomous landing
  - `hover()` - Hold current position
  - `setPitch(degrees)` - Set pitch angle
  - `setRoll(degrees)` - Set roll angle
  - `setYaw(degrees)` - Set heading
  - `setThrottle(percentage)` - Direct throttle control
  - `moveTo(position)` - Navigate to position (stub)
  - `dir(from, to)` - Direction-based movement (stub)
- Features:
  - Position hold mode
  - Safety limit validation
  - Command timeout handling
  - Smooth transitions between manual/autopilot

#### 5. **interfaces/drone.ts**

- TypeScript interfaces for type safety
- Defines: DroneState, MotorOutputs, DroneCommand, DroneControllerConfig, DroneAdapter

#### 6. **adapters/simulationAdapter.ts**

- Connects controller to physics simulation
- Extensible for hardware adapters (e.g., Betaflight)

## Key Features

### Physics Simulation

- **Realistic Forces**: Gravity, thrust (with motor lag), wind, drag
- **Torque Model**: Separate pitch/roll/yaw torques with configurable strength
- **Collision Detection**: Per-axis AABB with tangential damping
- **Terrain Following**: Multi-point sampling with spring-damper contact

### Control System

- **Manual Mode**: Direct control with active stabilization
- **Autopilot Mode**: PID-based stabilization for commands
- **Position Hold**: Automatic hover when no input detected
- **Safety Limits**: Max tilt, yaw rate, vertical speed

### API Design

- **Promise-based**: All commands return promises
- **Async/Await**: Clean syntax for mission scripting
- **Global Access**: `window.drone` for user scripts
- **THREE.js Integration**: Vector3 for positions

## Usage Example

```javascript
async function mission() {
  // Take off to 15 meters
  await drone.takeoff(15);

  // Hover for 3 seconds
  await drone.hover();
  await new Promise((r) => setTimeout(r, 3000));

  // Set yaw to 90 degrees
  await drone.setYaw(90);

  // Land
  await drone.land();
}

mission();
```

## Backup Location

Original library backed up to: `backup/custom_library/`

## Integration Points

- **DroneSimulation.tsx**: Main simulation loop
- **useDrone.tsx**: Zustand store for drone state
- **codeCompiler.ts**: Compiles user scripts
- **DRONE_API_SAMPLE.js**: Example scripts

## Physics Parameters (Tunable)

```typescript
mass: 1.5 kg
gravity: 9.81 m/s²
drag: 0.1
angularDrag: 5.0
thrustFactor: 2.5
motorTau: 0.07 s
maxTilt: 60°
inertia: { x: 0.03, y: 0.03, z: 0.05 } kg⋅m²
```

## PID Defaults (from codeCompiler.ts)

```typescript
pitch: { kp: 2.0, ki: 0.1, kd: 0.5 }
roll:  { kp: 2.0, ki: 0.1, kd: 0.5 }
yaw:   { kp: 1.5, ki: 0.05, kd: 0.3 }
altitude: { kp: 3.0, ki: 0.2, kd: 1.0 }
```

## Next Steps

- Implement full position controller for `moveTo()`
- Add waypoint navigation
- Implement trajectory planning
- Add velocity control mode
- Enhance safety features (geofencing, battery simulation)

## Notes

- Position controller (`moveTo`) is currently a stub - needs proper implementation
- All physics calculations use SI units (meters, kilograms, seconds)
- Collision box: 2.0 × 1.0 × 2.0 units (width × height × depth)
- Terrain collision uses 5-point sampling for accuracy
