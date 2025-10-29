# Drone Position Hold Tuning Guide

## Overview

Position hold uses PD (Proportional-Derivative) controllers for both altitude and position control. This guide will help you tune them for optimal performance.

## Location of Tuning Parameters

**File:** `client/src/lib/droneController.ts`
**Method:** `calculateAutopilotSetpoints()`

### Altitude Control Parameters (Lines ~430-440)

```typescript
const kp_altitude = 0.3; // Proportional gain
const kd_altitude = 0.5; // Derivative gain
const hoverThrottle = 0.5; // Baseline hover throttle
```

### Position Control Parameters (Lines ~445-465)

```typescript
const kp_position = 0.15; // Proportional gain
const kd_position = 0.1; // Derivative damping
const maxTilt = 0.2; // Maximum tilt angle (radians)
```

---

## Altitude Control Tuning

### Step 1: Tune Hover Throttle

**Goal:** Find the throttle value where drone hovers without climbing or descending.

1. Set `kp_altitude = 0` and `kd_altitude = 0` temporarily
2. Adjust `hoverThrottle` in small steps (0.05)
3. Test: Drone should hover at constant altitude
4. **Typical range:** 0.4 - 0.6

**Signs:**

- Too low: Drone slowly descends
- Too high: Drone slowly climbs
- Just right: Stable altitude (±0.1m)

### Step 2: Tune Proportional Gain (Kp)

**Goal:** Make drone respond to altitude errors.

1. Start with `kp_altitude = 0.1`
2. Increase in steps of 0.1
3. Test: Release throttle and observe

**Signs:**

- Too low: Slow response, takes long to reach target
- Too high: Oscillates up and down
- Just right: Reaches target smoothly in 2-3 seconds

**Typical range:** 0.2 - 0.5

### Step 3: Tune Derivative Gain (Kd)

**Goal:** Dampen oscillations and smooth the response.

1. Start with `kd_altitude = 0.3`
2. Increase in steps of 0.1
3. Test: Should reduce oscillations

**Signs:**

- Too low: Oscillates, overshoots target
- Too high: Sluggish, takes forever to settle
- Just right: Smooth approach, minimal overshoot

**Typical range:** 0.3 - 0.7

---

## Position Control Tuning

### Step 1: Tune Proportional Gain (Kp)

**Goal:** Make drone move toward target position.

1. Start with `kp_position = 0.1`
2. Increase in steps of 0.05
3. Test: Drone should move to hold position

**Signs:**

- Too low: Drifts away, doesn't hold position
- Too high: Oscillates back and forth
- Just right: Holds position within 0.5m

**Typical range:** 0.1 - 0.3

### Step 2: Tune Derivative Gain (Kd)

**Goal:** Dampen horizontal oscillations.

1. Start with `kd_position = 0.05`
2. Increase in steps of 0.05
3. Test: Should reduce swaying

**Signs:**

- Too low: Sways back and forth
- Too high: Sluggish corrections
- Just right: Smooth, stable hover

**Typical range:** 0.05 - 0.15

### Step 3: Tune Max Tilt

**Goal:** Limit how aggressively drone tilts.

1. Start with `maxTilt = 0.2` (11 degrees)
2. Adjust in steps of 0.05
3. Test: Observe tilt during corrections

**Signs:**

- Too low: Slow corrections, drifts easily
- Too high: Aggressive, unstable
- Just right: Smooth, controlled movements

**Typical range:** 0.15 - 0.3 (8-17 degrees)

---

## Tuning Process (Step by Step)

### Phase 1: Altitude Only

1. Disable position hold temporarily
2. Tune hover throttle first
3. Tune altitude Kp
4. Tune altitude Kd
5. Test: Drone should hold altitude rock-solid

### Phase 2: Position Hold

1. Enable position hold
2. Tune position Kp
3. Tune position Kd
4. Tune max tilt
5. Test: Drone should hold position without drift

### Phase 3: Fine Tuning

1. Test in different conditions (wind, terrain)
2. Make small adjustments (±0.05)
3. Find the sweet spot

---

## Common Issues & Solutions

### Issue: Drone drops 2-3m when releasing throttle

**Cause:** Hover throttle too low or Kp too low
**Solution:**

- Increase `hoverThrottle` by 0.05
- Increase `kp_altitude` by 0.1

### Issue: Oscillates up and down continuously

**Cause:** Kp too high or Kd too low
**Solution:**

- Decrease `kp_altitude` by 0.1
- Increase `kd_altitude` by 0.1

### Issue: Drifts horizontally, doesn't hold position

**Cause:** Position Kp too low
**Solution:**

- Increase `kp_position` by 0.05

### Issue: Sways back and forth horizontally

**Cause:** Position Kp too high or Kd too low
**Solution:**

- Decrease `kp_position` by 0.05
- Increase `kd_position` by 0.05

### Issue: Slow to respond, takes forever to stabilize

**Cause:** Kd too high
**Solution:**

- Decrease both Kd values by 0.1

---

## Current Settings (Calibrated)

```typescript
// Altitude Control
kp_altitude = 0.3
kd_altitude = 0.5
hoverThrottle = 0.4  // Calibrated: 40% throttle holds altitude

// Position Control
kp_position = 0.15
kd_position = 0.1
maxTilt = 0.2 (11 degrees)
```

**Note:** Hover throttle has been calibrated to 0.4 (40%) for this specific drone. This is the throttle value that maintains altitude without climbing or descending.

---

## Advanced: Understanding PD Control

### Proportional (P) Term

- **What it does:** Pushes toward target
- **Formula:** `P = Kp * error`
- **Effect:** Larger error = stronger correction

### Derivative (D) Term

- **What it does:** Resists fast changes
- **Formula:** `D = -Kd * velocity`
- **Effect:** Moving fast = apply brakes

### Combined PD Output

```
output = Kp * error - Kd * velocity
```

**Example (Altitude):**

- Error = 2m (too low)
- Velocity = -1 m/s (falling)
- Kp = 0.3, Kd = 0.5

```
correction = (0.3 * 2) - (0.5 * -1)
          = 0.6 + 0.5
          = 1.1
throttle = 0.5 + 1.1 = 1.0 (max)
```

Result: Strong upward thrust to stop fall and climb back.

---

## Quick Reference Table

| Symptom                        | Likely Cause            | Adjustment  |
| ------------------------------ | ----------------------- | ----------- |
| Drops when releasing throttle  | Hover throttle too low  | +0.05 hover |
| Climbs when releasing throttle | Hover throttle too high | -0.05 hover |
| Slow altitude response         | Kp too low              | +0.1 Kp     |
| Altitude oscillation           | Kp too high             | -0.1 Kp     |
| Bouncy, overshoots             | Kd too low              | +0.1 Kd     |
| Sluggish settling              | Kd too high             | -0.1 Kd     |
| Drifts horizontally            | Position Kp too low     | +0.05 Kp    |
| Horizontal oscillation         | Position Kp too high    | -0.05 Kp    |
| Sways side to side             | Position Kd too low     | +0.05 Kd    |

---

## Testing Checklist

- [ ] Hover throttle: Drone maintains altitude with no input
- [ ] Altitude response: Reaches target in 2-3 seconds
- [ ] Altitude stability: No oscillation (±0.2m max)
- [ ] Position hold: Stays within 0.5m of target
- [ ] No horizontal drift: Minimal swaying
- [ ] Smooth transitions: No jerky movements
- [ ] Wind resistance: Holds position in light wind

---

## Pro Tips

1. **Tune one parameter at a time** - Don't change multiple values
2. **Make small changes** - 0.05-0.1 increments
3. **Test thoroughly** - Try different altitudes and positions
4. **Document your changes** - Keep notes on what works
5. **Start conservative** - It's easier to increase than decrease
6. **Be patient** - Good tuning takes time

---

## Need Help?

If you're still having issues after tuning:

1. Check the console for error messages
2. Verify terrain collision is working
3. Test in flat terrain first
4. Disable wind temporarily
5. Check if PID parameters are being applied correctly

Good luck with your tuning! 🚁
