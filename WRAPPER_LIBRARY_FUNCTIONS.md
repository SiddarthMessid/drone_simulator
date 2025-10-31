# Drone Wrapper Library - Complete Function Reference

## Table of All Implemented Functions

| Category                       | Function                                          | Parameters                                                                                    | Return Type                                                          | Description                                                                                     |
| ------------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **BASIC FLIGHT COMMANDS**      |
| Flight                         | `takeoff(altitude)`                               | `altitude: number` (default: 10)                                                              | `Promise<void>`                                                      | Takes off to specified altitude in meters. Automatically adjusts for ground clearance (min 2m). |
| Flight                         | `land()`                                          | None                                                                                          | `Promise<void>`                                                      | Lands the drone autonomously at current position.                                               |
| Flight                         | `hover()`                                         | None                                                                                          | `Promise<void>`                                                      | Holds current position and altitude.                                                            |
| Flight                         | `setPitch(degrees)`                               | `degrees: number`                                                                             | `Promise<void>`                                                      | Sets pitch angle in degrees (-60° to +60°).                                                     |
| Flight                         | `setRoll(degrees)`                                | `degrees: number`                                                                             | `Promise<void>`                                                      | Sets roll angle in degrees (-60° to +60°).                                                      |
| Flight                         | `setYaw(degrees)`                                 | `degrees: number`                                                                             | `Promise<void>`                                                      | Sets yaw heading in degrees (0° to 360°).                                                       |
| Flight                         | `setThrottle(percentage)`                         | `percentage: number` (0-100)                                                                  | `Promise<void>`                                                      | Sets throttle percentage directly.                                                              |
| Flight                         | `moveTo(position, options?)`                      | `position: THREE.Vector3`<br>`options?: {speed, timeout}`                                     | `Promise<void>`                                                      | Moves to target position (currently stub - not implemented).                                    |
| Flight                         | `dir(fromX, fromY, fromZ, toX, toY, toZ)`         | `fromX, fromY, fromZ: number`<br>`toX, toY, toZ: number`                                      | `Promise<void>`                                                      | Direction-based movement from one point to another.                                             |
| **POSITION & TELEMETRY**       |
| Info                           | `getPosition()`                                   | None                                                                                          | `{x: number, y: number, z: number}`                                  | Returns current drone position in meters.                                                       |
| Info                           | `getRotation()`                                   | None                                                                                          | `{pitch: number, roll: number, yaw: number}`                         | Returns current rotation angles in degrees.                                                     |
| Info                           | `getVelocity()`                                   | None                                                                                          | `{x: number, y: number, z: number, speed: number}`                   | Returns velocity components and total speed in m/s.                                             |
| Info                           | `getTelemetry()`                                  | None                                                                                          | `{position, rotation, velocity, altitude, agl}`                      | Returns complete telemetry data in one call.                                                    |
| **ALTITUDE & GROUND CHECKING** |
| Safety                         | `getAltitudeAGL()`                                | None                                                                                          | `number`                                                             | Returns altitude above ground level in meters.                                                  |
| Safety                         | `getGroundHeight(x, z)`                           | `x: number, z: number`                                                                        | `number`                                                             | Returns ground height at specified coordinates.                                                 |
| Safety                         | `checkAltitudeSafety(altitude, position?)`        | `altitude: number`<br>`position?: THREE.Vector3`                                              | `{isSafe, groundHeight, requestedAltitude, safeAltitude, clearance}` | Validates if target altitude is safe above ground.                                              |
| Safety                         | `checkLandingSafety()`                            | None                                                                                          | `{isSafe, groundHeight, currentAltitude, agl, message}`              | Checks if current position is safe for landing.                                                 |
| Safety                         | `validateFlightPath(waypoints, minClearance?)`    | `waypoints: THREE.Vector3[]`<br>`minClearance?: number` (default: 2.0)                        | `{isValid, violations[], message}`                                   | Validates entire flight path for ground clearance.                                              |
| **STATUS CHECKS**              |
| Status                         | `isFlying()`                                      | None                                                                                          | `boolean`                                                            | Returns true if drone is airborne (AGL > 0.5m).                                                 |
| Status                         | `isStable(threshold?)`                            | `threshold?: number` (default: 0.5)                                                           | `boolean`                                                            | Returns true if velocity is below threshold (m/s).                                              |
| Status                         | `isAutopilotActive()`                             | None                                                                                          | `boolean`                                                            | Returns true if autopilot mode is engaged.                                                      |
| Status                         | `isPositionHoldEnabled()`                         | None                                                                                          | `boolean`                                                            | Returns true if position hold is active.                                                        |
| Status                         | `getCurrentCommand()`                             | None                                                                                          | `DroneCommand \| null`                                               | Returns currently executing command or null.                                                    |
| **POSITION HOLD**              |
| Control                        | `enablePositionHold()`                            | None                                                                                          | `void`                                                               | Enables position hold mode (drone maintains position).                                          |
| Control                        | `disablePositionHold()`                           | None                                                                                          | `void`                                                               | Disables position hold mode.                                                                    |
| Control                        | `togglePositionHold()`                            | None                                                                                          | `void`                                                               | Toggles position hold on/off.                                                                   |
| **DELAY & WAIT FUNCTIONS**     |
| Utility                        | `delay(seconds)`                                  | `seconds: number`                                                                             | `Promise<void>`                                                      | Waits for specified seconds (like Arduino delay).                                               |
| Utility                        | `waitForStable(timeout?, threshold?)`             | `timeout?: number` (default: 10)<br>`threshold?: number` (default: 0.5)                       | `Promise<boolean>`                                                   | Waits until drone stabilizes or timeout. Returns true if stable.                                |
| Utility                        | `waitForAltitude(altitude, tolerance?, timeout?)` | `altitude: number`<br>`tolerance?: number` (default: 0.5)<br>`timeout?: number` (default: 15) | `Promise<boolean>`                                                   | Waits until target altitude reached or timeout.                                                 |
| **HELPER FUNCTIONS**           |
| Utility                        | `createPosition(x, y, z)`                         | `x: number, y: number, z: number`                                                             | `THREE.Vector3`                                                      | Creates a position object without using THREE.Vector3 directly.                                 |
| Control                        | `enableManualControl()`                           | None                                                                                          | `void`                                                               | Returns control to manual mode (disables autopilot).                                            |
| Control                        | `cancelCurrentCommand()`                          | None                                                                                          | `void`                                                               | Cancels currently executing command.                                                            |
| Control                        | `emergencyStop()`                                 | None                                                                                          | `void`                                                               | Emergency stop - cancels all commands and disables autopilot.                                   |
| **SWARM CONTROL**              |
| Swarm                          | `swarm.enable()`                                  | None                                                                                          | `void`                                                               | Enables multi-drone swarm mode.                                                                 |
| Swarm                          | `swarm.disable()`                                 | None                                                                                          | `void`                                                               | Disables multi-drone swarm mode.                                                                |
| Swarm                          | `swarm.isEnabled()`                               | None                                                                                          | `boolean`                                                            | Returns true if swarm mode is enabled.                                                          |
| Swarm                          | `swarm.addDrone()`                                | None                                                                                          | `void`                                                               | Adds a new drone to the swarm.                                                                  |
| Swarm                          | `swarm.removeDrone(id)`                           | `id: string`                                                                                  | `void`                                                               | Removes specified drone from swarm.                                                             |
| Swarm                          | `swarm.count()`                                   | None                                                                                          | `number`                                                             | Returns number of drones in swarm.                                                              |
| Swarm                          | `swarm.form(formation)`                           | `formation: 'V' \| 'line' \| 'circle'`                                                        | `void`                                                               | Sets swarm formation type.                                                                      |
| Swarm                          | `swarm.behavior(behavior)`                        | `behavior: 'follow' \| 'scatter' \| 'gather'`                                                 | `Promise<void>`                                                      | Executes swarm behavior pattern.                                                                |
| Swarm                          | `swarm.emergencyLandAll()`                        | None                                                                                          | `Promise<void>`                                                      | Emergency lands all drones in swarm.                                                            |
| Swarm                          | `swarm.getDroneIds()`                             | None                                                                                          | `string[]`                                                           | Returns array of all drone IDs in swarm.                                                        |
| Swarm                          | `swarm.setLeader(id)`                             | `id: string`                                                                                  | `void`                                                               | Sets specified drone as swarm leader.                                                           |
| Swarm                          | `swarm.getLeader()`                               | None                                                                                          | `string \| null`                                                     | Returns ID of current swarm leader or null.                                                     |

---

## Function Categories Summary

| Category                   | Number of Functions | Purpose                                               |
| -------------------------- | ------------------- | ----------------------------------------------------- |
| Basic Flight Commands      | 9                   | Core flight control (takeoff, land, attitude control) |
| Position & Telemetry       | 4                   | Get drone state information                           |
| Altitude & Ground Checking | 5                   | Safety checks for terrain and altitude                |
| Status Checks              | 5                   | Query drone operational status                        |
| Position Hold              | 3                   | Enable/disable position hold mode                     |
| Delay & Wait Functions     | 3                   | Timing and synchronization utilities                  |
| Helper Functions           | 4                   | Utility functions for control and positioning         |
| Swarm Control              | 12                  | Multi-drone formation and coordination                |
| **TOTAL**                  | **45**              | **Complete API**                                      |

---

## Usage Examples by Category

### Basic Flight Commands

```javascript
await drone.takeoff(15); // Takeoff to 15m
await drone.setPitch(10); // Pitch 10 degrees
await drone.setYaw(90); // Turn to 90 degrees
await drone.land(); // Land
```

### Position & Telemetry

```javascript
const pos = drone.getPosition(); // {x, y, z}
const rot = drone.getRotation(); // {pitch, roll, yaw}
const vel = drone.getVelocity(); // {x, y, z, speed}
const telemetry = drone.getTelemetry(); // All data
```

### Altitude & Ground Checking

```javascript
const agl = drone.getAltitudeAGL(); // Height above ground
const groundHeight = drone.getGroundHeight(10, 20); // Ground at (10, 20)
const safety = drone.checkAltitudeSafety(10); // Check if 10m is safe
const landing = drone.checkLandingSafety(); // Check landing safety
```

### Status Checks

```javascript
if (drone.isFlying()) {
  /* ... */
} // Is airborne?
if (drone.isStable()) {
  /* ... */
} // Is stable?
if (drone.isAutopilotActive()) {
  /* ... */
} // Autopilot on?
if (drone.isPositionHoldEnabled()) {
  /* ... */
} // Position hold on?
```

### Position Hold

```javascript
drone.enablePositionHold(); // Enable
drone.disablePositionHold(); // Disable
drone.togglePositionHold(); // Toggle
```

### Delay & Wait Functions

```javascript
await drone.delay(3); // Wait 3 seconds
await drone.waitForStable(10, 0.5); // Wait until stable
await drone.waitForAltitude(15, 0.5, 10); // Wait for altitude
```

### Swarm Control

```javascript
drone.swarm.enable(); // Enable swarm
drone.swarm.addDrone(); // Add drone
drone.swarm.form("V"); // V formation
await drone.swarm.behavior("follow"); // Follow behavior
await drone.swarm.emergencyLandAll(); // Land all
```

---

## Parameter Types Reference

| Type               | Description                         | Example                                                             |
| ------------------ | ----------------------------------- | ------------------------------------------------------------------- |
| `number`           | Numeric value                       | `10`, `15.5`, `-5`                                                  |
| `string`           | Text string                         | `'drone_1'`, `'V'`, `'follow'`                                      |
| `boolean`          | True/false value                    | `true`, `false`                                                     |
| `THREE.Vector3`    | 3D position vector                  | `new THREE.Vector3(10, 5, 20)` or `drone.createPosition(10, 5, 20)` |
| `Promise<void>`    | Async function (use with `await`)   | `await drone.takeoff(10)`                                           |
| `Promise<boolean>` | Async function returning true/false | `await drone.waitForStable()`                                       |
| `Object`           | Complex return type                 | `{x: 0, y: 10, z: 0}`                                               |
| `Array`            | List of items                       | `['drone_1', 'drone_2']`                                            |
| `null`             | No value                            | `null`                                                              |

---

## Return Type Structures

### Position Object

```typescript
{
    x: number,  // X coordinate in meters
    y: number,  // Y coordinate (altitude) in meters
    z: number   // Z coordinate in meters
}
```

### Rotation Object

```typescript
{
    pitch: number,  // Pitch angle in degrees
    roll: number,   // Roll angle in degrees
    yaw: number     // Yaw heading in degrees
}
```

### Velocity Object

```typescript
{
    x: number,      // X velocity in m/s
    y: number,      // Y velocity in m/s
    z: number,      // Z velocity in m/s
    speed: number   // Total speed in m/s
}
```

### Telemetry Object

```typescript
{
    position: {x, y, z},
    rotation: {pitch, roll, yaw},
    velocity: {x, y, z, speed},
    altitude: number,  // Absolute altitude
    agl: number        // Altitude above ground
}
```

### Altitude Safety Check

```typescript
{
    isSafe: boolean,           // Is altitude safe?
    groundHeight: number,      // Ground height at position
    requestedAltitude: number, // What you asked for
    safeAltitude: number,      // Minimum safe altitude
    clearance: number          // Distance above ground
}
```

### Landing Safety Check

```typescript
{
    isSafe: boolean,        // Safe to land?
    groundHeight: number,   // Ground height
    currentAltitude: number,// Current altitude
    agl: number,            // Altitude above ground
    message: string         // Human-readable status
}
```

### Flight Path Validation

```typescript
{
    isValid: boolean,       // Is path valid?
    violations: Array<{     // List of violations
        index: number,
        position: THREE.Vector3,
        groundHeight: number,
        altitude: number,
        clearance: number
    }>,
    message: string         // Human-readable result
}
```

---

_Total Functions: 45_  
_Last Updated: 2025_
