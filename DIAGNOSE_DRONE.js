// Diagnostic script to check drone API status
// Copy this into the code editor and click "Run Code"

console.log("=== DRONE API DIAGNOSTIC ===\n");

// Check 1: Global objects
console.log("1. Checking global objects:");
console.log("   - window.drone:", typeof window.drone);
console.log("   - window.THREE:", typeof window.THREE);
console.log("   - window.useDrone:", typeof window.useDrone);
console.log("   - window.useMission:", typeof window.useMission);

// Check 2: Drone object structure
if (typeof drone !== 'undefined') {
  console.log("\n2. Drone object structure:");
  console.log("   - Type:", typeof drone);
  console.log("   - Constructor:", drone.constructor.name);
  console.log("   - Methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(drone)));
  
  // Check 3: Test a simple method
  console.log("\n3. Testing isAutopilotActive():");
  try {
    const isActive = drone.isAutopilotActive();
    console.log("   - Result:", isActive);
    console.log("   ✅ Method works!");
  } catch (error) {
    console.error("   ❌ Error:", error.message);
  }
  
  // Check 4: Test async method
  console.log("\n4. Testing async takeoff method:");
  console.log("   - Calling drone.takeoff(5)...");
  
  drone.takeoff(5)
    .then(() => {
      console.log("   ✅ Takeoff successful!");
      console.log("   - Waiting 2 seconds...");
      return new Promise(resolve => setTimeout(resolve, 2000));
    })
    .then(() => {
      console.log("   - Landing...");
      return drone.land();
    })
    .then(() => {
      console.log("   ✅ Landing successful!");
      console.log("\n🎉 ALL TESTS PASSED! Drone API is working correctly.");
    })
    .catch((error) => {
      console.error("   ❌ Error during flight:", error);
      console.error("   Error details:", error.message, error.stack);
    });
    
} else {
  console.error("\n❌ CRITICAL: drone object is not defined!");
  console.log("\nPossible causes:");
  console.log("1. Simulation not fully loaded yet");
  console.log("2. DroneSimulation component not mounted");
  console.log("3. Import/export issue in droneController.ts");
  console.log("\nTry:");
  console.log("- Wait a few seconds and run again");
  console.log("- Check browser console for errors");
  console.log("- Refresh the page");
}

console.log("\n=== END DIAGNOSTIC ===");
