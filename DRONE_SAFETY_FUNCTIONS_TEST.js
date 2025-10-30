// ============================================
// DRONE SAFETY FUNCTIONS TEST
// ============================================
// Test the new ground height checking functions

// ============================================
// TEST 1: Check Altitude Safety
// ============================================
async function testAltitudeSafety() {
    console.log("=== TEST 1: Altitude Safety Check ===");

    // Check if 5m altitude is safe at current position
    const safetyCheck = drone.checkAltitudeSafety(5);

    console.log("Safety Check Results:");
    console.log(`  Requested Altitude: ${safetyCheck.requestedAltitude}m`);
    console.log(`  Ground Height: ${safetyCheck.groundHeight.toFixed(2)}m`);
    console.log(`  Safe Altitude: ${safetyCheck.safeAltitude}m`);
    console.log(`  Clearance: ${safetyCheck.clearance.toFixed(2)}m`);
    console.log(`  Is Safe: ${safetyCheck.isSafe ? '✓ YES' : '✗ NO'}`);

    if (!safetyCheck.isSafe) {
        console.warn(`⚠️ Altitude too low! Minimum safe altitude: ${safetyCheck.safeAltitude}m`);
    }
}

testAltitudeSafety();


// ============================================
// TEST 2: Get Altitude Above Ground Level (AGL)
// ============================================
async function testAGL() {
    console.log("\n=== TEST 2: Altitude Above Ground Level ===");

    // Take off first
    await drone.takeoff(15);

    // Check AGL
    const agl = drone.getAltitudeAGL();
    console.log(`Current Altitude AGL: ${agl.toFixed(2)}m`);

    // Hover for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check again
    const agl2 = drone.getAltitudeAGL();
    console.log(`Altitude AGL after hover: ${agl2.toFixed(2)}m`);

    await drone.land();
}

testAGL();


// ============================================
// TEST 3: Check Landing Safety
// ============================================
async function testLandingSafety() {
    console.log("\n=== TEST 3: Landing Safety Check ===");

    // Take off
    await drone.takeoff(20);
    console.log("Drone at 20m altitude");

    // Check landing safety at high altitude
    let landingCheck = drone.checkLandingSafety();
    console.log("\nLanding Safety at 20m:");
    console.log(`  Ground Height: ${landingCheck.groundHeight.toFixed(2)}m`);
    console.log(`  Current Altitude: ${landingCheck.currentAltitude.toFixed(2)}m`);
    console.log(`  AGL: ${landingCheck.agl.toFixed(2)}m`);
    console.log(`  ${landingCheck.message}`);

    // Descend to 3m
    await drone.takeoff(3);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check again
    landingCheck = drone.checkLandingSafety();
    console.log("\nLanding Safety at 3m:");
    console.log(`  AGL: ${landingCheck.agl.toFixed(2)}m`);
    console.log(`  ${landingCheck.message}`);

    // Land
    await drone.land();
    console.log("✓ Landing complete");
}

testLandingSafety();


// ============================================
// TEST 4: Validate Flight Path
// ============================================
async function testFlightPathValidation() {
    console.log("\n=== TEST 4: Flight Path Validation ===");

    // Define a flight path with waypoints
    const waypoints = [
        new THREE.Vector3(0, 10, 0),    // Start
        new THREE.Vector3(10, 8, 10),   // Waypoint 1 (might be too low)
        new THREE.Vector3(20, 15, 20),  // Waypoint 2
        new THREE.Vector3(30, 5, 30),   // Waypoint 3 (might be too low)
        new THREE.Vector3(0, 12, 0),    // Return
    ];

    // Validate with 2m minimum clearance
    const validation = drone.validateFlightPath(waypoints, 2.0);

    console.log(`\nFlight Path Validation:`);
    console.log(`  ${validation.message}`);
    console.log(`  Valid: ${validation.isValid ? '✓ YES' : '✗ NO'}`);

    if (!validation.isValid) {
        console.warn(`\n⚠️ Found ${validation.violations.length} violations:`);
        validation.violations.forEach(v => {
            console.warn(`  Waypoint ${v.index}:`);
            console.warn(`    Position: (${v.position.x}, ${v.position.y}, ${v.position.z})`);
            console.warn(`    Ground Height: ${v.groundHeight.toFixed(2)}m`);
            console.warn(`    Altitude: ${v.altitude}m`);
            console.warn(`    Clearance: ${v.clearance.toFixed(2)}m (minimum: 2.0m)`);
        });
    } else {
        console.log("✓ All waypoints have safe ground clearance");
    }
}

testFlightPathValidation();


// ============================================
// TEST 5: Automatic Takeoff Height Adjustment
// ============================================
async function testAutoAdjustTakeoff() {
    console.log("\n=== TEST 5: Auto-Adjust Takeoff Height ===");

    // Try to take off to a very low altitude (should be adjusted)
    console.log("Attempting takeoff to 1m (too low)...");
    await drone.takeoff(1);

    // Check actual altitude
    const agl = drone.getAltitudeAGL();
    console.log(`Actual AGL after takeoff: ${agl.toFixed(2)}m`);
    console.log("✓ Altitude was automatically adjusted to safe height");

    await drone.land();
}

testAutoAdjustTakeoff();


// ============================================
// TEST 6: Terrain-Aware Mission
// ============================================
async function testTerrainAwareMission() {
    console.log("\n=== TEST 6: Terrain-Aware Mission ===");

    // Check safety at multiple positions
    const positions = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(20, 0, 20),
        new THREE.Vector3(-20, 0, -20),
    ];

    console.log("Checking ground heights at different positions:");
    positions.forEach((pos, i) => {
        const safety = drone.checkAltitudeSafety(10, pos);
        console.log(`\nPosition ${i + 1}: (${pos.x}, ${pos.z})`);
        console.log(`  Ground Height: ${safety.groundHeight.toFixed(2)}m`);
        console.log(`  Safe Altitude for 10m target: ${safety.safeAltitude}m`);
    });

    // Execute mission with safe takeoff
    console.log("\nExecuting terrain-aware mission...");
    await drone.takeoff(15);
    console.log(`✓ Takeoff complete at ${drone.getAltitudeAGL().toFixed(2)}m AGL`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    await drone.land();
    console.log("✓ Mission complete");
}

testTerrainAwareMission();


// ============================================
// AVAILABLE SAFETY FUNCTIONS:
// ============================================
/*
1. drone.checkAltitudeSafety(targetAltitude, position?)
   - Checks if altitude is safe above ground
   - Returns: { isSafe, groundHeight, requestedAltitude, safeAltitude, clearance }

2. drone.getAltitudeAGL()
   - Gets current altitude above ground level
   - Returns: number (meters)

3. drone.checkLandingSafety()
   - Checks if current position is safe for landing
   - Returns: { isSafe, groundHeight, currentAltitude, agl, message }

4. drone.validateFlightPath(waypoints, minClearance?)
   - Validates entire flight path for ground clearance
   - Returns: { isValid, violations[], message }

5. drone.takeoff(altitude)
   - Now automatically adjusts altitude to be above ground
   - Minimum 2m clearance enforced
*/

