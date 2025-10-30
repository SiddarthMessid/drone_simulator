# Ground Height Safety System

## Overview

Added comprehensive ground height checking to ensure the drone never flies below terrain level. The `takeoff()` function now automatically adjusts altitude to maintain minimum clearance above ground.

## Key Features

### 1. Automatic Takeoff Height Adjustment

```javascript
await drone.takeoff(5); // If ground is at 10m, will takeoff to 12m (10m + 2m clearance)
```

- Minimum 2m clearance above ground enforced
- Automatically adjusts requested altitude if too low
- Logs warning when adjustment occurs

### 2. Ground Height Detection

```javascript
// Private method used internally
const groundHeight = this.getGroundHeightAtPosition(position);
```

- Reads terrain heightmap from environment store
- Returns 0 if no terrain (flat ground)
- Used by all safety functions

## Safety Functions

### `checkAltitudeSafety(targetAltitude, position?)`

Validates if a target altitude is safe above ground.

**Parameters:**

- `targetAltitude` - Desired altitude in meters
- `position` - Optional position to check (defaults to current drone position)

**Returns:**

```typescript
{
  isSafe: boolean; // true if altitude >= ground + 2m
  groundHeight: number; // terrain height at position
  requestedAltitude: number; // what you asked for
  safeAltitude: number; // minimum safe altitude
  clearance: number; // distance above ground
}
```

**Example:**

```javascript
const check = drone.checkAltitudeSafety(5);
if (!check.isSafe) {
  console.warn(`Too low! Use ${check.safeAltitude}m instead`);
}
```

### `getAltitudeAGL()`

Gets current altitude above ground level.

**Returns:** `number` - Height above ground in meters

**Example:**

```javascript
const agl = drone.getAltitudeAGL();
console.log(`Flying at ${agl.toFixed(2)}m above ground`);
```

### `checkLandingSafety()`

Checks if current position is safe for landing.

**Returns:**

```typescript
{
  isSafe: boolean; // true if > 0.5m above ground
  groundHeight: number; // terrain height
  currentAltitude: number; // absolute altitude
  agl: number; // altitude above ground
  message: string; // human-readable status
}
```

**Example:**

```javascript
const landing = drone.checkLandingSafety();
console.log(landing.message); // "Safe to land (5.23m AGL)"
if (landing.isSafe) {
  await drone.land();
}
```

### `validateFlightPath(waypoints, minClearance?)`

Validates an entire flight path for ground clearance violations.

**Parameters:**

- `waypoints` - Array of THREE.Vector3 positions
- `minClearance` - Minimum clearance in meters (default: 2.0)

**Returns:**

```typescript
{
  isValid: boolean;
  violations: Array<{
    index: number;
    position: THREE.Vector3;
    groundHeight: number;
    altitude: number;
    clearance: number;
  }>;
  message: string;
}
```

**Example:**

```javascript
const waypoints = [
  new THREE.Vector3(0, 10, 0),
  new THREE.Vector3(20, 8, 20),
  new THREE.Vector3(40, 15, 40),
];

const validation = drone.validateFlightPath(waypoints, 2.0);
if (!validation.isValid) {
  console.error(`Path has ${validation.violations.length} violations`);
  validation.violations.forEach((v) => {
    console.error(`Waypoint ${v.index}: only ${v.clearance}m clearance`);
  });
}
```

## Usage Examples

### Example 1: Safe Takeoff

```javascript
// Drone will automatically adjust to safe height
await drone.takeoff(5); // Adjusted to ground + 2m if needed
console.log(`AGL: ${drone.getAltitudeAGL()}m`);
```

### Example 2: Pre-flight Check

```javascript
async function preFlight() {
  // Check if 15m is safe at current position
  const check = drone.checkAltitudeSafety(15);

  if (check.isSafe) {
    console.log("✓ Altitude is safe");
    await drone.takeoff(15);
  } else {
    console.warn(`⚠️ Use ${check.safeAltitude}m instead`);
    await drone.takeoff(check.safeAltitude);
  }
}
```

### Example 3: Terrain-Aware Mission

```javascript
async function terrainMission() {
  // Define waypoints
  const waypoints = [
    new THREE.Vector3(0, 12, 0),
    new THREE.Vector3(20, 12, 20),
    new THREE.Vector3(40, 12, 40),
  ];

  // Validate path
  const validation = drone.validateFlightPath(waypoints);

  if (!validation.isValid) {
    console.error("Flight path unsafe!");
    return;
  }

  // Execute mission
  await drone.takeoff(12);

  for (const waypoint of waypoints) {
    // Check clearance at each waypoint
    const agl = drone.getAltitudeAGL();
    console.log(`AGL: ${agl.toFixed(2)}m`);

    await new Promise((r) => setTimeout(r, 2000));
  }

  await drone.land();
}
```

### Example 4: Landing Safety Check

```javascript
async function safeLanding() {
  await drone.takeoff(20);

  // Descend gradually
  for (let alt = 20; alt >= 2; alt -= 2) {
    await drone.takeoff(alt); // Use takeoff to set altitude
    await new Promise((r) => setTimeout(r, 1000));

    // Check if safe to land
    const landing = drone.checkLandingSafety();
    console.log(landing.message);

    if (landing.agl < 3) {
      console.log("Close to ground, landing now");
      break;
    }
  }

  await drone.land();
}
```

## Technical Details

### Minimum Clearances

- **Takeoff**: 2.0m above ground
- **Landing Safety**: 0.5m above ground (warning threshold)
- **Flight Path**: 2.0m default (configurable)

### Ground Height Detection

- Uses terrain heightmap from `useEnvironment` store
- Falls back to 0m if no terrain data
- Reads from `getTerrainHeight(x, z)` function

### Integration

- Works with existing terrain system
- Compatible with `TerrainMesh` component
- Respects terrain heightmap data

## Test File

See `DRONE_SAFETY_FUNCTIONS_TEST.js` for comprehensive test examples covering:

1. Altitude safety checks
2. AGL measurements
3. Landing safety validation
4. Flight path validation
5. Automatic height adjustment
6. Terrain-aware missions

## Safety Guarantees

✅ Drone will never takeoff below ground level  
✅ Minimum 2m clearance enforced on takeoff  
✅ Ground height checked at current position  
✅ Flight paths can be pre-validated  
✅ Landing safety can be checked before descent  
✅ AGL available for real-time monitoring

## Notes

- Ground height is checked at the drone's current XZ position
- Terrain data comes from the environment store's heightmap
- All altitudes are in meters (absolute Y coordinate)
- AGL = Altitude Above Ground Level = Y position - ground height
