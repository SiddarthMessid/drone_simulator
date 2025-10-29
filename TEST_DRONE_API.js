// Simple test to verify drone API is working
// Copy this into the code editor and click "Run Code"

async function testDroneAPI() {
  console.log("=== Testing Drone API ===");

  // Test 1: Check if drone object exists
  if (typeof drone === 'undefined') {
    console.error("❌ FAILED: drone object is not defined!");
    console.log("Make sure the simulation is running.");
    return;
  }
  console.log("✅ PASS: drone object exists");

  // Test 2: Check if THREE is available
  if (typeof THREE === 'undefined') {
    console.error("❌ FAILED: THREE is not defined!");
    return;
  }
  console.log("✅ PASS: THREE library is available");

  // Test 3: Check drone methods
  const requiredMethods = [
    'takeoff', 'land', 'hover', 'moveTo', 'dir',
    'setPitch', 'setRoll', 'setYaw', 'setThrottle',
    'enableManualControl', 'isAutopilotActive'
  ];

  for (const method of requiredMethods) {
    if (typeof drone[method] !== 'function') {
      console.error(`❌ FAILED: drone.${method}() is not a function!`);
      return;
    }
  }
  console.log("✅ PASS: All drone methods are available");

  // Test 4: Simple takeoff test
  console.log("\n🚁 Starting simple takeoff test...");
  try {
    await drone.takeoff(5);
    console.log("✅ PASS: Takeoff completed successfully!");

    // Hover for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Land
    await drone.land();
    console.log("✅ PASS: Landing completed successfully!");

    console.log("\n🎉 All tests passed! Drone API is working correctly.");
  } catch (error) {
    console.error("❌ FAILED: Drone command error:", error);
  }
}

// Run the test
testDroneAPI();
