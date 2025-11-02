// ============================================
// TEST FLIGHT - Takeoff, Move Far, and Land
// ============================================
// This test will:
// 1. Take off to 15 meters
// 2. Move to a far position (50m away)
// 3. Return to origin
// 4. Land

async function testFlight() {
    console.log("🚁 Starting test flight...");

    try {
        // Step 1: Take off to 15 meters
        console.log("📍 Step 1: Taking off to 15m...");
        await drone.takeoff(15);
        console.log("✅ Takeoff complete! Altitude: 15m");

        // Wait for stabilization
        await drone.delay(2);
        console.log("⏸️  Stabilizing...");

        // Step 2: Move to far position (50m forward, 30m right)
        console.log("📍 Step 2: Moving to far position (X:30, Y:15, Z:50)...");
        const farPosition = drone.createPosition(30, 15, 50);
        await drone.moveTo(farPosition);
        console.log("✅ Reached far position!");

        // Get current position to verify
        const pos1 = drone.getPosition();
        console.log(`📊 Current position: X=${pos1.x.toFixed(1)}, Y=${pos1.y.toFixed(1)}, Z=${pos1.z.toFixed(1)}`);

        // Hover for 3 seconds
        console.log("⏸️  Hovering for 3 seconds...");
        await drone.hover();
        await drone.delay(3);

        // Step 3: Return to origin
        console.log("📍 Step 3: Returning to origin (X:0, Y:15, Z:0)...");
        const origin = drone.createPosition(0, 15, 0);
        await drone.moveTo(origin);
        console.log("✅ Returned to origin!");

        // Get current position to verify
        const pos2 = drone.getPosition();
        console.log(`📊 Current position: X=${pos2.x.toFixed(1)}, Y=${pos2.y.toFixed(1)}, Z=${pos2.z.toFixed(1)}`);

        // Hover for 2 seconds
        console.log("⏸️  Hovering for 2 seconds...");
        await drone.hover();
        await drone.delay(2);

        // Step 4: Land
        console.log("📍 Step 4: Landing...");
        await drone.land();
        console.log("✅ Landing complete!");

        // Final telemetry
        const finalTelemetry = drone.getTelemetry();
        console.log("📊 Final telemetry:", finalTelemetry);

        console.log("🎉 Test flight completed successfully!");

    } catch (error) {
        console.error("❌ Test flight failed:", error);
    }
}

// Run the test
testFlight();
