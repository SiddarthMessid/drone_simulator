# 3D Drone Simulation Platform - Complete Technical Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Physics Engine & Algorithms](#physics-engine--algorithms)
5. [Control Systems](#control-systems)
6. [Custom Libraries](#custom-libraries)
7. [Hardware-in-the-Loop (HIL) Implementation](#hardware-in-the-loop-hil-implementation)
8. [Multi-Drone Fleet System](#multi-drone-fleet-system)
9. [Environment & Terrain System](#environment--terrain-system)
10. [Code Execution System](#code-execution-system)

---

## Project Overview

This is a comprehensive 3D drone simulation platform built for:

- **Drone flight simulation** with realistic physics
- **PID controller tuning** and testing
- **Multi-drone fleet coordination** and formation flying
- **Mission planning** and autonomous navigation
- **Hardware-in-the-Loop (HIL)** testing via WebSocket
- **Custom code execution** (Python-like PID configs and JavaScript drone commands)
- **Procedural terrain generation** with collision detection
- **Real-time wind simulation** and environmental effects

### Key Features

- Real-time physics simulation at 60 FPS
- Manual and autopilot flight modes
- Multi-drone formation flying (V-formation, line, circle)
- Procedural and GLTF 3D model support
- Terrain generation with heightmaps
- WebSocket-based HIL interface for real hardware
- Live code editor with Python/JavaScript support
- Gamepad and keyboard controls

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   UI Layer   │  │  Code Editor │  │  3D Renderer │          │
│  │   (React)    │  │   (Monaco)   │  │  (Three.js)  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│  ┌──────▼──────────────────▼──────────────────▼───────┐         │
│  │           State Management (Zustand)                │         │
│  │  - useDrone    - useWind    - useEnvironment       │         │
│  │  - useMultiDrone - useMission - useCamera          │         │
│  └──────┬──────────────────────────────────────────────┘         │
│         │                                                         │
│  ┌──────▼──────────────────────────────────────────────┐         │
│  │              Control Layer                           │         │
│  │  ┌────────────────┐  ┌────────────────┐            │         │
│  │  │ DroneController│  │SimpleDroneCtrl │            │         │
│  │  │  (Main Drone)  │  │ (Fleet Drones) │            │         │
│  │  └────────┬───────┘  └────────┬───────┘            │         │
│  │           │                    │                     │         │
│  │  ┌────────▼────────────────────▼───────┐            │         │
│  │  │        Adapter Layer                │            │         │
│  │  │  - SimulationAdapter (default)      │            │         │
│  │  │  - BetaflightAdapter (HIL)          │            │         │
│  │  └────────┬────────────────────────────┘            │         │
│  └───────────┼─────────────────────────────────────────┘         │
│              │                                                    │
│  ┌───────────▼─────────────────────────────────────────┐         │
│  │              Physics Engine                          │         │
│  │  ┌──────────────┐  ┌──────────────┐                │         │
│  │  │ DronePhysics │  │PIDController │                │         │
│  │  │  (Dynamics)  │  │ (Autopilot)  │                │         │
│  │  └──────────────┘  └──────────────┘                │         │
│  └──────────────────────────────────────────────────────┘         │
│                                                                   │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            │ WebSocket (for HIL)
                            │
┌───────────────────────────▼───────────────────────────────────────┐
│                      SERVER (Express.js)                          │
├───────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  HTTP Server │  │  WebSocket   │  │  Vite Dev    │           │
│  │   (API)      │  │   (HIL)      │  │   Server     │           │
│  └──────────────┘  └──────┬───────┘  └──────────────┘           │
│                            │                                       │
│                            │ Serial/USB                            │
│                            │                                       │
│                    ┌───────▼────────┐                             │
│                    │  Flight        │                             │
│                    │  Controller    │                             │
│                    │  (Betaflight)  │                             │
│                    └────────────────┘                             │
└───────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

**Frontend (React + Three.js)**

- `App.tsx` - Main application shell with layout
- `DroneSimulation.tsx` - Main drone physics loop
- `DroneFlock.simple.tsx` - Multi-drone fleet renderer
- `CodeEditor.tsx` - Monaco-based code editor
- `ControlPanel.tsx` - Telemetry and controls UI
- `MultiDroneController.simple.tsx` - Fleet management UI

**State Management (Zustand)**

- `useDrone` - Main drone state
- `useMultiDrone` - Fleet management
- `useEnvironment` - Obstacles and terrain
- `useWind` - Wind simulation
- `useCamera` - Camera modes
- `useMission` - Mission planning

**Control Systems**

- `DroneController` - High-level autopilot
- `SimpleDroneController` - Formation flying
- `PIDController` - Stabilization
- `DronePhysics` - Physics simulation

**Adapters (HIL Interface)**

- `SimulationAdapter` - Default in-browser simulation
- `BetaflightAdapter` - Real hardware via MSP protocol

---

## Tech Stack

### Frontend

| Technology             | Version                   | Purpose                     |
| ---------------------- | ------------------------- | --------------------------- |
| **React**              | 18.3.1                    | UI framework                |
| **TypeScript**         | 5.6.3                     | Type-safe development       |
| **Three.js**           | 0.170.0                   | 3D rendering engine         |
| **@react-three/fiber** | 8.18.0                    | React renderer for Three.js |
| **@react-three/drei**  | 9.122.0                   | Three.js helpers            |
| **Zustand**            | 5.0.3                     | State management            |
| **Tailwind CSS**       | 3.4.14                    | Styling                     |
| **Radix UI**           | Various                   | Accessible UI components    |
| **Framer Motion**      | 11.13.1                   | Animations                  |
| **Monaco Editor**      | (via react-monaco-editor) | Code editor                 |

### Backend

| Technology         | Version | Purpose                 |
| ------------------ | ------- | ----------------------- |
| **Express.js**     | 4.21.2  | HTTP server             |
| **WebSocket (ws)** | 8.18.0  | Real-time communication |
| **Vite**           | 5.4.14  | Build tool & dev server |

### Physics & Math

| Library           | Purpose |
| ----------------- | ------- | ------------------ |
| **gl-matrix**     | 3.4.3   | Matrix operations  |
| **simplex-noise** | 4.0.3   | Terrain generation |

### Database (Optional)

| Technology      | Purpose                        |
| --------------- | ------------------------------ | ---------------- |
| **Drizzle ORM** | 0.39.1                         | Database ORM     |
| **PostgreSQL**  | (via @neondatabase/serverless) | Data persistence |

---

## Physics Engine & Algorithms

### 1. Drone Physics Model

**File:** `client/src/lib/dronePhysics.ts`

The physics engine simulates a quadcopter using rigid body dynamics with the following model:

#### Physical Parameters

```typescript
mass: 1.5 kg                    // Drone mass
gravity: 9.81 m/s²              // Gravitational acceleration
thrustFactor: 2.5               // Max thrust = 2.5 × mass × gravity
motorTau: 0.07 s                // Motor response time constant
inertia: [0.03, 0.03, 0.05] kg⋅m²  // Moment of inertia [Ixx, Iyy, Izz]
drag: 0.1                       // Linear drag coefficient
angularDrag: 5.0                // Angular drag coefficient
maxTilt: π/3 rad (60°)          // Maximum tilt angle
```

#### Equations of Motion

**Linear Motion:**

```
F_total = F_thrust + F_gravity + F_wind + F_drag

F_thrust = throttle × thrustFactor × mass × gravity × R(θ)
  where R(θ) is rotation matrix from body to world frame

F_gravity = [0, -mass × gravity, 0]

F_drag = -drag × velocity

Acceleration = F_total / mass
Velocity += Acceleration × dt
Position += Velocity × dt
```

**Angular Motion:**

```
Torque = [τ_pitch, τ_yaw, τ_roll]

τ_pitch = pitch_input × torqueStrength
τ_yaw = yaw_input × torqueStrength × 0.5
τ_roll = roll_input × torqueStrength

Angular Acceleration = Torque / Inertia
Angular Velocity += Angular Acceleration × dt
Angular Velocity *= (1 - angularDrag × dt)  // Apply damping
Rotation += Angular Velocity × dt
```

**Motor Dynamics (First-Order System):**

```
Desired Thrust = throttle × maxThrust
Motor Thrust += (Desired Thrust - Motor Thrust) × α
  where α = 1 - exp(-dt / motorTau)
```

This creates realistic motor lag and prevents instantaneous thrust changes.

### 2. Collision Detection

**Algorithm:** Axis-Aligned Bounding Box (AABB) with swept collision

**Per-Axis Collision Resolution:**

```
For each axis (X, Y, Z):
  1. Move drone along axis
  2. Check AABB intersection with all obstacles
  3. If collision:
     - Calculate penetration depth
     - Push drone out of obstacle
     - Zero velocity on that axis
     - Apply tangential damping (0.9×)
```

**AABB Intersection Test:**

```typescript
function aabbIntersect(a: AABB, b: AABB): boolean {
  return (
    |a.center.x - b.center.x| < (a.half.x + b.half.x) &&
    |a.center.y - b.center.y| < (a.half.y + b.half.y) &&
    |a.center.z - b.center.z| < (a.half.z + b.half.z)
  );
}
```

### 3. Terrain Collision

**Multi-Point Sampling:**

```
Sample terrain height at 5 points:
  - Center (drone position)
  - Front, Back, Left, Right (±0.5m radius)

Terrain Height = max(all samples)  // Most conservative

if (drone_bottom < terrain_height + clearance):
  Apply spring-damper force:
    F = k_spring × penetration - k_damping × velocity_y

  Hard limit: prevent penetration below ground
```

**Spring-Damper Parameters:**

```
k_spring = 500 N/m      // Spring stiffness
k_damping = 50 N⋅s/m    // Damping coefficient
clearance = 0.05 m      // Minimum ground clearance
```

### 4. Wind Simulation

**File:** `client/src/lib/stores/useWind.tsx`

Wind is calculated per-frame based on multiple wind sources:

**Wind Force Calculation:**

```
For each wind source:
  distance = |drone_position - source_position|

  if distance <= source.radius:
    // Calculate base force
    force = source.force

    // Apply time-varying modulation (if variable)
    if source.type == 'variable':
      variation = sin(time × frequency × 2π) × amplitude
      force = max(0, force + variation)

    // Apply distance falloff
    falloff = max(0, 1 - distance / radius)
    force *= falloff

    // Convert to vector
    wind_x = cos(direction) × force
    wind_z = sin(direction) × force

    total_wind += [wind_x, 0, wind_z]
```

---

## Control Systems

### 1. PID Controller

**File:** `client/src/lib/pidController.ts`

The PID (Proportional-Integral-Derivative) controller stabilizes the drone in autopilot mode.

#### PID Control Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DRONE PID CONTROL SYSTEM                         │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   SETPOINT   │
                              │  (Desired)   │
                              │              │
                              │ • Pitch: 0°  │
                              │ • Roll: 0°   │
                              │ • Yaw: 90°   │
                              │ • Alt: 10m   │
                              └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │    ERROR     │
                              │ Calculation  │
                              │              │
                              │ error = SP - │
                              │   current    │
                              └──────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
         ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
         │PROPORTIONAL  │  │  INTEGRAL    │  │ DERIVATIVE   │
         │    (P)       │  │    (I)       │  │    (D)       │
         │              │  │              │  │              │
         │ P = Kp × e   │  │ I += Ki×e×dt │  │ D = Kd×Δe/dt │
         │              │  │              │  │              │
         │ Responds to  │  │ Eliminates   │  │ Predicts     │
         │ current      │  │ steady-state │  │ future       │
         │ error        │  │ error        │  │ error        │
         └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
                │                 │                 │
                └────────┬────────┴────────┬────────┘
                         │                 │
                         ▼                 ▼
                  ┌──────────────────────────────┐
                  │      PID OUTPUT (Sum)        │
                  │                              │
                  │   output = P + I + D         │
                  │   output = clamp(-2, 2)      │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │      MOTOR OUTPUTS           │
                  │                              │
                  │  • Pitch Motor Command       │
                  │  • Roll Motor Command        │
                  │  • Yaw Motor Command         │
                  │  • Throttle Command          │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │      DRONE PHYSICS           │
                  │                              │
                  │  • Calculate Forces          │
                  │  • Calculate Torques         │
                  │  • Update Position           │
                  │  • Update Rotation           │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │      CURRENT STATE           │
                  │      (Feedback)              │
                  │                              │
                  │  • Actual Pitch: 2°          │
                  │  • Actual Roll: -1°          │
                  │  • Actual Yaw: 88°           │
                  │  • Actual Alt: 9.8m          │
                  └──────────────┬───────────────┘
                                 │
                                 │ (Feedback Loop)
                                 └─────────────────┐
                                                   │
                              ┌────────────────────┘
                              │
                              ▼
                       (Back to Error Calculation)
```

#### Detailed PID Flow for Single Axis (Pitch Example)

```
TIME: t=0.016s (60 FPS)

INPUT:
  Setpoint (desired pitch): 0° (level flight)
  Current pitch: 5° (nose up)
  Previous error: 4°
  Integral accumulator: 0.2

STEP 1: Calculate Error
  ┌─────────────────────────────┐
  │ error = 0° - 5° = -5°       │
  └─────────────────────────────┘

STEP 2: Proportional Term
  ┌─────────────────────────────┐
  │ Kp = 2.2                    │
  │ P = 2.2 × (-5°) = -11.0     │
  │                             │
  │ → Strong immediate response │
  └─────────────────────────────┘

STEP 3: Integral Term
  ┌─────────────────────────────┐
  │ Ki = 0.15                   │
  │ integral += -5° × 0.016s    │
  │ integral = 0.2 + (-0.08)    │
  │ integral = 0.12             │
  │ I = 0.15 × 0.12 = 0.018     │
  │                             │
  │ → Eliminates steady error   │
  └─────────────────────────────┘

STEP 4: Derivative Term
  ┌─────────────────────────────┐
  │ Kd = 0.35                   │
  │ Δerror = -5° - 4° = -9°     │
  │ derivative = -9° / 0.016s   │
  │ derivative = -562.5°/s      │
  │ (filtered) = -450°/s        │
  │ D = 0.35 × (-450) = -157.5  │
  │                             │
  │ → Dampens oscillations      │
  └─────────────────────────────┘

STEP 5: Combine & Clamp
  ┌─────────────────────────────┐
  │ output = P + I + D          │
  │ output = -11.0 + 0.018 - 157│
  │ output = -168 (before clamp)│
  │ output = -2.0 (after clamp) │
  │                             │
  │ → Pitch down command        │
  └─────────────────────────────┘

OUTPUT:
  Motor command: -2.0 (maximum pitch down)
  → Drone pitches nose down to correct the 5° error
```

#### Multi-Axis PID Control Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SIMULTANEOUS 4-AXIS PID CONTROL                   │
└─────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────┐
                         │  USER COMMAND   │
                         │  or AUTOPILOT   │
                         └────────┬────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
                ▼                 ▼                 ▼
         ┌──────────┐      ┌──────────┐    ┌──────────┐
         │  PITCH   │      │   ROLL   │    │   YAW    │
         │   PID    │      │   PID    │    │   PID    │
         │          │      │          │    │          │
         │ SP: 0°   │      │ SP: 0°   │    │ SP: 90°  │
         │ Cur: 5°  │      │ Cur: -2° │    │ Cur: 88° │
         │ Out: -2.0│      │ Out: 0.8 │    │ Out: 0.3 │
         └────┬─────┘      └────┬─────┘    └────┬─────┘
              │                 │                │
              │                 │                │
              │                 │                │
              │                 ▼                │
              │          ┌──────────┐            │
              │          │ ALTITUDE │            │
              │          │   PID    │            │
              │          │          │            │
              │          │ SP: 10m  │            │
              │          │ Cur: 9.8m│            │
              │          │ Out: 0.42│            │
              │          └────┬─────┘            │
              │               │                  │
              └───────┬───────┴───────┬──────────┘
                      │               │
                      ▼               ▼
              ┌────────────────────────────┐
              │    MOTOR MIXER             │
              │                            │
              │  Combines all PID outputs  │
              │  into motor commands       │
              └────────┬───────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
    ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
    │Motor 1 │   │Motor 2 │   │Motor 3 │   │Motor 4 │
    │ (FL)   │   │ (FR)   │   │ (BR)   │   │ (BL)   │
    │        │   │        │   │        │   │        │
    │ 45%    │   │ 48%    │   │ 42%    │   │ 40%    │
    └────────┘   └────────┘   └────────┘   └────────┘
         │             │             │             │
         └─────────────┴─────────────┴─────────────┘
                       │
                       ▼
              ┌────────────────┐
              │  DRONE MOVES   │
              │                │
              │  Pitch: ↓      │
              │  Roll:  →      │
              │  Yaw:   ↻      │
              │  Alt:   ↑      │
              └────────────────┘
```

#### PID Algorithm

```
For each axis (pitch, roll, yaw, altitude):

  error = setpoint - current_value

  // Proportional term
  P = Kp × error

  // Integral term (with anti-windup)
  integral += error × dt
  integral = clamp(integral, -maxIntegral, maxIntegral)
  I = Ki × integral

  // Derivative term (with low-pass filter)
  raw_derivative = (error - previous_error) / dt
  filtered_derivative += (raw_derivative - filtered_derivative) × α
    where α = dt / (τ + dt), τ = 0.05s
  D = Kd × filtered_derivative

  // Combined output
  output = P + I + D
  output = clamp(output, -2, 2)
```

#### Default PID Parameters

```typescript
pitch:    { kp: 2.2, ki: 0.15, kd: 0.35 }
roll:     { kp: 2.2, ki: 0.15, kd: 0.35 }
yaw:      { kp: 0.6, ki: 0.02, kd: 0.08 }
altitude: { kp: 1.0, ki: 0.1,  kd: 0.2  }
```

#### Yaw Angle Wrapping

```typescript
// Handle yaw wraparound at ±π
function angleDifference(target: number, current: number): number {
  let diff = target - current;
  while (diff > π) diff -= 2π;
  while (diff < -π) diff += 2π;
  return diff;
}
```

### 2. High-Level Autopilot Controller

**File:** `client/src/lib/droneController.ts`

The `DroneController` provides high-level commands and position hold.

#### Position Hold Algorithm

```
Target Position = user-set waypoint or current position

// Altitude Control (PD)
altitude_error = target_altitude - current_altitude
throttle_correction = kp_alt × altitude_error - kd_alt × velocity_y
throttle = hover_throttle + throttle_correction
throttle = clamp(throttle, 0, 1)

// Horizontal Position Control
position_error = target_position - current_position
distance = |position_error|

if distance > tolerance:
  // Proportional control
  desired_velocity = kp_pos × position_error

  // Velocity damping
  velocity_damping = -kd_pos × current_velocity

  // Convert to tilt angles
  pitch_correction = -position_error.z × kp_pos + velocity_damping.z
  roll_correction = position_error.x × kp_pos + velocity_damping.x

  pitch = clamp(pitch_correction, -maxTilt, maxTilt)
  roll = clamp(roll_correction, -maxTilt, maxTilt)
else:
  pitch = 0
  roll = 0
```

**Position Hold Parameters:**

```typescript
kp_altitude = 0.3      // Altitude proportional gain
kd_altitude = 0.5      // Altitude derivative gain
hover_throttle = 0.4   // Baseline hover throttle (40%)

kp_position = 0.15     // Position proportional gain
kd_position = 0.1      // Position derivative gain
maxTilt = 0.2 rad      // Max tilt (11.5°)
```

### 3. Manual Control Mode

In manual mode, PID is bypassed for direct control:

```typescript
if (manual_mode) {
  motor_outputs = {
    pitch: user_input.pitch,
    roll: user_input.roll,
    yaw: user_input.yaw × 0.5,  // Direct yaw torque
    throttle: user_input.throttle
  };
} else {
  motor_outputs = PID_controller.update(setpoints);
}
```

---

## Custom Libraries

### 1. DronePhysics Class

**Purpose:** Simulates drone rigid body dynamics

**Key Methods:**

```typescript
class DronePhysics {
  constructor(config?: PhysicsConfig)

  update(
    currentState: DroneState,
    motorOutputs: MotorOutputs,
    windForce: Vector3,
    deltaTime: number,
    obstacles: AABB[]
  ): { newState: DroneState; collision: CollisionResult }

  private calculateForces(...)
  private calculateTorques(...)
  private resolveCollisions(...)
  private aabbIntersect(...)
}
```

**Usage:**

```typescript
const physics = new DronePhysics({
  mass: 1.5,
  gravity: 9.81,
  thrustFactor: 2.5,
  motorTau: 0.07,
});

const { newState, collision } = physics.update(
  currentState,
  motorOutputs,
  windForce,
  deltaTime,
  obstacles
);
```

### 2. PIDController Class

**Purpose:** Implements PID control for stabilization

**Key Methods:**

```typescript
class PIDController {
  constructor(params: PIDParams);

  update(
    currentState: PIDState,
    setpoints: PIDSetpoints,
    deltaTime: number
  ): PIDOutputs;

  updateParams(newParams: PIDParams): void;
  reset(): void;

  private calculatePID(axis: string, error: number, dt: number): number;
  private normalizeAngle(angle: number): number;
  private angleDifference(target: number, current: number): number;
}
```

**Usage:**

```typescript
const pid = new PIDController({
  pitch: { kp: 2.0, ki: 0.1, kd: 0.5 },
  roll: { kp: 2.0, ki: 0.1, kd: 0.5 },
  yaw: { kp: 1.5, ki: 0.05, kd: 0.3 },
  altitude: { kp: 3.0, ki: 0.2, kd: 1.0 },
});

const outputs = pid.update(currentState, setpoints, deltaTime);
```

### 3. DroneController Class (Wrapper Library)

**Purpose:** High-level autopilot and mission control wrapper that provides an intuitive API for controlling drone movement, takeoff, landing, and navigation.

**File:** `client/src/lib/droneController.ts`

#### Constructor

```typescript
constructor(adapter: DroneAdapter, config?: Partial<DroneControllerConfig>)
```

**Parameters:**

- `adapter`: DroneAdapter - The adapter to use (SimulationDroneAdapter or BetaflightAdapter)
- `config`: Partial<DroneControllerConfig> - Optional configuration overrides

**Default Configuration:**

```typescript
{
  maxSpeed: 5.0,                    // Maximum horizontal speed (m/s)
  maxAltitude: 50.0,                // Maximum altitude (m)
  positionTolerance: 2.0,           // Position accuracy (m)
  altitudeTolerance: 0.5,           // Altitude accuracy (m)
  angleTolerance: 0.05,             // Angle accuracy (radians)
  commandTimeout: 30000,            // Command timeout (ms)
  safetyLimits: {
    maxTiltAngle: Math.PI / 3,      // 60 degrees max tilt
    maxYawRate: 2.0,                // Max yaw rate (rad/s)
    maxVerticalSpeed: 3.0           // Max vertical speed (m/s)
  }
}
```

#### Connection Methods

```typescript
async connect(): Promise<void>
```

Establishes connection to the drone adapter (WebSocket for HIL, or initializes simulation).

```typescript
async disconnect(): Promise<void>
```

Disconnects from the drone adapter and cleans up resources.

#### Flight Command Methods

```typescript
async takeoff(targetAltitude: number = 10): Promise<void>
```

**Description:** Takes off to the specified altitude.
**Parameters:**

- `targetAltitude`: number - Target altitude in meters (default: 10m)
  **Returns:** Promise that resolves when target altitude is reached
  **Timeout:** 15 seconds

**Example:**

```typescript
// Take off to 10 meters
await drone.takeoff(10);

// Take off to 15 meters
await drone.takeoff(15);
```

---

```typescript
async land(): Promise<void>
```

**Description:** Lands the drone safely to ground level (0.5m).
**Returns:** Promise that resolves when landing is complete
**Timeout:** 20 seconds

**Example:**

```typescript
await drone.land();
```

---

```typescript
async hover(): Promise<void>
```

**Description:** Hovers at the current position and altitude.
**Returns:** Promise that resolves after stabilization (1.5 seconds)
**Timeout:** 1.5 seconds

**Example:**

```typescript
// Hover in place
await drone.hover();
```

---

```typescript
async moveTo(targetPosition: THREE.Vector3, options?: { speed?: number, timeout?: number }): Promise<void>
```

**Description:** Moves the drone to a target 3D position.
**Parameters:**

- `targetPosition`: THREE.Vector3 - Target position in world coordinates
- `options.speed`: number - Optional speed override (m/s)
- `options.timeout`: number - Optional timeout override (ms, default: 30000)
  **Returns:** Promise that resolves when position is reached
  **Timeout:** 30 seconds (default)

**Example:**

```typescript
// Move to position (10, 15, 20)
await drone.moveTo(new THREE.Vector3(10, 15, 20));

// Move with custom timeout
await drone.moveTo(new THREE.Vector3(5, 10, 5), { timeout: 60000 });
```

---

```typescript
async dir(fromX: number, fromY: number, fromZ: number, toX: number, toY: number, toZ: number): Promise<void>
```

**Description:** Moves the drone from one position to another (convenience method).
**Parameters:**

- `fromX, fromY, fromZ`: number - Starting position (informational)
- `toX, toY, toZ`: number - Target position
  **Returns:** Promise that resolves when target is reached

**Example:**

```typescript
// Move from (0,10,0) to (10,15,20)
await drone.dir(0, 10, 0, 10, 15, 20);
```

#### Attitude Control Methods

```typescript
async setPitch(degrees: number): Promise<void>
```

**Description:** Sets the drone's pitch angle.
**Parameters:**

- `degrees`: number - Pitch angle in degrees (positive = nose up)
  **Returns:** Promise that resolves when angle is achieved
  **Timeout:** 5 seconds

**Example:**

```typescript
// Pitch nose up 15 degrees
await drone.setPitch(15);

// Pitch nose down 10 degrees
await drone.setPitch(-10);
```

---

```typescript
async setRoll(degrees: number): Promise<void>
```

**Description:** Sets the drone's roll angle.
**Parameters:**

- `degrees`: number - Roll angle in degrees (positive = right wing down)
  **Returns:** Promise that resolves when angle is achieved
  **Timeout:** 5 seconds

**Example:**

```typescript
// Roll right 20 degrees
await drone.setRoll(20);

// Roll left 15 degrees
await drone.setRoll(-15);
```

---

```typescript
async setYaw(degrees: number): Promise<void>
```

**Description:** Sets the drone's yaw heading.
**Parameters:**

- `degrees`: number - Yaw angle in degrees (0 = north, 90 = east)
  **Returns:** Promise that resolves when heading is achieved
  **Timeout:** 5 seconds

**Example:**

```typescript
// Face east
await drone.setYaw(90);

// Face south
await drone.setYaw(180);

// Face west
await drone.setYaw(270);
```

---

```typescript
async setThrottle(percentage: number): Promise<void>
```

**Description:** Sets the throttle percentage.
**Parameters:**

- `percentage`: number - Throttle percentage (0-100)
  **Returns:** Promise that resolves immediately
  **Timeout:** 1 second

**Example:**

```typescript
// Set throttle to 60%
await drone.setThrottle(60);

// Set throttle to hover level (40%)
await drone.setThrottle(40);
```

#### Mode Control Methods

```typescript
enableManualControl(): void
```

**Description:** Disables autopilot and enables manual control mode.

**Example:**

```typescript
// Switch to manual control
drone.enableManualControl();
```

---

```typescript
isAutopilotActive(): boolean
```

**Description:** Checks if the drone is currently in autopilot mode.
**Returns:** true if autopilot is active, false otherwise

**Example:**

```typescript
if (drone.isAutopilotActive()) {
  console.log("Drone is in autopilot mode");
}
```

---

```typescript
getCurrentCommand(): DroneCommand | null
```

**Description:** Gets the currently executing command.
**Returns:** Current command object or null

**Example:**

```typescript
const command = drone.getCurrentCommand();
if (command) {
  console.log("Executing:", command.type);
}
```

---

```typescript
cancelCurrentCommand(): void
```

**Description:** Cancels the currently executing command and clears the command queue.

**Example:**

```typescript
// Cancel current operation
drone.cancelCurrentCommand();
```

---

```typescript
emergencyStop(): void
```

**Description:** Immediately stops all operations and disables autopilot. Clears all targets and pending commands.

**Example:**

```typescript
// Emergency stop
drone.emergencyStop();
```

#### Update Loop Method

```typescript
update(manualControls: PIDSetpoints, deltaTime: number): PIDSetpoints
```

**Description:** Called each frame to calculate PID setpoints. This method handles the transition between manual and autopilot modes, position hold logic, and generates appropriate control setpoints.

**Parameters:**

- `manualControls`: PIDSetpoints - Manual control inputs from user
- `deltaTime`: number - Time since last update (seconds)

**Returns:** PIDSetpoints - Calculated setpoints for the PID controller

**Note:** This method is called automatically by the simulation loop. You typically don't need to call this directly.

#### Complete Usage Examples

**Example 1: Simple Takeoff and Landing**

```typescript
import { drone } from "./lib/droneController";

async function simpleFlight() {
  try {
    // Take off to 10 meters
    await drone.takeoff(10);
    console.log("Takeoff complete");

    // Hover for 3 seconds
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Land
    await drone.land();
    console.log("Landing complete");
  } catch (error) {
    console.error("Flight error:", error);
    drone.emergencyStop();
  }
}
```

**Example 2: Square Flight Pattern**

```typescript
async function squarePattern() {
  try {
    await drone.takeoff(15);

    // Fly a square pattern
    await drone.moveTo(new THREE.Vector3(10, 15, 0));
    await drone.moveTo(new THREE.Vector3(10, 15, 10));
    await drone.moveTo(new THREE.Vector3(0, 15, 10));
    await drone.moveTo(new THREE.Vector3(0, 15, 0));

    await drone.land();
  } catch (error) {
    console.error("Pattern error:", error);
    drone.emergencyStop();
  }
}
```

**Example 3: Attitude Control**

```typescript
async function attitudeDemo() {
  try {
    await drone.takeoff(10);

    // Pitch forward
    await drone.setPitch(15);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Level out
    await drone.setPitch(0);

    // Roll right
    await drone.setRoll(20);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Level out
    await drone.setRoll(0);

    // Rotate 360 degrees
    for (let angle = 0; angle <= 360; angle += 45) {
      await drone.setYaw(angle);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await drone.land();
  } catch (error) {
    console.error("Attitude demo error:", error);
    drone.emergencyStop();
  }
}
```

**Example 4: Complex Mission**

```typescript
async function complexMission() {
  try {
    // Takeoff
    await drone.takeoff(20);

    // Waypoint navigation
    const waypoints = [
      new THREE.Vector3(10, 20, 0),
      new THREE.Vector3(20, 25, 10),
      new THREE.Vector3(30, 20, 20),
      new THREE.Vector3(20, 15, 30),
      new THREE.Vector3(0, 20, 20),
    ];

    for (const waypoint of waypoints) {
      console.log(`Flying to: ${waypoint.toArray()}`);
      await drone.moveTo(waypoint);

      // Hover at each waypoint
      await drone.hover();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Return home and land
    await drone.moveTo(new THREE.Vector3(0, 20, 0));
    await drone.land();

    console.log("Mission complete!");
  } catch (error) {
    console.error("Mission failed:", error);
    drone.emergencyStop();
  }
}
```

**Example 5: Using with Custom Adapter (HIL)**

```typescript
import { BetaflightAdapter } from "./adapters/betaflightAdapter";
import { DroneController } from "./droneController";

async function hilFlight() {
  // Create controller with Betaflight adapter
  const hilAdapter = new BetaflightAdapter({
    baudRate: 115200,
    portPath: "/dev/ttyUSB0",
  });

  const hilDrone = new DroneController(hilAdapter, {
    maxSpeed: 3.0, // Slower for real hardware
    safetyLimits: {
      maxTiltAngle: Math.PI / 6, // 30 degrees max
      maxYawRate: 1.0,
      maxVerticalSpeed: 2.0,
    },
  });

  try {
    // Connect to hardware
    await hilDrone.connect();
    console.log("Connected to flight controller");

    // Execute flight
    await hilDrone.takeoff(5);
    await hilDrone.moveTo(new THREE.Vector3(3, 5, 3));
    await hilDrone.land();

    // Disconnect
    await hilDrone.disconnect();
  } catch (error) {
    console.error("HIL flight error:", error);
    hilDrone.emergencyStop();
  }
}
```

**Example 6: Error Handling and Timeouts**

```typescript
async function robustFlight() {
  try {
    await drone.takeoff(10);

    // Move with custom timeout
    await drone.moveTo(
      new THREE.Vector3(50, 10, 50),
      { timeout: 60000 } // 60 second timeout for long distance
    );

    await drone.land();
  } catch (error) {
    if (error.message.includes("timed out")) {
      console.error("Command timed out, attempting recovery");
      drone.cancelCurrentCommand();
      await drone.hover();
      await drone.land();
    } else {
      console.error("Unexpected error:", error);
      drone.emergencyStop();
    }
  }
}
```

#### Safety Features

The DroneController includes several built-in safety features:

1. **Safety Limit Validation**: Continuously monitors tilt angles, yaw rate, and vertical speed
2. **Command Timeouts**: All commands have configurable timeouts to prevent hanging
3. **Emergency Stop**: Immediately halts all operations and clears targets
4. **Position Hold**: Automatically maintains position when no input is given
5. **Smooth Transitions**: Gradual transitions between manual and autopilot modes

#### Internal Control Algorithm

**Position Hold:**

```
Altitude Control (PD):
  altitude_error = target_altitude - current_altitude
  throttle_correction = kp_alt × altitude_error - kd_alt × velocity_y
  throttle = hover_throttle + throttle_correction

Horizontal Position Control:
  position_error = target_position - current_position
  distance = |position_error|

  if distance > tolerance:
    desired_velocity = kp_pos × position_error
    velocity_damping = -kd_pos × current_velocity

    pitch_correction = -position_error.z × kp_pos + velocity_damping.z
    roll_correction = position_error.x × kp_pos + velocity_damping.x

    pitch = clamp(pitch_correction, -maxTilt, maxTilt)
    roll = clamp(roll_correction, -maxTilt, maxTilt)
```

**Control Parameters:**

```typescript
kp_altitude = 0.2      // Altitude proportional gain
kd_altitude = 0.4      // Altitude derivative gain
hover_throttle = 0.4   // Baseline hover throttle (40%)

kp_position = 0.15     // Position proportional gain
kd_position = 0.1      // Position derivative gain
maxTilt = 0.2 rad      // Max tilt (11.5°)
```

### 4. SimpleDroneController Class

**Purpose:** Formation flying for multi-drone fleets

**Key Methods:**

```typescript
class SimpleDroneController {
  constructor(adapter: DroneAdapter, config?: DroneControllerConfig);

  // State Management
  getState(): DroneState;
  updateState(newState: DroneState): void;

  // Formation Control
  setAsLeader(isLeader: boolean): void;
  setFormationTarget(offset: Vector3): void;
  updateLeaderPosition(
    position: Vector3,
    rotation: Vector3,
    velocity?: Vector3
  ): void;

  // Setpoint Generation
  getSetpoints(): PIDSetpoints;

  // Emergency
  emergencyStop(): void;
}
```

**Formation Following Algorithm:**

```
if is_leader:
  return hover_setpoints

if has_formation_offset and has_leader_position:
  // Transform offset to world space
  world_offset = rotate(formation_offset, leader_yaw)
  target_position = leader_position + world_offset
  target_position.y = leader_position.y  // Match altitude

  // Calculate position error
  position_error = target_position - current_position
  distance = |position_error|

  // Altitude control
  altitude_error = target_altitude - current_altitude
  throttle = 0.5 + kp_alt × altitude_error - kd_alt × velocity_y

  // Position control (if distance > tolerance)
  if distance > 0.5:
    desired_velocity = kp_pos × position_error

    // Add leader velocity for velocity matching
    desired_velocity += leader_velocity × 0.5

    // Limit speed
    if |desired_velocity| > max_speed:
      desired_velocity = normalize(desired_velocity) × max_speed

    // Transform to local frame
    local_velocity = rotate_inverse(desired_velocity, current_yaw)

    // Convert to tilt
    roll = clamp(local_velocity.x × kv, -maxTilt, maxTilt)
    pitch = clamp(-local_velocity.z × kv, -maxTilt, maxTilt)

    // Match leader yaw
    yaw = leader_yaw
```

### 5. TerrainGenerator Class

**Purpose:** Procedural terrain generation using Perlin/Simplex noise

**Key Methods:**

```typescript
class TerrainGenerator {
  constructor(seed?: string);

  generate(config: TerrainConfig): TerrainData;

  sampleHeight(
    heightMap: Float32Array,
    resolution: number,
    width: number,
    height: number,
    x: number,
    z: number
  ): number;
}
```

**Terrain Generation Algorithm:**

```
For each vertex (x, z):
  height = 0
  amplitude = 1
  frequency = 1

  For each layer:
    For each octave:
      noise_value = simplex_noise(x × scale × frequency, z × scale × frequency)
      height += noise_value × amplitude × layer.amplitude

      amplitude *= persistence
      frequency *= 2

    height += layer.bias

  height = normalize(height) × maxHeight
  heightMap[x, z] = height
```

---

## Hardware-in-the-Loop (HIL) Implementation

### Architecture

The HIL system allows connecting real flight controller hardware (e.g., Betaflight) to the simulation via WebSocket.

```
Browser Simulation ←→ WebSocket ←→ Node.js Server ←→ Serial/USB ←→ Flight Controller
```

### Adapter Pattern

**File:** `client/src/lib/interfaces/drone.ts`

```typescript
interface DroneAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendCommand(command: DroneCommand): Promise<void>;
  sendTelemetry(state: DroneState): void;
  onStateUpdate(callback: (state: DroneState) => void): void;
}
```

### 1. Simulation Adapter (Default)

**File:** `client/src/lib/adapters/simulationAdapter.ts`

```typescript
class SimulationDroneAdapter implements DroneAdapter {
  // Runs physics in-browser
  // No external communication
}
```

### 2. Betaflight Adapter (HIL)

**File:** `client/src/lib/adapters/betaflightAdapter.ts`

```typescript
class BetaflightAdapter implements DroneAdapter {
  private websocket: WebSocket;

  async connect(): Promise<void> {
    this.websocket = new WebSocket("ws://localhost:8080/hil");

    this.websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "telemetry") {
        // Update drone state from real hardware
        this.stateCallback(data.state);
      }
    };
  }

  async sendCommand(command: DroneCommand): Promise<void> {
    // Convert high-level command to MSP protocol
    const mspCommand = this.convertToMSP(command);

    // Send via WebSocket to server
    this.websocket.send(
      JSON.stringify({
        type: "msp_command",
        command: mspCommand,
      })
    );
  }

  sendTelemetry(state: DroneState): void {
    // Send simulation state to hardware (for sensor fusion)
    this.websocket.send(
      JSON.stringify({
        type: "sim_state",
        state: state,
      })
    );
  }
}
```

### WebSocket Protocol

**Client → Server Messages:**

```json
{
  "type": "msp_command",
  "command": {
    "code": 200,
    "data": [1500, 1500, 1800, 1500]
  }
}
```

**Server → Client Messages:**

```json
{
  "type": "telemetry",
  "state": {
    "position": { "x": 0, "y": 10, "z": 0 },
    "rotation": { "x": 0, "y": 0, "z": 0 },
    "velocity": { "x": 0, "y": 0, "z": 0 },
    "angularVelocity": { "x": 0, "y": 0, "z": 0 }
  }
}
```

### MSP Protocol (MultiWii Serial Protocol)

**Command Codes:**

```typescript
enum MSP {
  SET_ARM = 214, // Arm/disarm motors
  SET_RAW_RC = 200, // Send RC inputs
  SET_PID = 202, // Update PID parameters
  RC_NORMAL = 121, // Read RC channels
  ATTITUDE = 108, // Read attitude
  ALTITUDE = 109, // Read altitude
  RAW_IMU = 102, // Read IMU data
}
```

**RC Channel Mapping:**

```
Channel 1: Roll      (1000-2000, center 1500)
Channel 2: Pitch     (1000-2000, center 1500)
Channel 3: Throttle  (1000-2000)
Channel 4: Yaw       (1000-2000, center 1500)
Channel 5: Aux1      (1000-2000, for arming)
```

### Server-Side Implementation (Conceptual)

**File:** `server/routes.ts` (to be implemented)

```typescript
import { WebSocketServer } from "ws";
import { SerialPort } from "serialport";

const wss = new WebSocketServer({ port: 8080, path: "/hil" });
const serialPort = new SerialPort({ path: "/dev/ttyUSB0", baudRate: 115200 });

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    const message = JSON.parse(data.toString());

    if (message.type === "msp_command") {
      // Forward MSP command to flight controller
      const mspPacket = encodeMSP(message.command);
      serialPort.write(mspPacket);
    }
  });

  // Read telemetry from flight controller
  serialPort.on("data", (data) => {
    const telemetry = decodeMSP(data);

    ws.send(
      JSON.stringify({
        type: "telemetry",
        state: telemetry,
      })
    );
  });
});
```

### HIL Data Flow

**Simulation → Hardware:**

1. User gives command in browser (e.g., `drone.takeoff(10)`)
2. `DroneController` calls `adapter.sendCommand()`
3. `BetaflightAdapter` converts to MSP
4. WebSocket sends MSP to server
5. Server forwards to flight controller via serial
6. Flight controller executes command

**Hardware → Simulation:**

1. Flight controller sends telemetry via serial
2. Server receives and decodes MSP
3. Server sends telemetry via WebSocket
4. `BetaflightAdapter` receives telemetry
5. Adapter calls `onStateUpdate()` callback
6. Simulation updates drone state
7. 3D visualization reflects real hardware state

### Usage Example

```typescript
// Switch to HIL mode
import { BetaflightAdapter } from "./adapters/betaflightAdapter";

const hilAdapter = new BetaflightAdapter({
  baudRate: 115200,
  portPath: "/dev/ttyUSB0",
});

const drone = new DroneController(hilAdapter);

await drone.connect(); // Establishes WebSocket connection

// Now all commands go to real hardware
await drone.takeoff(10);
await drone.moveTo(new THREE.Vector3(5, 10, 5));
```

---

## Multi-Drone Fleet System

### Architecture

The multi-drone system uses a leader-follower formation control strategy.

**Components:**

- `useMultiDrone.simple.ts` - Fleet state management
- `SimpleDroneController` - Individual drone controller
- `DroneFlock.simple.tsx` - Fleet renderer

### Formation Types

**1. V-Formation (Triangle)**

```
        L (Leader)
       / \
      F1  F2
     /     \
    F3      F4
```

**Offsets (local space):**

```typescript
Drone 1: (-6, 0, -6)   // Left-back
Drone 2: (+6, 0, -6)   // Right-back
Drone 3: (-12, 0, -12) // Far left-back
Drone 4: (+12, 0, -12) // Far right-back
```

**2. Line Formation**

```
F1 -- F2 -- L -- F3 -- F4
```

**Offsets:**

```typescript
Drone 1: (-12, 0, -3)
Drone 2: (-6, 0, -3)
Drone 3: (+6, 0, -3)
Drone 4: (+12, 0, -3)
```

**3. Circle Formation**

```
      F1
   F4    F2
      L
   F3
```

**Offsets (polar):**

```typescript
radius = 7.2
For drone i:
  angle = (i / count) × 2π
  offset = (sin(angle) × radius, 0, -cos(angle) × radius)
```

### Formation Control Algorithm

**Coordinate Transformation:**

```
// Local offset (relative to leader's forward direction)
local_offset = formation_offset

// Rotate by leader's yaw to get world offset
rotation_matrix = makeRotationY(leader_yaw)
world_offset = local_offset × rotation_matrix

// Calculate target position
target_position = leader_position + world_offset
target_position.y = leader_position.y  // Match altitude
```

**Velocity Matching (Feedforward):**

```
// Basic position control
desired_velocity = kp × (target_position - current_position)

// Add leader velocity for smoother following
desired_velocity += leader_velocity × 0.5

// This prevents lag when leader is moving
```

**Update Loop (60 FPS):**

```
For each frame:
  1. Update leader position/rotation/velocity
  2. For each follower drone:
     a. Calculate target position (leader + rotated offset)
     b. Generate setpoints (altitude, pitch, roll, yaw)
     c. Run PID controller
     d. Update physics
     e. Render
```

### Multi-Drone State Management

**File:** `client/src/lib/stores/useMultiDrone.simple.ts`

```typescript
interface MultiDroneState {
  enabled: boolean;
  drones: Map<string, SimpleDroneController>;
  activeDroneId: string | null;
  maxDrones: number;
  dronePositions: Map<string, Vector3>;
  droneColors: Map<string, string>;
  currentFormation: 'triangle' | 'line' | 'circle';
}

// Key functions
addDrone(): void {
  // 1. Create new SimpleDroneController
  // 2. Calculate formation offset
  // 3. Set initial position (leader + offset)
  // 4. Add to drones map
  // 5. Reassign formation to all drones
}

formationFlight(formation: string): void {
  // 1. Generate offsets for all drones
  // 2. Assign offset to each drone
  // 3. Update leader position
}

updateMainDroneFormation(): void {
  // Called every frame
  // Updates all drones with latest leader state
}
```

---

## Environment & Terrain System

### Terrain Generation

**File:** `client/src/lib/terrain/heightmap.ts`

**Algorithm:** Multi-octave Perlin/Simplex noise

```
For each vertex (x, z):
  total_height = 0
  amplitude = 1
  frequency = 1
  max_amplitude = 0

  For each layer:
    For octave in 0..layer.octaves:
      noise_x = x × layer.scale × frequency
      noise_z = z × layer.scale × frequency

      noise_value = simplex_noise(noise_x, noise_z)
      total_height += noise_value × amplitude × layer.amplitude

      max_amplitude += amplitude × layer.amplitude
      amplitude *= layer.persistence
      frequency *= 2

    total_height += layer.bias

  // Normalize and scale
  height = (total_height / max_amplitude) × maxHeight
```

**Terrain Layers:**

```typescript
{
  scale: 0.01,        // Large features
  amplitude: 1.0,     // Full height
  persistence: 0.5,   // Each octave is 50% of previous
  octaves: 4,         // 4 levels of detail
  bias: 0             // No vertical offset
}
```

### Height Sampling (Bilinear Interpolation)

```
Given world position (x, z):

1. Convert to heightmap coordinates:
   map_x = ((x + width/2) / width) × (resolution - 1)
   map_z = ((z + height/2) / height) × (resolution - 1)

2. Get 4 nearest heightmap points:
   x1 = floor(map_x), x2 = x1 + 1
   z1 = floor(map_z), z2 = z1 + 1

3. Get heights at corners:
   h11 = heightMap[z1 × resolution + x1]
   h21 = heightMap[z1 × resolution + x2]
   h12 = heightMap[z2 × resolution + x1]
   h22 = heightMap[z2 × resolution + x2]

4. Bilinear interpolation:
   fx = map_x - x1
   fz = map_z - z1

   h1 = h11 × (1 - fx) + h21 × fx
   h2 = h12 × (1 - fx) + h22 × fx

   height = h1 × (1 - fz) + h2 × fz
```

### Obstacle System

**File:** `client/src/lib/stores/useEnvironment.tsx`

**Obstacle Structure:**

```typescript
interface Obstacle {
  id: string;
  name: string;
  position: { x; y; z };
  rotation?: { x; y; z };
  size: { x; y; z };
  color?: string;
  modelId?: string; // Reference to GLTF model
}
```

**AABB Generation:**

```typescript
getObstacleAABBs(): AABB[] {
  const aabbs = obstacles.map(obstacle => ({
    center: new Vector3(obstacle.position),
    half: new Vector3(obstacle.size / 2)
  }));

  // Add boundary walls for large terrains
  if (terrain.width >= 1500) {
    aabbs.push(northWall, southWall, eastWall, westWall);
  }

  return aabbs;
}
```

---

## Code Execution System

### Dual-Mode Compiler

**File:** `client/src/lib/codeCompiler.ts`

The code editor supports two modes:

**1. PID Configuration (Python-like)**

```python
def get_pid_parameters():
    """
    Configure PID parameters
    """
    return {
        'pitch': {'kp': 2.0, 'ki': 0.1, 'kd': 0.5},
        'roll':  {'kp': 2.0, 'ki': 0.1, 'kd': 0.5},
        'yaw':   {'kp': 1.5, 'ki': 0.05, 'kd': 0.3},
        'altitude': {'kp': 3.0, 'ki': 0.2, 'kd': 1.0}
    }
```

**2. Drone Commands (JavaScript)**

```javascript
await drone.takeoff(10);
await drone.moveTo(new THREE.Vector3(10, 15, 20));
await drone.setYaw(90);
await drone.land();
```

### Compilation Process

```
1. Detect mode:
   if code contains 'drone.', 'await', 'async':
     mode = 'drone_commands'
   else:
     mode = 'pid_config'

2. If PID config:
   a. Validate Python syntax
   b. Extract numeric values using regex
   c. Parse into PIDParams structure
   d. Validate ranges (0-100)
   e. Update PID controller

3. If drone commands:
   a. Validate JavaScript syntax
   b. Wrap in async function if needed
   c. Execute with global 'drone' object
   d. Enable position hold automatically
   e. Return success/error
```

### Python-like Syntax Validation

```typescript
function executePythonLikeCode(code: string): CompilationResult {
  // Check for required function
  if (!code.includes('def get_pid_parameters()'))
    return error("Missing function");

  // Check for return statement
  if (!code.includes('return {'))
    return error("Must return dictionary");

  // Validate indentation
  for each line:
    if inside function and not indented:
      return error("Indentation error");

  // Check balanced braces
  if open_braces != close_braces:
    return error("Unmatched braces");

  return success;
}
```

### Parameter Extraction (Regex)

```typescript
function extractParam(axis: string, param: string): number {
  // Look for pattern: 'pitch': {'kp': 2.0}
  const pattern = new RegExp(`'${axis}'\\s*:\\s*\\{([^}]+)\\}`);
  const match = code.match(pattern);

  if (match) {
    const content = match[1];
    const valuePattern = new RegExp(`'${param}'\\s*:\\s*([0-9.]+)`);
    const valueMatch = content.match(valuePattern);
    return parseFloat(valueMatch[1]);
  }

  return defaultValue;
}
```

---

## Performance Optimizations

### 1. Physics Timestep Capping

```typescript
const dt = Math.min(deltaTime, 0.02); // Cap at 50 FPS minimum
```

Prevents instability when frame rate drops.

### 2. Collision Detection Optimization

- Per-axis swept collision (early exit)
- AABB only (no expensive mesh collision)
- Spatial partitioning for large obstacle counts (future)

### 3. Terrain Sampling

- Bilinear interpolation (4 samples)
- Clamping to terrain bounds
- Cached heightmap lookups

### 4. Rendering Optimizations

- LOD (Level of Detail) for distant objects
- Frustum culling
- Instanced rendering for fleet drones
- Reduced shadow quality at distance

### 5. State Management

- Zustand (minimal re-renders)
- Selective subscriptions
- Memoized selectors

---

## Future Enhancements

### Planned Features

1. **Advanced HIL**
   - Bidirectional sensor fusion
   - GPS simulation
   - IMU noise injection
2. **Multi-Drone**
   - Swarm intelligence algorithms
   - Collision avoidance between drones
   - Distributed mission planning
3. **Environment**
   - Dynamic weather
   - Moving obstacles
   - Procedural cities
4. **Physics**
   - Aerodynamic effects
   - Propeller wash
   - Ground effect
5. **AI**
   - Reinforcement learning
   - Autonomous navigation
   - Object detection

---

## Conclusion

This drone simulation platform provides a comprehensive environment for:

- Testing flight control algorithms
- Tuning PID parameters
- Developing multi-drone coordination
- Hardware-in-the-loop testing
- Mission planning and execution

The modular architecture with adapter pattern makes it easy to extend for new use cases, from pure simulation to real hardware integration.

**Key Strengths:**

- Realistic physics simulation
- Flexible control systems
- Extensible architecture
- Real-time performance
- WebSocket-ready for HIL

**Documentation Version:** 1.0  
**Last Updated:** 2025-10-29
