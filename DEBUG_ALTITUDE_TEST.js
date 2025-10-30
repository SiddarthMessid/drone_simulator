// ============================================
// DEBUG: Altitude Checking Test (Simplified)
// ============================================

async function debugAltitude() {
    console.log("=== DEBUG: Altitude System ===\n");

    // Get current position (simplified)
    const pos = drone.getPosition();
    console.log("1. Current Drone Position:");
    console.log(`   X: ${pos.x.toFixed(2)}m`);
    console.log(`   Y: ${pos.y.toFixed(2)}m (absolute altitude)`);
    console.log(`   Z: ${pos.z.toFixed(2)}m`);

    // Check altitude above ground
    const agl = drone.getAltitudeAGL();
    console.log(`\n2. Altitude Above Ground Level (AGL):`);
    console.log(`   ${agl.toFixed(2)}m`);
    console.log(`   Flying: ${drone.isFlying() ? 'YES' : 'NO'}`);

    // Check safety for 5m takeoff
    const safety5 = drone.checkAltitudeSafety(5);
    console.log(`\n3. Safety Check for 5m Takeoff:`);
    console.log(`   Ground Height: ${safety5.groundHeight.toFixed(2)}m`);
    console.log(`   Requested: ${safety5.requestedAltitude}m`);
    console.log(`   Safe Altitude: ${safety5.safeAltitude}m`);
    console.log(`   Is Safe: ${safety5.isSafe ? '✓ YES' : '✗ NO'}`);

    // Try takeoff
    console.log(`\n4. Attempting Takeoff to 5m...`);
    await drone.takeoff(5);

    // Wait for stabilization
    await new Promise(r => setTimeout(r, 3000));

    // Check position after takeoff
    const posAfter = drone.getPosition();
    const aglAfter = drone.getAltitudeAGL();
    const stable = drone.isStable();

    console.log(`\n5. After Takeoff:`);
    console.log(`   Absolute Y: ${posAfter.y.toFixed(2)}m`);
    console.log(`   AGL: ${aglAfter.toFixed(2)}m`);
    console.log(`   Stable: ${stable ? 'YES' : 'NO'}`);
    console.log(`   Expected: 5.00m AGL`);

    if (Math.abs(aglAfter - 5.0) < 0.5) {
        console.log(`   ✓ PASS: Drone at correct altitude`);
    } else {
        console.error(`   ✗ FAIL: Altitude mismatch!`);
    }

    // Test different positions (simplified - no THREE.Vector3)
    console.log(`\n6. Testing Ground Heights:`);
    const testCoords = [
        { x: 0, z: 0 },
        { x: 10, z: 10 },
        { x: -10, z: -10 },
        { x: 20, z: 20 },
    ];

    testCoords.forEach((coord, i) => {
        const groundHeight = drone.getGroundHeight(coord.x, coord.z);
        const safety = drone.checkAltitudeSafety(10, drone.createPosition(coord.x, 0, coord.z));
        console.log(`   Position ${i + 1} (${coord.x}, ${coord.z}):`);
        console.log(`     Ground: ${groundHeight.toFixed(2)}m, Safe Alt: ${safety.safeAltitude}m`);
    });

    // Get full telemetry
    console.log(`\n7. Full Telemetry:`);
    const telemetry = drone.getTelemetry();
    console.log(`   Position: (${telemetry.position.x.toFixed(1)}, ${telemetry.position.y.toFixed(1)}, ${telemetry.position.z.toFixed(1)})`);
    console.log(`   Rotation: Pitch ${telemetry.rotation.pitch.toFixed(1)}°, Roll ${telemetry.rotation.roll.toFixed(1)}°, Yaw ${telemetry.rotation.yaw.toFixed(1)}°`);
    console.log(`   Speed: ${telemetry.velocity.speed.toFixed(2)} m/s`);
    console.log(`   AGL: ${telemetry.agl.toFixed(2)}m`);

    // Land
    console.log(`\n8. Landing...`);
    await drone.land();
    await new Promise(r => setTimeout(r, 2000));

    const finalPos = drone.getPosition();
    const finalAGL = drone.getAltitudeAGL();
    console.log(`   Final Y: ${finalPos.y.toFixed(2)}m`);
    console.log(`   Final AGL: ${finalAGL.toFixed(2)}m`);
    console.log(`   On Ground: ${!drone.isFlying() ? 'YES' : 'NO'}`);

    console.log(`\n✓ Test Complete`);
}

// Run the debug test
debugAltitude();
