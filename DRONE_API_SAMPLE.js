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
// AVAILABLE DRONE API METHODS:
// ============================================
/*
1. drone.takeoff(altitude)
   - Takes off to specified altitude (default: 10m)
   - Returns: Promise<void>

2. drone.land()
   - Lands the drone
   - Returns: Promise<void>

3. drone.hover()
   - Hovers at current position
   - Returns: Promise<void>

4. drone.moveTo(position, options)
   - Moves to target THREE.Vector3 position
   - options: { speed?: number, timeout?: number }
   - Returns: Promise<void>

5. drone.dir(fromX, fromY, fromZ, toX, toY, toZ)
   - Moves from one position to another
   - Returns: Promise<void>

6. drone.setPitch(degrees)
   - Sets pitch angle in degrees
   - Returns: Promise<void>

7. drone.setRoll(degrees)
   - Sets roll angle in degrees
   - Returns: Promise<void>

8. drone.setYaw(degrees)
   - Sets yaw heading in degrees
   - Returns: Promise<void>

9. drone.setThrottle(percentage)
   - Sets throttle (0-100%)
   - Returns: Promise<void>

10. drone.enableManualControl()
    - Returns control to manual mode
    - Returns: void

11. drone.isAutopilotActive()
    - Checks if autopilot is active
    - Returns: boolean

12. THREE.Vector3(x, y, z)
    - Creates a 3D position vector
    - Available globally via window.THREE
*/
