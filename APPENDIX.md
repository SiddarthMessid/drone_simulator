# APPENDIX

## A. EXPERIMENTAL SETUP AND HARDWARE CONFIGURATION

### A.1 Development Environment

**Technology Stack:**

- **Frontend Framework:** React 18.3.1 with TypeScript 5.6.3
- **3D Graphics:** Three.js 0.170.0 with React Three Fiber 8.18.0
- **Build Tool:** Vite 5.4.14
- **Backend:** Express.js 4.21.2 with Node.js 18.x/20.x LTS
- **State Management:** Zustand 5.0.3
- **Physics Engine:** Custom implementation (DronePhysics.ts)
- **Real-time Communication:** WebSocket (ws 8.18.0)

**Project Structure:**

```
project/
├── client/                    # Frontend application
│   ├── src/
│   │   ├── lib/
│   │   │   ├── dronePhysics.ts       # Physics engine
│   │   │   ├── pidController.ts      # PID controller
│   │   │   ├── droneModelConfig.ts   # Model configuration
│   │   │   └── stores/               # State management
│   │   └── components/               # React components
│   └── public/                       # Static assets
├── server/                    # Backend server
├── shared/                    # Shared types/utilities
└── scripts/                   # Build and deployment scripts
```

### A.2 Simulation Configuration

**Physics Engine Settings:**

```typescript
// Default Physics Configuration (client/src/lib/physicsConfig.ts)
mass: 1.5 kg                    // Drone mass
gravity: 9.81 m/s²              // Gravitational acceleration
drag: 0.1                       // Linear drag coefficient
angularDrag: 5.0                // Angular drag coefficient
thrustFactor: 2.5               // Thrust multiplier
motorTau: 0.07 s                // Motor response time constant
maxTilt: 60° (π/3 rad)          // Maximum tilt angle
inertia: {                      // Moment of inertia
  x: 0.03 kg⋅m²,
  y: 0.03 kg⋅m²,
  z: 0.05 kg⋅m²
}
```

**PID Controller Tuning:**

```typescript
// Default PID Parameters (client/src/lib/pidController.ts)
pitch: { kp: 2.0, ki: 0.1, kd: 0.5 }
roll:  { kp: 2.0, ki: 0.1, kd: 0.5 }
yaw:   { kp: 1.5, ki: 0.05, kd: 0.3 }
altitude: { kp: 3.0, ki: 0.2, kd: 1.0 }

// Additional Settings
derivativeTau: 0.05 s           // Low-pass filter time constant
throttleRateLimit: 1.5 units/s  // Throttle rate limiter
maxIntegral: 10                 // Anti-windup limit
```

**Collision Detection:**

```typescript
// Drone Bounding Box (AABB)
DRONE_HALF_EXTENTS = {
  x: 1.0 units,                 // Width (half)
  y: 0.5 units,                 // Height (half)
  z: 1.0 units                  // Depth (half)
}

// Safety Parameters
minGroundClearance: 2.0 m       // Minimum altitude above terrain
sampleRadius: 0.5 m             // Multi-point terrain sampling
contactSpring: 500 N/m          // Ground contact stiffness
contactDamping: 50 Ns/m         // Ground contact damping
frictionFactor: 0.85            // Ground friction coefficient
```

**Terrain System:**

```typescript
// Heightmap Configuration
resolution: 256 × 256           // Heightmap resolution
width: 200 units                // Terrain width
height: 200 units               // Terrain depth
interpolation: Bilinear         // Height interpolation method
```

**Drone Model Configuration:**

```typescript
// Model Settings (client/src/lib/droneModelConfig.ts)
type: "procedural" | "gltf"; // Model type
gltfPath: "/models/drone/drone_gltf.glb";
scale: 50; // Model scale factor
propellerAxis: "y"; // Propeller rotation axis
```

### A.3 Performance Optimization

**Rendering Settings:**

- **Frame Rate Target:** 60 FPS
- **Physics Update Rate:** 60 Hz (capped at 50 Hz for stability)
- **Delta Time Cap:** 0.02 seconds (prevents instability)
- **LOD System:** Level-of-detail for distant objects
- **Frustum Culling:** Enabled for off-screen objects

**Collision Detection Optimization:**

- **Per-Axis Swept AABB:** Sequential X→Y→Z collision testing
- **Multi-Point Terrain Sampling:** 5-point sampling for ground detection
- **Spatial Partitioning:** AABB tree for obstacle management

### A.4 Testing Environment

**Test Scenarios:**

1. **Basic Flight Tests:**

   - Takeoff to specified altitude (5m, 10m, 15m, 20m)
   - Hover stability test (10 seconds)
   - Landing from various altitudes

2. **Attitude Control Tests:**

   - Pitch control (-60° to +60°)
   - Roll control (-60° to +60°)
   - Yaw rotation (0° to 360°)
   - Combined attitude maneuvers

3. **Terrain Following Tests:**

   - Flight over flat terrain
   - Flight over sloped terrain
   - Flight over irregular terrain
   - Ground clearance validation

4. **Safety System Tests:**

   - Altitude safety checks
   - Landing safety validation
   - Flight path validation
   - Collision avoidance

5. **Multi-Drone Tests:**
   - Swarm formation (V, line, circle)
   - Swarm behaviors (follow, scatter, gather)
   - Leader-follower coordination
   - Emergency procedures

**Test Files:**

- `DRONE_API_SAMPLE.js` - Basic API usage examples
- `DEBUG_ALTITUDE_TEST.js` - Altitude system validation
- `DRONE_SAFETY_FUNCTIONS_TEST.js` - Safety function tests
- `SIMPLE_TEST.js` - Quick functionality tests

### A.5 Measurement and Logging

**Telemetry Data Collected:**

```typescript
{
  position: { x, y, z },        // Position in meters
  rotation: { pitch, roll, yaw }, // Angles in degrees
  velocity: { x, y, z, speed }, // Velocity in m/s
  altitude: number,             // Absolute altitude (m)
  agl: number,                  // Altitude above ground (m)
  timestamp: number             // Simulation time (ms)
}
```

**Performance Metrics:**

- Frame rate (FPS)
- Physics update frequency (Hz)
- Collision detection time (ms)
- Render time (ms)
- Memory usage (MB)

**Console Logging:**

- Flight command execution
- Safety check results
- Collision events
- Autopilot state changes
- Error and warning messages

---

## B. Hardware and Software Requirements

### A.1 Minimum Hardware Requirements

**Desktop/Laptop:**

- **Processor:** Intel Core i5 (8th Gen) or AMD Ryzen 5 equivalent
- **RAM:** 8 GB DDR4
- **Graphics:** Integrated GPU with WebGL 2.0 support
  - Intel HD Graphics 620 or better
  - AMD Radeon Vega 8 or better
  - NVIDIA GeForce MX150 or better
- **Storage:** 500 MB free disk space
- **Display:** 1366 x 768 resolution minimum
- **Input:** Keyboard (for drone control)

**Optional:**

- **Gamepad:** Xbox/PlayStation controller for enhanced control
- **Mouse:** 3-button mouse with scroll wheel for camera control

### A.2 Recommended Hardware Requirements

**Desktop/Laptop:**

- **Processor:** Intel Core i7 (10th Gen) or AMD Ryzen 7 equivalent
- **RAM:** 16 GB DDR4
- **Graphics:** Dedicated GPU with 4GB VRAM
  - NVIDIA GeForce GTX 1650 or better
  - AMD Radeon RX 5500 XT or better
- **Storage:** 1 GB free disk space (SSD recommended)
- **Display:** 1920 x 1080 resolution or higher
- **Input:** Mechanical keyboard + Gaming mouse

### A.3 Software Requirements

**Operating System:**

- Windows 10/11 (64-bit)
- macOS 10.15 (Catalina) or later
- Linux (Ubuntu 20.04 LTS or equivalent)

**Web Browser (One of the following):**

- Google Chrome 90+ (Recommended)
- Mozilla Firefox 88+
- Microsoft Edge 90+
- Safari 14+ (macOS only)

**Development Environment (For Developers):**

- Node.js 18.x or 20.x LTS
- npm 9.x or yarn 1.22.x
- Git 2.30+
- Visual Studio Code 1.70+ (Recommended IDE)

**Browser Requirements:**

- WebGL 2.0 support (mandatory)
- JavaScript enabled
- Minimum 2 GB available RAM for browser
- Hardware acceleration enabled

### A.4 Network Requirements

**For Development:**

- Internet connection for initial setup (npm packages)
- Localhost access (port 5000 for server, port 5173 for client)

**For Production:**

- Stable internet connection (minimum 5 Mbps)
- WebSocket support
- HTTPS enabled (for production deployment)

### A.5 Browser Compatibility Matrix

| Browser | Version | WebGL 2.0 | Performance | Status             |
| ------- | ------- | --------- | ----------- | ------------------ |
| Chrome  | 90+     | ✅ Yes    | Excellent   | ✅ Fully Supported |
| Firefox | 88+     | ✅ Yes    | Excellent   | ✅ Fully Supported |
| Edge    | 90+     | ✅ Yes    | Excellent   | ✅ Fully Supported |
| Safari  | 14+     | ✅ Yes    | Good        | ✅ Supported       |
| Opera   | 76+     | ✅ Yes    | Good        | ⚠️ Limited Testing |

---

## C. Key Code Excerpts

### C.1 Drone Physics Engine

**File:** `client/src/lib/dronePhysics.ts`

**Core Physics Update Loop:**

```typescript
/**
 * Main physics update - handles forces, torques, and collisions
 * Implements 6-DOF rigid body dynamics with realistic motor response
 */
update(
    currentState: DroneState,
    motorOutputs: MotorOutputs,
    windForce: THREE.Vector3,
    deltaTime: number,
    obstacles: AABB[] = []
): { newState: DroneState; collision: CollisionResult } {
    const dt = Math.min(deltaTime, 0.02); // Cap for stability

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

    // Update angular velocity (τ = I·α → α = τ/I)
    newState.angularVelocity.x += (torques.x / this.config.inertia.x) * dt;
    newState.angularVelocity.y += (torques.y / this.config.inertia.y) * dt;
    newState.angularVelocity.z += (torques.z / this.config.inertia.z) * dt;

    // Apply angular drag
    const dragFactor = Math.max(0, 1 - this.config.angularDrag * dt);
    newState.angularVelocity.multiplyScalar(dragFactor);

    // Limit yaw rate
    const maxYawRate = 2.0; // rad/s
    if (Math.abs(newState.angularVelocity.y) > maxYawRate) {
        newState.angularVelocity.y = Math.sign(newState.angularVelocity.y) * maxYawRate;
    }

    // Update rotation (Euler integration)
    newState.rotation.x += newState.angularVelocity.x * dt;
    newState.rotation.y += newState.angularVelocity.y * dt;
    newState.rotation.z += newState.angularVelocity.z * dt;

    // Normalize yaw to [-π, π]
    while (newState.rotation.y > Math.PI) newState.rotation.y -= 2 * Math.PI;
    while (newState.rotation.y < -Math.PI) newState.rotation.y += 2 * Math.PI;

    // Limit tilt angles
    newState.rotation.x = Math.max(-this.config.maxTilt,
                                   Math.min(this.config.maxTilt, newState.rotation.x));
    newState.rotation.z = Math.max(-this.config.maxTilt,
                                   Math.min(this.config.maxTilt, newState.rotation.z));

    // Update linear velocity (F = ma → a = F/m)
    newState.velocity.x += (forces.x / this.config.mass) * dt;
    newState.velocity.y += (forces.y / this.config.mass) * dt;
    newState.velocity.z += (forces.z / this.config.mass) * dt;

    // Apply linear drag
    newState.velocity.multiplyScalar(1 - this.config.drag * dt);

    // Calculate proposed movement
    const proposedPosition = newState.position.clone();
    const deltaPosition = new THREE.Vector3(
        newState.velocity.x * dt,
        newState.velocity.y * dt,
        newState.velocity.z * dt
    );

    // Collision detection and resolution
    const collision = this.resolveCollisions(
        proposedPosition,
        deltaPosition,
        newState.velocity,
        obstacles
    );

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
```

**Force Calculation with Motor Dynamics:**

```typescript
private calculateForces(
    state: DroneState,
    motorOutputs: MotorOutputs,
    windForce: THREE.Vector3,
    dt: number
): THREE.Vector3 {
    const forces = new THREE.Vector3();

    // Gravity force: F_g = m·g
    forces.y -= this.config.mass * this.config.gravity;

    // Thrust with first-order motor lag: τ·dT/dt + T = T_desired
    const maxThrust = this.config.thrustFactor * this.config.mass * this.config.gravity;
    const desiredThrust = Math.max(0, Math.min(1, motorOutputs.throttle)) * maxThrust;
    const alpha = 1 - Math.exp(-Math.max(dt, 1e-6) / this.config.motorTau);
    this.motorThrust += (desiredThrust - this.motorThrust) * alpha;

    // Transform thrust from body frame to world frame
    const thrustWorld = new THREE.Vector3(0, this.motorThrust, 0);
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(
        new THREE.Euler(state.rotation.x, state.rotation.y, state.rotation.z, 'XYZ')
    );
    thrustWorld.applyMatrix4(rotationMatrix);
    forces.add(thrustWorld);

    // Wind forces
    forces.add(windForce);

    return forces;
}
```

**Torque Calculation:**

```typescript
private calculateTorques(motorOutputs: MotorOutputs): THREE.Vector3 {
    const torqueStrength = 2.0;
    return new THREE.Vector3(
        motorOutputs.pitch * torqueStrength,      // Pitch torque
        motorOutputs.yaw * torqueStrength * 0.5,  // Yaw torque (reduced)
        motorOutputs.roll * torqueStrength        // Roll torque
    );
}
```

**Key Features:**

- 6-DOF rigid body dynamics with Euler integration
- First-order motor lag model (exponential smoothing)
- Yaw rate limiting (2.0 rad/s max)
- Tilt angle limiting (±60°)
- Body-to-world frame transformation for thrust
- Angular and linear drag models
- Delta time capping for numerical stability

---

### C.2 PID Controller

**File:** `client/src/lib/pidController.ts`

**Main PID Update Loop:**

```typescript
/**
 * PID control loop for attitude stabilization
 * Implements proportional-integral-derivative control with advanced features
 */
update(currentState: PIDState, setpoints: PIDSetpoints, deltaTime: number): PIDOutputs {
    const dt = Math.min(deltaTime, 0.1); // Cap for stability

    // Calculate errors with angle wrapping for yaw
    const errors = {
        pitch: setpoints.pitch - currentState.pitch,
        roll: setpoints.roll - currentState.roll,
        yaw: this.angleDifference(setpoints.yaw, currentState.yaw),
    };

    // Calculate PID outputs for attitude
    const outputs: PIDOutputs = {
        pitch: this.calculatePID('pitch', errors.pitch, dt),
        roll: this.calculatePID('roll', errors.roll, dt),
        yaw: this.calculatePID('yaw', errors.yaw, dt),
        throttle: this.applyThrottleRateLimit(
            Math.max(0, Math.min(1, setpoints.throttle)),
            dt
        ),
    };

    // Update previous errors for next iteration
    this.previousError = {
        pitch: errors.pitch,
        roll: errors.roll,
        yaw: errors.yaw,
        altitude: this.previousError.altitude,
    };

    return outputs;
}
```

**PID Calculation with Advanced Features:**

```typescript
private calculatePID(axis: keyof PIDParams, error: number, dt: number): number {
    const params = this.params[axis];

    // Proportional term: P = Kp × e(t)
    const proportional = params.kp * error;

    // Integral term with anti-windup: I = Ki × ∫e(t)dt
    this.integral[axis] += error * dt;
    const maxIntegral = 10; // Anti-windup limit
    this.integral[axis] = Math.max(-maxIntegral, Math.min(maxIntegral, this.integral[axis]));
    const integral = params.ki * this.integral[axis];

    // Derivative term with low-pass filter: D = Kd × de(t)/dt
    // Raw derivative
    const rawDerivative = (error - this.previousError[axis]) / Math.max(dt, 1e-6);

    // Low-pass filter: α = Δt / (τ + Δt)
    const alpha = Math.max(0, Math.min(1, dt / (this.derivativeTau + dt)));
    this.previousDerivative[axis] += (rawDerivative - this.previousDerivative[axis]) * alpha;
    const derivative = params.kd * this.previousDerivative[axis];

    // Combine PID terms and clamp output
    const output = proportional + integral + derivative;
    return Math.max(-2, Math.min(2, output));
}
```

**Angle Wrapping for Yaw:**

```typescript
/**
 * Calculate shortest angular difference between two angles
 * Handles wraparound at ±π
 */
private angleDifference(target: number, current: number): number {
    let diff = target - current;
    // Normalize to [-π, π]
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return diff;
}
```

**Throttle Rate Limiting:**

```typescript
/**
 * Apply rate limiting to throttle changes
 * Prevents sudden thrust changes that could destabilize the drone
 */
private applyThrottleRateLimit(desired: number, dt: number): number {
    const maxDelta = this.throttleRateLimit * dt; // Max change per timestep
    const delta = desired - this.lastThrottle;
    const clipped = Math.max(-maxDelta, Math.min(maxDelta, delta));
    this.lastThrottle += clipped;
    return this.lastThrottle;
}
```

**Reset Function:**

```typescript
/**
 * Reset all PID states (useful when switching modes)
 */
reset(): void {
    this.integral = { pitch: 0, roll: 0, yaw: 0, altitude: 0 };
    this.previousError = { pitch: 0, roll: 0, yaw: 0, altitude: 0 };
    this.previousDerivative = { pitch: 0, roll: 0, yaw: 0, altitude: 0 };
}
```

**Key Features:**

- Separate PID tuning for pitch, roll, yaw, altitude
- Anti-windup protection (integral clamping at ±10)
- Low-pass filtered derivative (τ = 0.05s)
- Throttle rate limiting (1.5 units/s)
- Angle wrapping for yaw control
- Output clamping (±2 range)
- Delta time capping for numerical stability

---

### C.3 Terrain Height Calculation

**File:** `client/src/lib/stores/useEnvironment.tsx`

**Bilinear Interpolation for Terrain Height:**

```typescript
/**
 * Get terrain height at world coordinates using bilinear interpolation
 * Provides smooth height values between heightmap grid points
 */
getTerrainHeight: (x: number, z: number): number => {
  const { terrain } = get();
  if (!terrain || !terrain.heightMap) return 0;

  const { heightMap, resolution, width, height } = terrain;

  // Convert world coordinates to heightmap coordinates
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Clamp to terrain bounds
  const clampedX = Math.max(-halfWidth, Math.min(halfWidth, x));
  const clampedZ = Math.max(-halfHeight, Math.min(halfHeight, z));

  // Map to heightmap indices [0, resolution-1]
  const mapX = ((clampedX + halfWidth) / width) * (resolution - 1);
  const mapZ = ((clampedZ + halfHeight) / height) * (resolution - 1);

  // Get four nearest heightmap points (grid cell corners)
  const x1 = Math.max(0, Math.floor(mapX));
  const x2 = Math.min(x1 + 1, resolution - 1);
  const z1 = Math.max(0, Math.floor(mapZ));
  const z2 = Math.min(z1 + 1, resolution - 1);

  // Calculate interpolation weights
  const fx = Math.max(0, Math.min(1, mapX - x1)); // X fraction [0, 1]
  const fz = Math.max(0, Math.min(1, mapZ - z1)); // Z fraction [0, 1]

  // Sample four corner heights
  const h11 = heightMap[z1 * resolution + x1]; // Bottom-left
  const h21 = heightMap[z1 * resolution + x2]; // Bottom-right
  const h12 = heightMap[z2 * resolution + x1]; // Top-left
  const h22 = heightMap[z2 * resolution + x2]; // Top-right

  // Bilinear interpolation:
  // 1. Interpolate along X axis
  const h1 = h11 * (1 - fx) + h21 * fx; // Bottom edge
  const h2 = h12 * (1 - fx) + h22 * fx; // Top edge

  // 2. Interpolate along Z axis
  return h1 * (1 - fz) + h2 * fz;
};
```

**Multi-Point Terrain Sampling (Used in Physics):**

```typescript
/**
 * Sample terrain at multiple points for better collision detection
 * Used in handleTerrainCollision() in dronePhysics.ts
 */
const sampleRadius = 0.5; // meters
const samples = [
  { x: state.position.x, z: state.position.z }, // Center
  { x: state.position.x + sampleRadius, z: state.position.z }, // Right
  { x: state.position.x - sampleRadius, z: state.position.z }, // Left
  { x: state.position.x, z: state.position.z + sampleRadius }, // Forward
  { x: state.position.x, z: state.position.z - sampleRadius }, // Backward
];

// Take maximum height from all samples
terrainHeight = Math.max(
  ...samples.map((s) => useEnvironment.getState().getTerrainHeight(s.x, s.z))
);
```

**Key Features:**

- Bilinear interpolation for smooth height values
- Coordinate clamping to terrain bounds
- Efficient heightmap lookup (O(1) access)
- Multi-point sampling for collision detection
- Handles edge cases (terrain boundaries)

---

### C.4 Collision Detection (AABB)

**File:** `client/src/lib/dronePhysics.ts`

**Per-Axis Swept AABB Collision Resolution:**

```typescript
/**
 * Per-axis collision detection and resolution
 * Uses swept AABB method with sequential axis testing
 */
private resolveCollisions(
    proposedPosition: THREE.Vector3,
    deltaPosition: THREE.Vector3,
    velocity: THREE.Vector3,
    obstacles: AABB[]
): CollisionResult {
    const collision: CollisionResult = { collided: false, axis: null };

    // Test per-axis movement: X -> Y -> Z (order matters!)
    const axes: Array<{ axis: 'x' | 'y' | 'z', index: 0 | 1 | 2 }> = [
        { axis: 'x', index: 0 },
        { axis: 'y', index: 1 },
        { axis: 'z', index: 2 },
    ];

    for (const { axis, index } of axes) {
        // Move along this axis only
        proposedPosition.setComponent(
            index,
            proposedPosition.getComponent(index) + deltaPosition.getComponent(index)
        );

        // Create drone AABB at new position
        const droneAABB: AABB = {
            center: proposedPosition.clone(),
            half: this.DRONE_HALF_EXTENTS.clone(),
        };

        // Check collision with all obstacles
        for (const obstacle of obstacles) {
            if (this.aabbIntersect(droneAABB, obstacle)) {
                // Calculate overlap distance
                const overlap = this.calculateOverlap(droneAABB, obstacle, axis);
                const sign = Math.sign(deltaPosition.getComponent(index));

                // Push drone out of obstacle
                proposedPosition.setComponent(
                    index,
                    proposedPosition.getComponent(index) - overlap * sign
                );

                // Stop velocity on collision axis
                velocity.setComponent(index, 0);

                // Apply tangential damping (friction)
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
```

**AABB Intersection Test:**

```typescript
/**
 * Test if two axis-aligned bounding boxes intersect
 * Uses separating axis theorem
 */
private aabbIntersect(a: AABB, b: AABB): boolean {
    return (
        Math.abs(a.center.x - b.center.x) < (a.half.x + b.half.x) &&
        Math.abs(a.center.y - b.center.y) < (a.half.y + b.half.y) &&
        Math.abs(a.center.z - b.center.z) < (a.half.z + b.half.z)
    );
}
```

**Overlap Calculation:**

```typescript
/**
 * Calculate overlap distance between two AABBs on a specific axis
 */
private calculateOverlap(a: AABB, b: AABB, axis: 'x' | 'y' | 'z'): number {
    const axisMap = { x: 0, y: 1, z: 2 };
    const index = axisMap[axis];

    const distance = Math.abs(a.center.getComponent(index) - b.center.getComponent(index));
    const combinedHalf = a.half.getComponent(index) + b.half.getComponent(index);

    return combinedHalf - distance; // Positive = overlapping
}
```

**Terrain Collision with Spring-Damper Model:**

```typescript
/**
 * Handle collision with terrain using spring-damper contact model
 */
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

        // Spring-damper contact model: F = k·x - c·v
        const k_contact = 500;  // Spring stiffness (N/m)
        const k_damping = 50;   // Damping coefficient (Ns/m)
        const contactAccel = (k_contact * penetration - k_damping * state.velocity.y)
                           / this.config.mass;
        state.velocity.y += contactAccel * 0.016; // approximate dt

        // Hard limit (prevent penetration)
        if (droneBottom < terrainHeight) {
            state.position.y = terrainHeight + this.DRONE_HALF_EXTENTS.y + minClearance;
            state.velocity.y = Math.max(0, state.velocity.y);
        }

        // Ground friction
        const frictionFactor = 0.85;
        state.velocity.x *= frictionFactor;
        state.velocity.z *= frictionFactor;
        state.angularVelocity.multiplyScalar(frictionFactor);

        return true;
    }

    return false;
}
```

**Key Features:**

- Per-axis swept AABB collision (X→Y→Z order)
- Separating axis theorem for intersection test
- Overlap calculation and resolution
- Velocity damping on collision axis
- Tangential friction (90% damping)
- Spring-damper terrain contact model
- Multi-point terrain sampling
- Hard position correction for penetration
- Ground friction effects

---

### C.5 Wrapper Library Implementation Examples

**File:** `client/src/lib/droneWrapper.ts` (Custom API Layer)

**Altitude Above Ground Level (AGL) Calculation:**

```typescript
/**
 * Get altitude above ground level at current position
 * Uses terrain heightmap for accurate ground height
 */
getAltitudeAGL(): number {
    const pos = this.getPosition();
    const groundHeight = this.getGroundHeight(pos.x, pos.z);
    return Math.max(0, pos.y - groundHeight);
}
```

**Altitude Safety Check:**

```typescript
/**
 * Check if target altitude is safe above terrain
 * Returns safe altitude if requested altitude is too low
 */
checkAltitudeSafety(
    altitude: number,
    position?: THREE.Vector3
): {
    isSafe: boolean;
    groundHeight: number;
    requestedAltitude: number;
    safeAltitude: number;
    clearance: number;
} {
    const pos = position || this.getPosition();
    const groundHeight = this.getGroundHeight(pos.x, pos.z);
    const minClearance = 2.0; // meters
    const safeAltitude = groundHeight + minClearance;
    const clearance = altitude - groundHeight;

    return {
        isSafe: altitude >= safeAltitude,
        groundHeight,
        requestedAltitude: altitude,
        safeAltitude,
        clearance,
    };
}
```

**Flight Path Validation:**

```typescript
/**
 * Validate entire flight path for terrain clearance
 * Checks all waypoints against minimum clearance requirement
 */
validateFlightPath(
    waypoints: THREE.Vector3[],
    minClearance: number = 2.0
): {
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
    const violations = [];

    for (let i = 0; i < waypoints.length; i++) {
        const wp = waypoints[i];
        const groundHeight = this.getGroundHeight(wp.x, wp.z);
        const clearance = wp.y - groundHeight;

        if (clearance < minClearance) {
            violations.push({
                index: i,
                position: wp,
                groundHeight,
                altitude: wp.y,
                clearance,
            });
        }
    }

    const isValid = violations.length === 0;
    const message = isValid
        ? `Flight path valid: All ${waypoints.length} waypoints have sufficient clearance`
        : `Flight path invalid: ${violations.length} waypoint(s) below minimum clearance`;

    return { isValid, violations, message };
}
```

**Takeoff with Ground Clearance:**

```typescript
/**
 * Autonomous takeoff with automatic ground clearance adjustment
 * Ensures minimum 2m clearance above terrain
 */
async takeoff(targetAltitude: number = 10): Promise<void> {
    const pos = this.getPosition();
    const safety = this.checkAltitudeSafety(targetAltitude, pos);

    if (!safety.isSafe) {
        console.warn(
            `Requested altitude ${targetAltitude}m is too low. ` +
            `Using safe altitude ${safety.safeAltitude.toFixed(2)}m instead.`
        );
        targetAltitude = safety.safeAltitude;
    }

    // Execute takeoff command
    this.executeCommand({
        type: 'takeoff',
        altitude: targetAltitude,
        position: pos,
    });

    // Wait for completion
    await this.waitForAltitude(targetAltitude, 0.5, 15);
}
```

**Wait for Stable Function:**

```typescript
/**
 * Wait until drone velocity drops below threshold
 * Returns true if stable, false if timeout
 */
async waitForStable(
    timeout: number = 10,
    threshold: number = 0.5
): Promise<boolean> {
    const startTime = Date.now();

    return new Promise((resolve) => {
        const checkStable = () => {
            const elapsed = (Date.now() - startTime) / 1000;

            if (this.isStable(threshold)) {
                resolve(true);
            } else if (elapsed >= timeout) {
                console.warn(`Stability timeout after ${timeout}s`);
                resolve(false);
            } else {
                setTimeout(checkStable, 100); // Check every 100ms
            }
        };

        checkStable();
    });
}
```

---

## D. Custom Wrapper Library Code Snippets

### D.1 Basic Flight Commands

```javascript
// Takeoff to specified altitude
await drone.takeoff(10); // Takes off to 10 meters

// Land the drone
await drone.land();

// Hover at current position
await drone.hover();

// Set attitude angles
await drone.setPitch(15); // 15 degrees pitch
await drone.setRoll(-10); // -10 degrees roll
await drone.setYaw(90); // 90 degrees yaw

// Direct throttle control
await drone.setThrottle(60); // 60% throttle
```

### D.2 Position and Telemetry

```javascript
// Get current position
const pos = drone.getPosition();
console.log(`X: ${pos.x}, Y: ${pos.y}, Z: ${pos.z}`);

// Get rotation in degrees
const rot = drone.getRotation();
console.log(`Pitch: ${rot.pitch}°, Roll: ${rot.roll}°, Yaw: ${rot.yaw}°`);

// Get velocity and speed
const vel = drone.getVelocity();
console.log(`Speed: ${vel.speed} m/s`);

// Get complete telemetry
const telemetry = drone.getTelemetry();
console.log(telemetry);
// Output: { position, rotation, velocity, altitude, agl }
```

### D.3 Ground Height and Safety

```javascript
// Get altitude above ground level
const agl = drone.getAltitudeAGL();
console.log(`Flying at ${agl}m above ground`);

// Check if altitude is safe
const safety = drone.checkAltitudeSafety(10);
if (!safety.isSafe) {
  console.warn(`Use ${safety.safeAltitude}m instead`);
}

// Get ground height at coordinates
const groundHeight = drone.getGroundHeight(20, 30);
console.log(`Ground at (20, 30): ${groundHeight}m`);

// Check landing safety
const landing = drone.checkLandingSafety();
if (landing.isSafe) {
  await drone.land();
}

// Validate flight path
const waypoints = [
  drone.createPosition(0, 10, 0),
  drone.createPosition(20, 10, 20),
  drone.createPosition(40, 10, 40),
];
const validation = drone.validateFlightPath(waypoints, 2.0);
console.log(validation.message);
```

### D.4 Status Checks

```javascript
// Check if drone is flying
if (drone.isFlying()) {
  console.log("Drone is airborne");
}

// Check if drone is stable
if (drone.isStable()) {
  console.log("Drone is stable");
}

// Check autopilot status
if (drone.isAutopilotActive()) {
  console.log("Autopilot engaged");
}
```

### D.5 Position Hold

```javascript
// Enable position hold
drone.enablePositionHold();

// Disable position hold
drone.disablePositionHold();

// Toggle position hold
drone.togglePositionHold();

// Check status
if (drone.isPositionHoldEnabled()) {
  console.log("Position hold is active");
}
```

### D.6 Delay and Wait Functions

```javascript
// Wait for specified seconds (like Arduino delay)
await drone.delay(3); // Wait 3 seconds

// Wait for drone to stabilize
const stable = await drone.waitForStable(10, 0.5);
if (stable) {
  console.log("Drone stabilized");
}

// Wait for altitude
await drone.takeoff(15);
const reached = await drone.waitForAltitude(15, 0.5, 10);
if (reached) {
  console.log("Altitude reached");
}
```

### D.7 Swarm Control

```javascript
// Enable swarm mode
drone.swarm.enable();

// Add drones to swarm
drone.swarm.addDrone();
drone.swarm.addDrone();
drone.swarm.addDrone();

// Get swarm count
const count = drone.swarm.count();
console.log(`${count} drones in swarm`);

// Set formation
drone.swarm.form("V"); // V formation
drone.swarm.form("line"); // Line formation
drone.swarm.form("circle"); // Circle formation

// Execute swarm behaviors
await drone.swarm.behavior("follow"); // Follow leader
await drone.swarm.behavior("scatter"); // Scatter pattern
await drone.swarm.behavior("gather"); // Gather together

// Leader control
drone.swarm.setLeader("drone_1");
const leaderId = drone.swarm.getLeader();

// Get all drone IDs
const droneIds = drone.swarm.getDroneIds();
console.log(droneIds);

// Emergency land all
await drone.swarm.emergencyLandAll();

// Disable swarm
drone.swarm.disable();
```

### D.8 Complete Mission Example

```javascript
async function completeMission() {
  console.log("Starting mission...");

  // Pre-flight checks
  const safety = drone.checkAltitudeSafety(15);
  if (!safety.isSafe) {
    console.error("Altitude unsafe!");
    return;
  }

  // Enable position hold
  drone.enablePositionHold();

  // Takeoff
  await drone.takeoff(15);
  await drone.delay(2);

  // Check if stable
  if (!drone.isStable()) {
    console.warn("Drone not stable, waiting...");
    await drone.waitForStable(5);
  }

  // Get telemetry
  const telemetry = drone.getTelemetry();
  console.log(
    `Position: (${telemetry.position.x}, ${telemetry.position.y}, ${telemetry.position.z})`
  );
  console.log(`AGL: ${telemetry.agl}m`);

  // Perform maneuvers
  await drone.setYaw(90);
  await drone.delay(2);

  await drone.setPitch(10);
  await drone.delay(2);
  await drone.setPitch(0);

  // Check landing safety
  const landing = drone.checkLandingSafety();
  console.log(landing.message);

  // Land
  await drone.land();
  await drone.delay(2);

  console.log("Mission complete!");
}

completeMission();
```

---

## E. API Reference Summary

### E.1 Flight Commands

- `takeoff(altitude)` - Autonomous takeoff
- `land()` - Autonomous landing
- `hover()` - Hold current position
- `setPitch(degrees)` - Set pitch angle
- `setRoll(degrees)` - Set roll angle
- `setYaw(degrees)` - Set heading
- `setThrottle(percentage)` - Direct throttle control

### E.2 Information Retrieval

- `getPosition()` - Get x, y, z coordinates
- `getRotation()` - Get pitch, roll, yaw in degrees
- `getVelocity()` - Get velocity and speed
- `getTelemetry()` - Get all data at once
- `getAltitudeAGL()` - Altitude above ground
- `getGroundHeight(x, z)` - Ground height at coordinates

### E.3 Safety Functions

- `checkAltitudeSafety(altitude, position?)` - Validate altitude
- `checkLandingSafety()` - Check if safe to land
- `validateFlightPath(waypoints, minClearance?)` - Validate path

### E.4 Status Checks

- `isFlying()` - Check if airborne
- `isStable(threshold?)` - Check if stable
- `isAutopilotActive()` - Check autopilot status
- `isPositionHoldEnabled()` - Check position hold

### E.5 Utility Functions

- `delay(seconds)` - Wait for specified time
- `waitForStable(timeout, threshold)` - Wait until stable
- `waitForAltitude(altitude, tolerance, timeout)` - Wait for altitude
- `createPosition(x, y, z)` - Create position object
- `enablePositionHold()` - Enable position hold
- `disablePositionHold()` - Disable position hold
- `togglePositionHold()` - Toggle position hold

### E.6 Swarm Control

- `swarm.enable()` - Enable multi-drone mode
- `swarm.disable()` - Disable multi-drone mode
- `swarm.addDrone()` - Add drone to swarm
- `swarm.removeDrone(id)` - Remove drone
- `swarm.count()` - Get drone count
- `swarm.form(formation)` - Set formation ('V', 'line', 'circle')
- `swarm.behavior(behavior)` - Execute behavior ('follow', 'scatter', 'gather')
- `swarm.setLeader(id)` - Set leader
- `swarm.getLeader()` - Get leader ID
- `swarm.getDroneIds()` - Get all drone IDs
- `swarm.emergencyLandAll()` - Emergency land all

---

## F. Default Configuration Values

### F.1 Physics Parameters

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

### F.2 PID Parameters

```typescript
pitch: { kp: 2.0, ki: 0.1, kd: 0.5 }
roll:  { kp: 2.0, ki: 0.1, kd: 0.5 }
yaw:   { kp: 1.5, ki: 0.05, kd: 0.3 }
altitude: { kp: 3.0, ki: 0.2, kd: 1.0 }
```

### F.3 Safety Limits

```typescript
maxTiltAngle: 60° (π/3 radians)
maxYawRate: 2.0 rad/s
maxVerticalSpeed: 3.0 m/s
minGroundClearance: 2.0 m
```

### F.4 Collision Box

```typescript
width: 2.0 units
height: 1.0 units
depth: 2.0 units
```

---

_End of Appendix_
