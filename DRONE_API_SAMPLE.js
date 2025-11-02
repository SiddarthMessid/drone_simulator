// ============================================
// DRONE API SAMPLE CODE
// ============================================
// This file contains sample code to test the custom drone wrapper library
// Copy and paste these examples into the code editor in the simulator

// ============================================
// EXAMPLE 1: Simple Takeoff and Land
// ============================================
async function simpleMission() {
  console.log("Starting simple mission...");

  // Take off to 10 meters
  await drone.takeoff(10);
  console.log("Takeoff complete!");

  // Hover for 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log("Hovering...");

  // Land
  await drone.land();
  console.log("Landing complete!");
}

// Run the mission
simpleMission();


// ============================================
// EXAMPLE 2: Fly to Specific Position
// ============================================
async function flyToPosition() {
  console.log("Flying to specific position...");

  // Take off
  await drone.takeoff(15);

  // Fly to position (x: 20, y: 15, z: 30)
  const targetPos = new THREE.Vector3(20, 15, 30);
  await drone.moveTo(targetPos);
  console.log("Reached target position!");

  // Hover for 2 seconds
  await drone.hover();
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Return to origin
  const origin = new THREE.Vector3(0, 15, 0);
  await drone.moveTo(origin);
  console.log("Returned to origin!");

  // Land
  await drone.land();
}

// Run the mission
flyToPosition();


// ============================================
// EXAMPLE 3: Square Pattern Flight
// ============================================
async function flySquarePattern() {
  console.log("Flying square pattern...");

  // Take off
  await drone.takeoff(12);

  // Define square corners (20m x 20m square)
  const corners = [
    new THREE.Vector3(10, 12, 10),   // Corner 1
    new THREE.Vector3(10, 12, -10),  // Corner 2
    new THREE.Vector3(-10, 12, -10), // Corner 3
    new THREE.Vector3(-10, 12, 10),  // Corner 4
    new THREE.Vector3(0, 12, 0)      // Back to center
  ];

  // Fly to each corner
  for (let i = 0; i < corners.length; i++) {
    console.log(`Flying to corner ${i + 1}...`);
    await drone.moveTo(corners[i]);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("Square pattern complete!");

  // Land
  await drone.land();
}

// Run the mission
flySquarePattern();


// ============================================
// EXAMPLE 4: Angle Control (Pitch, Roll, Yaw)
// ============================================
async function testAngleControl() {
  console.log("Testing angle control...");

  // Take off
  await drone.takeoff(10);

  // Set pitch to 15 degrees
  console.log("Setting pitch to 15 degrees");
  await drone.setPitch(15);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Reset pitch
  await drone.setPitch(0);

  // Set roll to -10 degrees
  console.log("Setting roll to -10 degrees");
  await drone.setRoll(-10);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Reset roll
  await drone.setRoll(0);

  // Rotate yaw 90 degrees
  console.log("Rotating yaw 90 degrees");
  await drone.setYaw(90);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Land
  await drone.land();
}

// Run the mission
testAngleControl();


// ============================================
// EXAMPLE 5: Complex Mission with Multiple Waypoints
// ============================================
async function complexMission() {
  console.log("Starting complex mission...");

  try {
    // Take off to 20 meters
    await drone.takeoff(20);
    console.log("✓ Takeoff complete");

    // Waypoint 1: Fly forward
    await drone.moveTo(new THREE.Vector3(0, 20, 30));
    console.log("✓ Reached waypoint 1");

    // Waypoint 2: Fly right
    await drone.moveTo(new THREE.Vector3(30, 20, 30));
    console.log("✓ Reached waypoint 2");

    // Waypoint 3: Fly back
    await drone.moveTo(new THREE.Vector3(30, 20, 0));
    console.log("✓ Reached waypoint 3");

    // Waypoint 4: Return to start
    await drone.moveTo(new THREE.Vector3(0, 20, 0));
    console.log("✓ Reached waypoint 4");

    // Hover for 3 seconds
    await drone.hover();
    console.log("Hovering at final position...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Land
    await drone.land();
    console.log("✓ Mission complete!");

  } catch (error) {
    console.error("Mission failed:", error);
  }
}

// Run the mission
complexMission();


// ============================================
// EXAMPLE 6: Using dir() Method (Direction-based Movement)
// ============================================
async function testDirectionMovement() {
  console.log("Testing direction-based movement...");

  // Take off
  await drone.takeoff(15);

  // Move from current position to (10, 15, 10)
  // dir(fromX, fromY, fromZ, toX, toY, toZ)
  await drone.dir(0, 15, 0, 10, 15, 10);
  console.log("Moved to first position");

  // Move to another position
  await drone.dir(10, 15, 10, -10, 15, -10);
  console.log("Moved to second position");

  // Return to origin
  await drone.dir(-10, 15, -10, 0, 15, 0);
  console.log("Returned to origin");

  // Land
  await drone.land();
}

// Run the mission
testDirectionMovement();


// ============================================
// EXAMPLE 7: Throttle Control
// ============================================
async function testThrottleControl() {
  console.log("Testing throttle control...");

  // Take off
  await drone.takeoff(5);

  // Set throttle to 80% (climb)
  console.log("Climbing with 80% throttle");
  await drone.setThrottle(80);
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Set throttle to 40% (hover)
  console.log("Hovering with 40% throttle");
  await drone.setThrottle(40);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Set throttle to 20% (descend slowly)
  console.log("Descending with 20% throttle");
  await drone.setThrottle(20);
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Land
  await drone.land();
}

// Run the mission
testThrottleControl();


// ============================================
// EXAMPLE 8: Swarm/Fleet Control
// ============================================
async function testSwarmControl() {
  console.log("Testing swarm control...");

  // Enable swarm mode
  drone.swarm.enable();
  console.log("Swarm mode enabled");

  // Add 4 drones to the fleet
  for (let i = 0; i < 4; i++) {
    drone.swarm.addDrone();
    console.log(`Added drone ${i + 1}`);
  }

  // Check drone count
  console.log(`Total drones in swarm: ${drone.swarm.count()}`);

  // Set circle formation
  drone.swarm.form('circle');
  console.log("Formation set to circle");
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Change to line formation
  drone.swarm.form('line');
  console.log("Formation changed to line");
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Change to V formation
  drone.swarm.form('V');
  console.log("Formation changed to V");
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Execute follow behavior
  await drone.swarm.behavior('follow');
  console.log("Swarm following leader");

  // Get all drone IDs
  const droneIds = drone.swarm.getDroneIds();
  console.log("Drone IDs:", droneIds);

  // Emergency land all drones
  await drone.swarm.emergencyLandAll();
  console.log("All drones landed");

  // Disable swarm mode
  drone.swarm.disable();
  console.log("Swarm mode disabled");
}

// Run the mission
testSwarmControl();


// ============================================
// EXAMPLE 9: Telemetry and Status Checks
// ============================================
async function testTelemetry() {
  console.log("Testing telemetry functions...");

  // Take off
  await drone.takeoff(15);

  // Get position
  const pos = drone.getPosition();
  console.log(`Position: X=${pos.x.toFixed(2)}, Y=${pos.y.toFixed(2)}, Z=${pos.z.toFixed(2)}`);

  // Get rotation
  const rot = drone.getRotation();
  console.log(`Rotation: Pitch=${rot.pitch.toFixed(2)}°, Roll=${rot.roll.toFixed(2)}°, Yaw=${rot.yaw.toFixed(2)}°`);

  // Get velocity
  const vel = drone.getVelocity();
  console.log(`Velocity: X=${vel.x.toFixed(2)}, Y=${vel.y.toFixed(2)}, Z=${vel.z.toFixed(2)}, Speed=${vel.speed.toFixed(2)} m/s`);

  // Get complete telemetry
  const telemetry = drone.getTelemetry();
  console.log("Complete telemetry:", telemetry);

  // Check if flying
  console.log(`Is flying: ${drone.isFlying()}`);

  // Check if stable
  console.log(`Is stable: ${drone.isStable()}`);

  // Check autopilot status
  console.log(`Autopilot active: ${drone.isAutopilotActive()}`);

  // Get altitude above ground
  const agl = drone.getAltitudeAGL();
  console.log(`Altitude above ground: ${agl.toFixed(2)}m`);

  // Land
  await drone.land();
}

// Run the mission
testTelemetry();


// ============================================
// EXAMPLE 10: Safety Checks
// ============================================
async function testSafetyChecks() {
  console.log("Testing safety checks...");

  // Check altitude safety before takeoff
  const targetAltitude = 20;
  const safetyCheck = drone.checkAltitudeSafety(targetAltitude);
  console.log(`Altitude safety check:`, safetyCheck);

  if (safetyCheck.isSafe) {
    await drone.takeoff(safetyCheck.safeAltitude);
    console.log(`Took off to safe altitude: ${safetyCheck.safeAltitude}m`);
  }

  // Check landing safety
  const landingSafety = drone.checkLandingSafety();
  console.log(`Landing safety:`, landingSafety);

  // Validate flight path
  const waypoints = [
    new THREE.Vector3(10, 15, 10),
    new THREE.Vector3(20, 15, 20),
    new THREE.Vector3(30, 15, 30)
  ];

  const pathValidation = drone.validateFlightPath(waypoints);
  console.log(`Flight path validation:`, pathValidation);

  if (pathValidation.isValid) {
    console.log("Flight path is safe!");
  } else {
    console.log("Flight path has violations:", pathValidation.violations);
  }

  // Land
  await drone.land();
}

// Run the mission
testSafetyChecks();


// ============================================
// EXAMPLE 11: Wait Functions
// ============================================
async function testWaitFunctions() {
  console.log("Testing wait functions...");

  // Take off
  await drone.takeoff(10);

  // Wait for drone to stabilize
  console.log("Waiting for drone to stabilize...");
  const isStable = await drone.waitForStable(10, 0.5);
  if (isStable) {
    console.log("Drone is stable!");
  } else {
    console.log("Timeout waiting for stability");
  }

  // Move to new altitude
  await drone.moveTo(new THREE.Vector3(0, 20, 0));

  // Wait for altitude
  console.log("Waiting to reach altitude...");
  const reachedAltitude = await drone.waitForAltitude(20, 0.5, 15);
  if (reachedAltitude) {
    console.log("Reached target altitude!");
  } else {
    console.log("Timeout waiting for altitude");
  }

  // Use delay function
  console.log("Waiting 3 seconds...");
  await drone.delay(3);
  console.log("Delay complete!");

  // Land
  await drone.land();
}

// Run the mission
testWaitFunctions();


// ============================================
// EXAMPLE 12: Brake Function
// ============================================
async function testBrake() {
  console.log("Testing brake function...");

  // Take off
  await drone.takeoff(15);

  // Move forward with speed
  await drone.moveTo(new THREE.Vector3(0, 15, 50));

  // Emergency brake
  console.log("Applying brake!");
  await drone.brake();
  console.log("Brake complete - drone stopped");

  // Hover for a moment
  await drone.hover();
  await drone.delay(2);

  // Land
  await drone.land();
}

// Run the mission
testBrake();


// ============================================
// AVAILABLE DRONE API METHODS:
// ============================================
/*
BASIC FLIGHT:
- drone.takeoff(altitude) - Takes off to specified altitude
- drone.land() - Lands the drone
- drone.hover() - Hovers at current position
- drone.brake() - Emergency brake to stop movement
- drone.moveTo(position, options) - Moves to target position
- drone.dir(fromX, fromY, fromZ, toX, toY, toZ) - Direction-based movement
- drone.setPitch(degrees) - Sets pitch angle
- drone.setRoll(degrees) - Sets roll angle
- drone.setYaw(degrees) - Sets yaw heading
- drone.setThrottle(percentage) - Sets throttle (0-100%)

TELEMETRY:
- drone.getPosition() - Returns {x, y, z}
- drone.getRotation() - Returns {pitch, roll, yaw} in degrees
- drone.getVelocity() - Returns {x, y, z, speed}
- drone.getTelemetry() - Returns complete telemetry data
- drone.getAltitudeAGL() - Returns altitude above ground level

STATUS:
- drone.isFlying() - Returns true if airborne
- drone.isStable(threshold) - Returns true if velocity below threshold
- drone.isAutopilotActive() - Returns true if autopilot engaged
- drone.getCurrentCommand() - Returns current command or null

SAFETY:
- drone.checkAltitudeSafety(altitude, position) - Validates altitude safety
- drone.checkLandingSafety() - Checks if safe to land
- drone.validateFlightPath(waypoints, minClearance) - Validates flight path
- drone.getGroundHeight(x, z) - Returns ground height at coordinates

CONTROL:
- drone.enableManualControl() - Returns to manual mode
- drone.cancelCurrentCommand() - Cancels current command
- drone.emergencyStop() - Emergency stop all operations
- drone.enableAltitudeHold() - Enables altitude hold mode
- drone.disableAltitudeHold() - Disables altitude hold mode
- drone.toggleAltitudeHold() - Toggles altitude hold

UTILITIES:
- drone.delay(seconds) - Waits for specified seconds
- drone.waitForStable(timeout, threshold) - Waits until stable
- drone.waitForAltitude(altitude, tolerance, timeout) - Waits for altitude
- drone.createPosition(x, y, z) - Creates THREE.Vector3 position

SWARM CONTROL:
- drone.swarm.enable() - Enables swarm mode
- drone.swarm.disable() - Disables swarm mode
- drone.swarm.isEnabled() - Returns true if swarm enabled
- drone.swarm.addDrone() - Adds new drone to swarm
- drone.swarm.removeDrone(id) - Removes drone from swarm
- drone.swarm.count() - Returns number of drones
- drone.swarm.form(formation) - Sets formation ('V', 'line', 'circle')
- drone.swarm.behavior(behavior) - Executes behavior ('follow', 'scatter', 'gather')
- drone.swarm.emergencyLandAll() - Emergency lands all drones
- drone.swarm.getDroneIds() - Returns array of drone IDs
- drone.swarm.setLeader(id) - Sets swarm leader
- drone.swarm.getLeader() - Returns leader ID

HELPERS:
- THREE.Vector3(x, y, z) - Creates 3D position vector
- new Promise(resolve => setTimeout(resolve, ms)) - Delay in milliseconds
*/
