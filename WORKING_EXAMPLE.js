// ============================================
// WORKING DRONE API EXAMPLE
// ============================================
// This example demonstrates all working drone API functions
// Copy this into the Code Editor and click "Run Code"

async function demonstrateDroneAPI() {
  console.log("🚁 Starting Drone API Demonstration\n");
  
  try {
    // Example 1: Simple Takeoff and Land
    console.log("📍 Example 1: Simple Takeoff and Land");
    await drone.takeoff(10);
    console.log("✅ Reached 10m altitude");
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("⏱️  Hovering for 2 seconds...");
    
    await drone.land();
    console.log("✅ Landed safely\n");
    
    // Wait before next example
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Example 2: Move to Position
    console.log("📍 Example 2: Move to Specific Position");
    await drone.takeoff(15);
    console.log("✅ Reached 15m altitude");
    
    const targetPos = new THREE.Vector3(20, 15, 20);
    console.log(`🎯 Moving to position (${targetPos.x}, ${targetPos.y}, ${targetPos.z})`);
    await drone.moveTo(targetPos);
    console.log("✅ Reached target position");
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return to origin
    const origin = new THREE.Vector3(0, 15, 0);
    console.log("🏠 Returning to origin");
    await drone.moveTo(origin);
    console.log("✅ Back at origin");
    
    await drone.land();
    console.log("✅ Landed safely\n");
    
    // Wait before next example
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Example 3: Square Pattern
    console.log("📍 Example 3: Flying Square Pattern");
    await drone.takeoff(12);
    
    const corners = [
      new THREE.Vector3(10, 12, 10),
      new THREE.Vector3(10, 12, -10),
      new THREE.Vector3(-10, 12, -10),
      new THREE.Vector3(-10, 12, 10),
      new THREE.Vector3(0, 12, 0)
    ];
    
    for (let i = 0; i < corners.length; i++) {
      console.log(`🎯 Flying to corner ${i + 1}...`);
      await drone.moveTo(corners[i]);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log("✅ Square pattern complete");
    
    await drone.land();
    console.log("✅ Landed safely\n");
    
    console.log("🎉 All demonstrations completed successfully!");
    console.log("\n📚 Available Drone API Methods:");
    console.log("   - drone.takeoff(altitude)");
    console.log("   - drone.land()");
    console.log("   - drone.hover()");
    console.log("   - drone.moveTo(position)");
    console.log("   - drone.dir(fromX, fromY, fromZ, toX, toY, toZ)");
    console.log("   - drone.setPitch(degrees)");
    console.log("   - drone.setRoll(degrees)");
    console.log("   - drone.setYaw(degrees)");
    console.log("   - drone.setThrottle(percentage)");
    console.log("   - drone.enableManualControl()");
    console.log("   - drone.isAutopilotActive()");
    
  } catch (error) {
    console.error("❌ Error during demonstration:", error);
    console.error("Error details:", error.message);
  }
}

// Run the demonstration
demonstrateDroneAPI();
