// ============================================
// SIMPLE DRONE TEST
// ============================================
// IMPORTANT NOTES:
// 1. Position Hold will be automatically enabled for autopilot
// 2. After your code finishes, DISABLE Position Hold in Control Panel
//    to return to normal manual flight
// 3. Or run: useDrone.getState().enablePositionHold(false)

// Test 1: Simple takeoff and land
async function test1() {
  console.log("🚁 Test 1: Simple takeoff and land");
  await drone.takeoff(10);
  console.log("✓ At 10m");
  await new Promise(r => setTimeout(r, 2000));
  await drone.land();
  console.log("✓ Landed");
  
  // Disable position hold after mission
  useDrone.getState().enablePositionHold(false);
  console.log("✓ Position hold disabled - manual control restored");
}

test1();
