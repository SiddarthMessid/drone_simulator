# Quick Start - Multi-Drone Fleet

## How to Use

### 1. Enable Fleet

Click **"Enable Fleet"** button in the Fleet Control panel

### 2. Add Drones

Click **"Add Drone"** to spawn drones

- Drones spawn in V-formation behind main drone
- Each drone gets a unique color
- Maximum 7 drones

### 3. Change Formation

Click formation buttons:

- **V** - Triangle/V-formation (default)
- **Line** - Horizontal line
- **Circle** - Circle around leader

### 4. Control

- **Main drone** is the leader (controlled by you)
- **Fleet drones** automatically follow in formation
- All drones maintain same altitude as leader

### 5. Emergency Stop

Click **"Emergency Stop All"** to make all drones hover in place

## Expected Behavior

### ✅ Correct Behavior

- Drones spawn near main drone
- Drones hover stably at same altitude
- Drones follow main drone smoothly
- Formation changes are smooth
- No oscillation or jittering

### ❌ If Something's Wrong

- **Drones fly up infinitely** → Check throttle (should be ~0.5)
- **Drones fall down** → Check altitude control is active
- **Drones don't follow** → Check leader position is updating
- **Drones oscillate** → Reduce control gains

## Technical Details

### Control Loop (60 FPS)

```
1. Update leader position (main drone)
2. For each drone:
   - Calculate target position (leader + offset)
   - Calculate position error
   - Generate control setpoints
   - Update physics
   - Render
```

### Formation Offsets

- **Triangle:** Drones behind and to sides
- **Line:** Drones in horizontal line
- **Circle:** Drones in circle around leader

### Altitude

- All drones match leader altitude
- No vertical offset in formations
- Simple PD control for stability

## Tips

1. **Start small** - Add 1-2 drones first to test
2. **Move slowly** - Give drones time to catch up
3. **Watch altitude** - All drones should stay level
4. **Test formations** - Try each formation type
5. **Emergency stop** - Use if drones misbehave

## Parameters

Default settings (in code):

- Formation spacing: 6 meters
- Max speed: 5 m/s
- Max tilt: 17 degrees
- Hover throttle: 50%

## Troubleshooting

### Problem: Drones spawn but immediately fly away

**Solution:** Check spawn position calculation and initial state

### Problem: Drones don't maintain formation

**Solution:** Verify leader position is being updated every frame

### Problem: Drones are too aggressive/oscillate

**Solution:** Reduce control gains (kp_position, kv_velocity)

### Problem: Drones are too slow to respond

**Solution:** Increase control gains slightly

## Code Structure

```
useMultiDrone.simple.ts
  ├─ State management
  ├─ Add/remove drones
  └─ Formation control

droneController.simple.ts
  ├─ Formation following logic
  ├─ Altitude control
  └─ Position control

DroneFlock.simple.tsx
  ├─ Render drones
  ├─ Update physics
  └─ Handle collisions

MultiDroneController.simple.tsx
  └─ UI controls
```

## Next Steps

Once basic fleet works:

1. Try different formations
2. Add more drones (up to 7)
3. Fly around and test following
4. Test in different environments

Enjoy your drone fleet! 🚁🚁🚁
