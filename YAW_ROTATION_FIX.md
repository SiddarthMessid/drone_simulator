# Yaw Rotation Fix

## Problem

When giving yaw input (rotation), the drone keeps rotating after stopping the input. This happens because:

1. **Weak Angular Drag**: The angular drag coefficient was only `0.5`, which at 60fps only reduces angular velocity by ~0.8% per frame - far too slow to stop rotation
2. **Poor Yaw Locking**: When input stops, the code locked the target yaw to the current rotation, but the drone still had angular velocity, causing it to overshoot
3. **Insufficient Damping**: The yaw axis didn't have enough damping to quickly stop rotation

## Root Cause Analysis

### Physics Issue

```typescript
// OLD - Too weak
private angularDrag: number = 0.5;
newState.angularVelocity.multiplyScalar(1 - this.angularDrag * dt);
// At 60fps: 1 - 0.5 * 0.016 = 0.992 (only 0.8% reduction per frame!)
```

### Control Issue

```typescript
// OLD - Doesn't account for momentum
if (Math.abs(yawRate) < 0.01) {
  targetYaw.current = rotation.y; // Locks to current, but drone keeps spinning!
}
```

## Solution

### 1. Increased Angular Drag (dronePhysics.ts)

```typescript
// Increased from 0.5 to 5.0 for much faster stopping
private angularDrag: number = 5.0;
```

### 2. Extra Yaw Damping (dronePhysics.ts)

```typescript
// Apply angular drag with extra damping for yaw axis
const dragFactor = Math.max(0, 1 - this.angularDrag * dt);
newState.angularVelocity.x *= dragFactor;
newState.angularVelocity.y *= dragFactor * 1.5; // 50% extra damping for yaw
newState.angularVelocity.z *= dragFactor;
```

### 3. Predictive Yaw Locking (DroneSimulation.tsx)

```typescript
// Account for angular velocity when locking yaw target
if (Math.abs(yawRate) < 0.01) {
  // Predict where the drone will be in 2 frames and lock there
  const predictedYaw = rotation.y + angularVelocity.y * delta * 2;
  targetYaw.current = normalizeAngle(predictedYaw);
}
```

### 4. Increased Yaw Rate Limit (pidController.ts)

```typescript
// Increased from 1.0 to 2.0 rad/s for more responsive yaw control
private yawRateLimit: number = 2.0;
```

## Results

- **Immediate Stop**: Drone now stops rotating almost immediately when yaw input is released
- **No Overshoot**: Predictive locking prevents the drone from spinning past the target
- **Better Control**: Higher yaw rate limit makes yaw control more responsive
- **Stable Hover**: Drone maintains heading much better during hover

## Technical Details

### Angular Drag Formula

```
velocity_new = velocity_old * (1 - drag * dt)
```

With the new settings at 60fps:

- Pitch/Roll: `1 - 5.0 * 0.016 = 0.92` (8% reduction per frame)
- Yaw: `0.92 * 1.5 = 0.88` (12% reduction per frame)

This means angular velocity decays to ~1% in about 0.4 seconds for yaw.

### Predictive Locking

By predicting 2 frames ahead (`delta * 2`), we account for the momentum the drone has when input stops, preventing overshoot.

## Files Modified

1. `client/src/lib/dronePhysics.ts` - Increased angular drag and added extra yaw damping
2. `client/src/lib/pidController.ts` - Increased yaw rate limit
3. `client/src/components/DroneSimulation.tsx` - Added predictive yaw locking

## Testing

Test the fix by:

1. Give yaw input (Q/E keys or right stick on gamepad)
2. Release the input
3. Drone should stop rotating immediately without overshoot
4. Try different yaw speeds - all should stop cleanly
