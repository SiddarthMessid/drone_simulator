import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { Controls } from "../App";
import DroneModel from "./DroneModel";
import Environment from "./Environment";
// Wind visualization will be handled inline
import { useDrone } from "../lib/stores/useDrone";
import { useWind } from "../lib/stores/useWind";
import { PIDController } from "../lib/pidController";
import { DronePhysics } from "../lib/dronePhysics";

export default function DroneSimulation() {
  const droneRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.Camera>(null);
  const [, getControls] = useKeyboardControls<Controls>();
  
  const { 
    position, 
    rotation, 
    velocity, 
    angularVelocity,
    pidParams,
    updateDrone,
    setTelemetry
  } = useDrone();
  
  const { getWindAtPosition, windSources } = useWind();
  
  // Initialize PID controllers and physics
  const pidController = useRef(new PIDController(pidParams));
  const dronePhysics = useRef(new DronePhysics());

  useFrame((state, delta) => {
    if (!droneRef.current) return;

    // Update PID controller parameters
    pidController.current.updateParams(pidParams);

    // Get current control inputs
    const controls = getControls();
    
    // Map controls to desired setpoints
    const setpoints = {
      pitch: controls.forward ? -0.3 : controls.backward ? 0.3 : 0,
      roll: controls.left ? -0.3 : controls.right ? 0.3 : 0,
      yaw: controls.yawLeft ? -1 : controls.yawRight ? 1 : 0,
      throttle: controls.throttleUp ? 1 : controls.throttleDown ? -0.5 : 0
    };

    // Log controls for debugging
    if (Object.values(setpoints).some(v => v !== 0)) {
      console.log("Controls active:", setpoints);
    }

    // Calculate PID outputs
    const pidOutputs = pidController.current.update(
      { pitch: rotation.x, roll: rotation.z, yaw: rotation.y, altitude: position.y },
      setpoints,
      delta
    );

    // Get wind forces at current drone position
    const windAtPosition = getWindAtPosition(
      { x: position.x, y: position.y, z: position.z },
      state.clock.elapsedTime
    );
    const wind = new THREE.Vector3(windAtPosition.x, windAtPosition.y, windAtPosition.z);

    // Update physics
    const newState = dronePhysics.current.update(
      { position, rotation, velocity, angularVelocity },
      pidOutputs,
      wind,
      delta
    );

    // Update drone state
    updateDrone(newState);

    // Update drone model position and rotation
    droneRef.current.position.copy(newState.position);
    droneRef.current.rotation.set(newState.rotation.x, newState.rotation.y, newState.rotation.z);

    // Update telemetry
    setTelemetry({
      altitude: newState.position.y,
      speed: newState.velocity.length(),
      pitch: newState.rotation.x * (180 / Math.PI),
      roll: newState.rotation.z * (180 / Math.PI),
      yaw: newState.rotation.y * (180 / Math.PI),
      throttle: setpoints.throttle
    });

    // Update camera to follow drone
    const camera = state.camera;
    const idealPosition = new THREE.Vector3(
      newState.position.x - 15,
      newState.position.y + 8,
      newState.position.z + 15
    );
    
    camera.position.lerp(idealPosition, 0.05);
    camera.lookAt(newState.position);
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[50, 50, 25]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* Environment */}
      <Environment />

      {/* Drone */}
      <group ref={droneRef}>
        <DroneModel />
      </group>

      {/* Wind Sources Visualization */}
      {windSources.map((source) => (
        <group key={source.id} visible={source.enabled}>
          <mesh position={[source.position.x, source.position.y, source.position.z]}>
            <cylinderGeometry args={[source.radius, source.radius, source.radius * 0.3, 16]} />
            <meshBasicMaterial 
              color={source.enabled ? "#00ff0030" : "#66666630"} 
              transparent 
              opacity={0.2}
              wireframe
            />
          </mesh>
          <arrowHelper
            args={[
              new THREE.Vector3(Math.cos(source.direction), 0, Math.sin(source.direction)),
              new THREE.Vector3(source.position.x, source.position.y + source.radius * 0.2, source.position.z),
              source.force * 1.5,
              source.enabled ? 0x00ff00 : 0x666666,
              source.force * 0.3,
              source.force * 0.2
            ]}
          />
        </group>
      ))}
    </>
  );
}
