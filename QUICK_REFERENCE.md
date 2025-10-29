# Drone Control Quick Reference

## Control Modes

### 🎮 Manual Mode (Default)

**Direct control - you fly the drone**

- No automatic stabilization
- Immediate response to inputs
- More challenging, more rewarding
- Best for: Racing, acrobatics, learning

**How to use**:

- Fly with WASD or gamepad
- You must actively stabilize
- Drone responds instantly to inputs

### 🤖 Autopilot Mode

**Computer-assisted flight**

- Automatic stabilization
- Position and altitude hold
- Smooth, stable flight
- Best for: Missions, surveys, precision

**How to activate**:

- Enable "Position Hold" in Control Panel
- Or use drone commands (takeoff, moveTo, etc.)
- Drone maintains position automatically

## Keyboard Controls

### Movement

- `W` - Pitch forward
- `S` - Pitch backward
- `A` - Roll left
- `D` - Roll right

### Altitude

- `Space` - Throttle up
- `Shift` - Throttle down

### Rotation

- `Q` - Yaw left (rotate counter-clockwise)
- `E` - Yaw right (rotate clockwise)

## Gamepad Controls (Xbox Layout)

### Left Stick

- Left/Right - Roll
- Up/Down - Pitch

### Right Stick

- Left/Right - Yaw
- Up/Down - Throttle

### Buttons

- `A` - Takeoff to 8m
- `B` - Land
- `X` - Hover (enable autopilot)
- `Y` - Toggle manual/autopilot
- `LB` - Reduce altitude
- `RB` - Increase altitude

### Triggers

- `LT` - Fine control (30% sensitivity)
- `RT` - Boost (180% sensitivity)

## Drone Commands (Code Editor)

### Basic Commands

```javascript
await drone.takeoff(10); // Takeoff to 10m
await drone.land(); // Land
await drone.hover(); // Hover in place
```

### Movement

```javascript
await drone.moveTo(new THREE.Vector3(10, 15, 20));
await drone.dir(0, 0, 0, 10, 15, 20); // From → To
```

### Attitude Control

```javascript
await drone.setPitch(15); // Degrees
await drone.setRoll(-10); // Degrees
await drone.setYaw(90); // Degrees
await drone.setThrottle(60); // Percentage
```

### Mode Control

```javascript
drone.enableManualControl(); // Switch to manual
drone.isAutopilotActive(); // Check mode
```

## PID Tuning (Code Editor)

```python
def get_pid_parameters():
    """
    Tune PID parameters for autopilot mode
    kp: Proportional gain (responsiveness)
    ki: Integral gain (steady-state error)
    kd: Derivative gain (damping)
    """
    return {
        'pitch': {'kp': 2.0, 'ki': 0.1, 'kd': 0.5},
        'roll':  {'kp': 2.0, 'ki': 0.1, 'kd': 0.5},
        'yaw':   {'kp': 1.5, 'ki': 0.05, 'kd': 0.3},
        'altitude': {'kp': 3.0, 'ki': 0.2, 'kd': 1.0}
    }
```

## Tips & Tricks

### Manual Flying

1. **Start gentle** - Small inputs first
2. **Look ahead** - Anticipate movements
3. **Practice hovering** - Master stability first
4. **Use throttle** - Maintain altitude actively
5. **Smooth inputs** - Avoid jerky movements

### Autopilot Flying

1. **Enable position hold** - Let computer stabilize
2. **Use waypoints** - Plan routes in advance
3. **Adjust PID** - Tune for your flying style
4. **Monitor telemetry** - Watch altitude and speed
5. **Trust the system** - Let autopilot do its job

### Yaw Control

1. **Short bursts** - Tap Q/E for small rotations
2. **Release cleanly** - Drone stops immediately
3. **No overshoot** - Predictive locking prevents spin
4. **Smooth rotation** - Hold for continuous turn
5. **Emergency reset** - Hold all direction keys to reset yaw

### Troubleshooting

**Drone won't hover in manual mode**

- This is normal! Manual mode requires active piloting
- Enable position hold for automatic hovering

**Drone drifts in autopilot mode**

- Check PID parameters
- Increase kp for faster correction
- Increase kd for more damping

**Controls feel laggy**

- Make sure you're in manual mode
- Autopilot mode has intentional smoothing

**Yaw keeps spinning**

- This should be fixed now!
- If still happening, check angular drag settings

**Drone falls when switching to manual**

- Increase throttle immediately
- Manual mode has no altitude hold

## Camera Modes

### Follow Camera (Default)

- Follows drone from behind
- Good for general flying
- Smooth camera movement

### FPV Camera

- First-person view
- Mounted on drone
- Tilts with drone
- Best for racing

### Top View

- Bird's eye view
- Good for mission planning
- Shows full area

### Manual Camera

- Free camera control
- Right-click to rotate
- Left-click to pan
- Scroll to zoom

## Performance Tips

1. **Reduce console logging** - Comment out debug logs
2. **Lower graphics** - If experiencing lag
3. **Close other apps** - Free up CPU/GPU
4. **Use manual mode** - Less CPU than autopilot
5. **Limit wind sources** - Reduce physics calculations

## Common Mistakes

❌ **Forgetting to enable position hold for autopilot commands**
✅ Enable position hold before using drone commands

❌ **Expecting manual mode to hover automatically**
✅ Manual mode requires active throttle control

❌ **Using autopilot for acrobatic flying**
✅ Use manual mode for dynamic maneuvers

❌ **Not accounting for wind**
✅ Wind affects drone - compensate with controls

❌ **Ignoring telemetry**
✅ Monitor altitude, speed, and battery

## Advanced Techniques

### Orbit

```javascript
// Circle around a point
for (let angle = 0; angle < 360; angle += 10) {
  const rad = (angle * Math.PI) / 180;
  const x = centerX + radius * Math.cos(rad);
  const z = centerZ + radius * Math.sin(rad);
  await drone.moveTo(new THREE.Vector3(x, altitude, z));
  await drone.setYaw(angle + 90); // Face tangent
}
```

### Figure-8

```javascript
// Fly figure-8 pattern
const points = [];
for (let t = 0; t < 2 * Math.PI; t += 0.1) {
  const x = 10 * Math.sin(t);
  const z = 10 * Math.sin(t) * Math.cos(t);
  points.push(new THREE.Vector3(x, 15, z));
}
for (const point of points) {
  await drone.moveTo(point);
}
```

### Spiral Ascent

```javascript
// Spiral up while rotating
for (let i = 0; i < 20; i++) {
  const angle = i * 18; // 18° per step
  const rad = (angle * Math.PI) / 180;
  const x = 5 * Math.cos(rad);
  const z = 5 * Math.sin(rad);
  const y = 5 + i * 0.5; // Rise 0.5m per step
  await drone.moveTo(new THREE.Vector3(x, y, z));
  await drone.setYaw(angle);
}
```

## Resources

- **Documentation**: See IMPROVEMENTS_SUMMARY.md for technical details
- **Fixes**: See DRONE_CONTROL_FIXES.md for bug fixes
- **Physics**: Check dronePhysics.ts for physics parameters
- **PID**: Check codeCompiler.ts for default PID values

## Support

If you encounter issues:

1. Check console for error messages
2. Verify control mode (manual vs autopilot)
3. Reset drone position if stuck
4. Reload page to reset everything
5. Check that position hold is enabled for autopilot

---

**Happy Flying! 🚁**
