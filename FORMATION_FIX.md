# Formation System Fix

## Changes Made

### 1. Max Drones Reduced

Changed from 7 to **5 drones** for better performance and visibility.

### 2. Dynamic Formation Assignment

**Key Feature:** Formation automatically adjusts when drones are added or removed!

#### When Adding Drones:

```
Drone 1 added → Hovers near leader
Drone 2 added → BOTH drones form formation (2-drone pattern)
Drone 3 added → ALL 3 drones adjust to 3-drone pattern
Drone 4 added → ALL 4 drones adjust to 4-drone pattern
Drone 5 added → ALL 5 drones adjust to 5-drone pattern
```

#### When Removing Drones:

```
Remove 1 drone → Remaining drones adjust formation
Remove another → Formation continues to adjust
```

### 3. Formation Patterns by Count

#### Triangle (V-Formation)

- **2 drones:** Simple V behind leader
- **3 drones:** Wider V
- **4 drones:** Two rows
- **5 drones:** Full V-formation

#### Line (Horizontal)

- **2 drones:** Side by side
- **3 drones:** Three in a row
- **4 drones:** Four in a row
- **5 drones:** Five in a row

#### Circle

- **2 drones:** Opposite sides
- **3 drones:** Triangle around leader
- **4 drones:** Square around leader
- **5 drones:** Pentagon around leader

### 4. World-Space Transformation

Fixed spawn positioning to properly transform formation offsets based on leader's rotation:

```typescript
// Transform offset to world space
const rotationMatrix = new THREE.Matrix4();
rotationMatrix.makeRotationY(leaderRot.y);
const worldOffset = offset.clone();
worldOffset.applyMatrix4(rotationMatrix);

// Spawn at correct position
const spawnPos = leaderPos.clone().add(worldOffset);
```

### 5. Automatic Reassignment

When drones are added/removed, ALL drones get new formation offsets:

```typescript
// After adding/removing
if (state.drones.size >= 2) {
  const allOffsets = generateFormationOffsets(formation, droneCount, spacing);
  drones.forEach((drone, index) => {
    drone.setFormationTarget(allOffsets[index]);
  });
}
```

## How It Works Now

### Adding Drones

1. Click "Add Drone"
2. New drone spawns at formation position
3. If count >= 2, ALL drones reassign to proper formation
4. Drones smoothly move to new positions

### Changing Formation

1. Click formation button (V/Line/Circle)
2. System calculates new offsets for current drone count
3. Each drone gets new target position
4. Drones smoothly transition to new formation

### Removing Drones

1. Click "Remove Drone"
2. Last drone is removed
3. Remaining drones (if >= 2) reassign formation
4. Formation adjusts to new count

## Expected Behavior

### ✅ Correct

- Drone 1: Hovers near leader
- Drone 2: Both form 2-drone pattern
- Drone 3: All three adjust to 3-drone pattern
- Formation change: Smooth transition
- Remove drone: Formation adjusts

### ❌ Wrong (Old Behavior)

- ~~Drones scatter when formation selected~~
- ~~Formation doesn't adjust when adding drones~~
- ~~Drones spawn in wrong positions~~

## Testing Steps

1. **Enable Fleet**
2. **Add Drone 1** → Should hover near main drone
3. **Add Drone 2** → Both should form V-formation automatically
4. **Add Drone 3** → All 3 adjust to wider V
5. **Add Drone 4** → All 4 adjust to 2-row V
6. **Add Drone 5** → All 5 form full V
7. **Click "Line"** → All smoothly move to line formation
8. **Click "Circle"** → All smoothly move to circle
9. **Click "V"** → All return to V-formation
10. **Remove Drone** → Remaining drones adjust formation

## Configuration

```typescript
// Max drones
const DEFAULT_MAX_DRONES = 5;

// Formation spacing
const SPACING = 6; // meters

// Formations
- Triangle: V-formation behind leader
- Line: Horizontal line
- Circle: Circle around leader (radius = 9m)
```

## Code Changes

### `useMultiDrone.simple.ts`

1. **Max drones:** 7 → 5
2. **addDrone():** Added automatic reassignment when count >= 2
3. **removeDrone():** Added automatic reassignment for remaining drones
4. **Spawn position:** Fixed world-space transformation

## Benefits

✅ **Automatic formation** - No manual formation selection needed  
✅ **Dynamic adjustment** - Formation scales with drone count  
✅ **Smooth transitions** - Drones move smoothly to new positions  
✅ **Proper spacing** - Drones maintain correct distances  
✅ **World-space correct** - Spawn positions respect leader rotation

## Notes

- Formation starts automatically when 2nd drone is added
- All drones maintain same altitude as leader
- Formation offsets are horizontal only (no vertical spacing)
- Spacing is 6 meters between drones
- Maximum 5 drones for optimal performance

Enjoy your dynamic drone fleet! 🚁✨
