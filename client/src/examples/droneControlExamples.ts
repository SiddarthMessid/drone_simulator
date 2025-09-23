/**
 * Drone Control API Examples
 * 
 * This file demonstrates how to use the high-level drone control API.
 * The drone controller is available globally as `window.drone`.
 * 
 * Open the browser console and try these commands!
 */

// Basic takeoff and landing
async function basicFlight() {
  try {
    console.log("Taking off...");
    await drone.takeoff(5); // Take off to 5 units high
    
    console.log("Hovering...");
    await drone.hover(); // Stabilize at current position
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    console.log("Landing...");
    await drone.land(); // Land the drone
    
    console.log("Flight complete!");
  } catch (error) {
    console.error("Flight error:", error);
  }
}

// Attitude control examples
async function attitudeControl() {
  console.log("Setting pitch to 10 degrees...");
  await drone.setPitch(10);
  
  console.log("Setting roll to -15 degrees...");
  await drone.setRoll(-15);
  
  console.log("Setting yaw to 45 degrees...");
  await drone.setYaw(45);
  
  console.log("Setting throttle to 75%...");
  await drone.setThrottle(75);
  
  // Return to level flight
  console.log("Leveling out...");
  await drone.setPitch(0);
  await drone.setRoll(0);
}

// Movement control
async function movementControl() {
  // Move from one point to another
  console.log("Moving to position (10, 8, 5)...");
  await drone.dir(0, 0, 0, 10, 8, 5); // Move from origin to (10, 8, 5)
  
  // Alternative movement method
  const targetPosition = new THREE.Vector3(0, 6, 0);
  console.log("Moving to center position...");
  await drone.moveTo(targetPosition);
}

// Complex flight pattern
async function complexFlightPattern() {
  try {
    console.log("Starting complex flight pattern...");
    
    // Take off
    await drone.takeoff(8);
    
    // Move in a square pattern
    await drone.moveTo(new THREE.Vector3(5, 8, 0));
    await drone.moveTo(new THREE.Vector3(5, 8, 5));
    await drone.moveTo(new THREE.Vector3(-5, 8, 5));
    await drone.moveTo(new THREE.Vector3(-5, 8, 0));
    await drone.moveTo(new THREE.Vector3(0, 8, 0));
    
    // Perform some attitude maneuvers
    await drone.setYaw(90);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await drone.setYaw(180);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await drone.setYaw(0);
    
    // Land
    await drone.land();
    
    console.log("Complex flight pattern completed!");
  } catch (error) {
    console.error("Complex flight error:", error);
  }
}

// Manual control mode
function enableManualControl() {
  console.log("Enabling manual control - use WASD and arrow keys");
  drone.enableManualControl();
}

// Check autopilot status
function checkStatus() {
  const isAutopilot = drone.isAutopilotActive();
  const currentCommand = drone.getCurrentCommand();
  
  console.log("Autopilot active:", isAutopilot);
  console.log("Current command:", currentCommand);
}

// Example usage in console:
// basicFlight()
// attitudeControl()
// movementControl() 
// complexFlightPattern()
// enableManualControl()
// checkStatus()