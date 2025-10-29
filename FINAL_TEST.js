// ============================================
// COMPREHENSIVE DRONE API TEST
// ============================================
// This script tests all drone API functions
// Copy into Code Editor and click "Run Code"

async function comprehensiveTest() {
  console.log("╔════════════════════════════════════════╗");
  console.log("║   COMPREHENSIVE DRONE API TEST         ║");
  console.log("╚════════════════════════════════════════╝\n");
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  // Test 1: Check global objects
  console.log("Test 1: Checking global objects...");
  if (typeof drone !== 'undefined' && typeof THREE !== 'undefined') {
    console.log("✅ PASS: Global objects available");
    testsPassed++;
  } else {
    console.log("❌ FAIL: Missing global objects");
    testsFailed++;
    return;
  }
  
  // Test 2: Check all methods exist
  console.log("\nTest 2: Checking API methods...");
  const methods = ['takeoff', 'land', 'hover', 'moveTo', 'dir', 
                   'setPitch', 'setRoll', 'setYaw', 'setThrottle',
                   'enableManualControl', 'isAutopilotActive'];
  
  let allMethodsExist = true;
  for (const method of methods) {
    if (typeof drone[method] !== 'function') {
      console.log(`❌ Missing: drone.${method}()`);
      allMethodsExist = false;
    }
  }
  
  if (allMethodsExist) {
    console.log(`✅ PASS: All ${methods.length} methods available`);
    testsPassed++;
  } else {
    console.log("❌ FAIL: Some methods missing");
    testsFailed++;
  }
  
  // Test 3: Test isAutopilotActive (synchronous)
  console.log("\nTest 3: Testing isAutopilotActive()...");
  try {
    const isActive = drone.isAutopilotActive();
    console.log(`✅ PASS: isAutopilotActive() = ${isActive}`);
    testsPassed++;
  } catch (error) {
    console.log("❌ FAIL:", error.message);
    testsFailed++;
  }
  
  // Test 4: Test takeoff
  console.log("\nTest 4: Testing takeoff(10)...");
  try {
    await drone.takeoff(10);
    console.log("✅ PASS: Takeoff successful");
    testsPassed++;
  } catch (error) {
    console.log("❌ FAIL:", error.message);
    testsFailed++;
    return;
  }
  
  // Test 5: Test hover
  console.log("\nTest 5: Testing hover()...");
  try {
    await drone.hover();
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("✅ PASS: Hover successful");
    testsPassed++;
  } catch (error) {
    console.log("❌ FAIL:", error.message);
    testsFailed++;
  }
  
  // Test 6: Test moveTo
  console.log("\nTest 6: Testing moveTo()...");
  try {
    const target = new THREE.Vector3(10, 10, 10);
    await drone.moveTo(target);
    console.log("✅ PASS: MoveTo successful");
    testsPassed++;
  } catch (error) {
    console.log("❌ FAIL:", error.message);
    testsFailed++;
  }
  
  // Test 7: Test dir
  console.log("\nTest 7: Testing dir()...");
  try {
    await drone.dir(10, 10, 10, 0, 10, 0);
    console.log("✅ PASS: Dir successful");
    testsPassed++;
  } catch (error) {
    console.log("❌ FAIL:", error.message);
    testsFailed++;
  }
  
  // Test 8: Test setYaw
  console.log("\nTest 8: Testing setYaw()...");
  try {
    await drone.setYaw(90);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("✅ PASS: SetYaw successful");
    testsPassed++;
  } catch (error) {
    console.log("❌ FAIL:", error.message);
    testsFailed++;
  }
  
  // Test 9: Test land
  console.log("\nTest 9: Testing land()...");
  try {
    await drone.land();
    console.log("✅ PASS: Land successful");
    testsPassed++;
  } catch (error) {
    console.log("❌ FAIL:", error.message);
    testsFailed++;
  }
  
  // Test 10: Test enableManualControl
  console.log("\nTest 10: Testing enableManualControl()...");
  try {
    drone.enableManualControl();
    const isActive = drone.isAutopilotActive();
    if (!isActive) {
      console.log("✅ PASS: Manual control enabled");
      testsPassed++;
    } else {
      console.log("❌ FAIL: Autopilot still active");
      testsFailed++;
    }
  } catch (error) {
    console.log("❌ FAIL:", error.message);
    testsFailed++;
  }
  
  // Summary
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║           TEST SUMMARY                 ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📊 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  
  if (testsFailed === 0) {
    console.log("\n🎉 ALL TESTS PASSED! Drone API is fully functional!");
  } else {
    console.log("\n⚠️  Some tests failed. Check the output above for details.");
  }
}

// Run the comprehensive test
comprehensiveTest();
