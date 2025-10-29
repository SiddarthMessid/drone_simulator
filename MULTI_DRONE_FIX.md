# Multi-Drone Fleet Fix

## Problem

When adding drones to the fleet, they would fly away instead of maintaining formation with the leader drone.

## Root Causes Identified

### 1. **Incorrect Spawn Position Calculation**

- Drones were being added to the store before calculating their formation offset
- The formation offset calculation was happening after the drone count changed
- This caused misalignment between the intended position and actual spawn location

### 2. **Altitude Control Issues**

- Formation target altitude was using `targetWorld.y` which could be arbitrary
- Should follow the leader's altitude instead of using formation offset Y component
- Minimum altitude was too low (0.5m) causing ground collisions

### 3. **Missing State Validation**

- Formation setpoints calculation didn't check if state was valid
- Could cause null reference errors during initialization

## Fixes Applied

### Fix 1: Improved Spawn Position Logic (`useMultiDrone.ts`)

**Before:**

```typescript
// Added drone to store first, then calculated offsets
state.drones.set(id, controller);
const followerCount = state.drones.size - (leaderInFleet ? 1 : 0);
const offsets = generateFormationOffsets(
  "triangle",
  Math.max(0, followerCount),
  spacing
);
```

**After:**

```typescript
// Calculate offsets BEFORE adding to store
const followerCount = state.drones.size + 1 - (leaderInFleet ? 1 : 0);
const offsets = generateFormationOffsets(
  "triangle",
  Math.max(0, followerCount),
  spacing
);

// Get the specific offset for the new drone
const newDroneOffset =
  offsets[followerCount - 1] ||
  new THREE.Vector3(0, 0, -followerCount * spacing);

// Transform to world space
const rotationMatrix = new THREE.Matrix4();
rotationMatrix.makeRotationY(leaderRot.y);
const worldOffset = newDroneOffset.clone();
worldOffset.applyMatrix4(rotationMatrix);

// Calculate spawn position
const spawnPosition = leaderPos.clone().add(worldOffset);
spawnPosition.y = Math.max(5, leaderPos.y); // Ensure safe altitude

// Initialize drone at correct position
controller.updateState(initialState);
controller.setFormationTarget(newDroneOffset);
```

**Benefits:**

- Drones spawn at their intended formation position
- No large initial transients
- Proper world-space transformation applied
- Safe minimum altitude (5m)

### Fix 2: Altitude Following (`droneController.new.ts`)

**Before:**

```typescript
// Clamp target altitude to config limits
targetWorld.y = Math.max(0.5, Math.min(this.config.maxAltitude, targetWorld.y));
```

**After:**

```typescript
// Keep target altitude close to leader altitude (formation offsets are relative)
targetWorld.y = Math.max(
  0.5,
  Math.min(this.config.maxAltitude, this.leaderPosition.y)
);
```

**Benefits:**

- Drones maintain the same altitude as the leader
- Formation offsets are purely horizontal (X, Z)
- Prevents drones from flying too high or too low

### Fix 3: State Validation

**Before:**

```typescript
if (this.altitudeTarget !== null && this.state) {
  // ... altitude control
}
```

**After:**

```typescript
// Safety check: ensure we have valid state
if (!this.state) {
  return setpoints;
}

if (this.altitudeTarget !== null) {
  // ... altitude control
}
```

**Benefits:**

- Prevents null reference errors
- Returns safe default setpoints if state is invalid
- More robust initialization

### Fix 4: Position Hold Altitude

**Before:**

```typescript
targetWorld.y = Math.max(0.5, Math.min(this.config.maxAltitude, targetWorld.y));
```

**After:**

```typescript
targetWorld.y = Math.max(1.0, Math.min(this.config.maxAltitude, targetWorld.y));
```

**Benefits:**

- Higher minimum altitude (1m instead of 0.5m)
- Reduces ground collision risk
- More stable hovering

## Testing Recommendations

1. **Add Single Drone**

   - Add one drone and verify it spawns near the leader
   - Check that it maintains formation as the leader moves

2. **Add Multiple Drones**

   - Add 3-5 drones sequentially
   - Verify each spawns at the correct formation position
   - Check that existing drones maintain their positions

3. **Formation Changes**

   - Switch between triangle, line, and circle formations
   - Verify smooth transitions
   - Check altitude is maintained

4. **Leader Movement**

   - Move the leader drone around
   - Verify followers maintain formation
   - Check altitude tracking

5. **Position Hold**
   - Enable position hold on a follower
   - Verify it stays in place
   - Check altitude is maintained

## Key Improvements

✅ **Correct spawn positioning** - Drones appear at their intended formation location
✅ **Altitude following** - Drones maintain leader's altitude
✅ **State validation** - Robust error handling during initialization
✅ **Safe minimum altitude** - Prevents ground collisions
✅ **Proper world-space transforms** - Formation offsets correctly rotated

## Configuration

Current formation settings:

- **Spacing**: 5 meters between drones
- **Default formation**: Triangle (V-formation)
- **Min altitude**: 5m for spawn, 1m for position hold
- **Max altitude**: 50m (configurable)

## Notes

- Formation offsets are relative to the leader in local space
- World-space transformation uses leader's yaw rotation
- Altitude is always taken from leader position, not formation offset
- Each drone has independent physics and PID controllers
- Position updates are synchronized every frame via `updateMainDroneFormation()`
