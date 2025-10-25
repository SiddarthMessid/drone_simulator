import { useFrame } from "@react-three/fiber";
import { useKeyboardControls, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { Controls } from "../App";
import DroneModel from "./DroneModel";
import Environment from "./Environment";
// Wind visualization will be handled inline
import { useDrone } from "../lib/stores/useDrone";
import { useWind } from "../lib/stores/useWind";
import { useEnvironment } from "../lib/stores/useEnvironment";
import { useAudio } from "../lib/stores/useAudio";
import { useCamera } from "../lib/stores/useCamera";
import { PIDController } from "../lib/pidController";
import { DronePhysics } from "../lib/dronePhysics";
import { drone } from "../lib/droneController";
import { gamepadController } from "../lib/gamepadController";

export default function DroneSimulation() {
  const droneRef = useRef<THREE.Group>(null);
  const [, getControls] = useKeyboardControls<Controls>();
  
  // Make drone controller and THREE globally accessible for user scripts
  if (typeof window !== 'undefined') {
    (window as any).drone = drone;
    (window as any).THREE = THREE;
  }
  
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
  const { getObstacleAABBs } = useEnvironment();
  const { playHit } = useAudio();
  const { mode: cameraMode, followOffset, fpvOffset, fpvHeight } = useCamera();
  
  // Initialize PID controllers and physics
  const pidController = useRef(new PIDController(pidParams));
  const dronePhysics = useRef(new DronePhysics());

  useFrame((state, delta) => {
    if (!droneRef.current) return;

    // Update PID controller parameters
    pidController.current.updateParams(pidParams);

    // Get current control inputs from keyboard
    const controls = getControls();
    
    // Get gamepad control inputs
    const gamepadInputs = gamepadController.getControlInputs();
    
    // Combine keyboard and gamepad inputs (gamepad takes priority if active)
    const hasGamepadInput = Math.abs(gamepadInputs.pitch) > 0 || Math.abs(gamepadInputs.roll) > 0 || 
                           Math.abs(gamepadInputs.yaw) > 0 || Math.abs(gamepadInputs.throttle) > 0;
    
    const manualSetpoints = hasGamepadInput ? gamepadInputs : {
      pitch: controls.forward ? -0.3 : controls.backward ? 0.3 : 0,
      roll: controls.left ? -0.3 : controls.right ? 0.3 : 0,
      yaw: controls.yawLeft ? -1 : controls.yawRight ? 1 : 0,
      throttle: controls.throttleUp ? 1 : controls.throttleDown ? -0.5 : 0
    };

    // Get setpoints from drone controller (handles both manual and autopilot modes)
    const setpoints = drone.update(manualSetpoints, delta);

    // Log active controls for debugging
    if (Object.values(setpoints).some(v => v !== 0)) {
      const mode = drone.isAutopilotActive() ? "autopilot" : "manual";
      const inputSource = hasGamepadInput ? "gamepad" : "keyboard";
      console.log(`Controls active (${mode} - ${inputSource}):`, setpoints);
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

    // Get obstacle AABBs for collision detection
    const obstacleAABBs = getObstacleAABBs();

    // Update physics with collision detection
    const physicsResult = dronePhysics.current.update(
      { position, rotation, velocity, angularVelocity },
      pidOutputs,
      wind,
      delta,
      obstacleAABBs
    );

    const { newState, collision } = physicsResult;

    // Play hit sound on collision
    if (collision.collided) {
      playHit();
    }

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

    // Update camera based on mode
    const camera = state.camera;
    
    if (cameraMode === 'follow') {
      // Follow camera: using customizable offset
      const idealPosition = new THREE.Vector3(
        newState.position.x + followOffset.x,
        newState.position.y + followOffset.y,
        newState.position.z + followOffset.z
      );
      
      camera.position.lerp(idealPosition, 0.05);
      camera.lookAt(newState.position);
    } else if (cameraMode === 'fpv') {
      // FPV camera: on top of the drone, looking forward like F1
      // Calculate drone's orientation vectors
      const droneForward = new THREE.Vector3(0, 0, -1);
      droneForward.applyEuler(new THREE.Euler(newState.rotation.x, newState.rotation.y, newState.rotation.z));
      
      const droneUp = new THREE.Vector3(0, 1, 0);
      droneUp.applyEuler(new THREE.Euler(newState.rotation.x, newState.rotation.y, newState.rotation.z));
      
      const droneRight = new THREE.Vector3(1, 0, 0);
      droneRight.applyEuler(new THREE.Euler(newState.rotation.x, newState.rotation.y, newState.rotation.z));
      
      // Camera position: on top of drone using full up vector + customizable offsets
      const fpvPosition = new THREE.Vector3(
        newState.position.x + droneUp.x * fpvHeight + droneForward.x * fpvOffset.z + droneRight.x * fpvOffset.x + droneUp.x * fpvOffset.y,
        newState.position.y + droneUp.y * fpvHeight + droneForward.y * fpvOffset.z + droneRight.y * fpvOffset.x + droneUp.y * fpvOffset.y,
        newState.position.z + droneUp.z * fpvHeight + droneForward.z * fpvOffset.z + droneRight.z * fpvOffset.x + droneUp.z * fpvOffset.y
      );
      
      // Look target: forward in the direction the drone is facing
      const lookTarget = new THREE.Vector3(
        fpvPosition.x + droneForward.x * 10,
        fpvPosition.y + droneForward.y * 10,
        fpvPosition.z + droneForward.z * 10
      );
      
      camera.position.copy(fpvPosition);
      camera.lookAt(lookTarget);
    }
  });

  return (
    <>
      {/* Manual Camera Controls - Only active in manual mode */}
      {cameraMode === 'manual' && (
        <OrbitControls
          enablePan={false}
          enableRotate={true}
          enableZoom={true}
          mouseButtons={{
            LEFT: undefined,
            MIDDLE: undefined,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
          target={[position.x, position.y, position.z]}
          minDistance={5}
          maxDistance={100}
        />
      )}

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
