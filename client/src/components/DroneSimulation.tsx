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
import { useMission } from "../lib/stores/useMission";

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
      roll: controls.left ? 0.3 : controls.right ? -0.3 : 0,  // Inverted roll for correct left/right
      yaw: controls.yawLeft ? 1 : controls.yawRight ? -1 : 0, // Inverted yaw for correct rotation
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
      // Follow camera: using customizable offset with drone rotation
      const offsetVector = new THREE.Vector3(followOffset.x, followOffset.y, followOffset.z);
      offsetVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), newState.rotation.y);
      
      const idealPosition = new THREE.Vector3(
        newState.position.x + offsetVector.x,
        newState.position.y + followOffset.y, // Keep vertical offset independent
        newState.position.z + offsetVector.z
      );
      
      // Smoother camera movement with dynamic lerp
      const currentDistance = camera.position.distanceTo(idealPosition);
      const lerpFactor = THREE.MathUtils.clamp(delta * (2 + currentDistance), 0.02, 0.15);
      
      camera.position.lerp(idealPosition, lerpFactor);
      camera.lookAt(newState.position);
    } else if (cameraMode === 'fpv') {
      // FPV camera: mounted on the drone, tilting with roll and pitch
      const droneEuler = new THREE.Euler(newState.rotation.x, newState.rotation.y, newState.rotation.z, 'YXZ');
      
      // Calculate drone's orientation vectors with full rotation
      const droneForward = new THREE.Vector3(0, 0, -1);
      droneForward.applyEuler(droneEuler);
      
      const droneUp = new THREE.Vector3(0, 1, 0);
      droneUp.applyEuler(droneEuler);
      
      const droneRight = new THREE.Vector3(1, 0, 0);
      droneRight.applyEuler(droneEuler);
      
      // Camera position: mounted on the drone with offsets
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
      
      // Set camera position and orientation
      camera.position.copy(fpvPosition);
      camera.lookAt(lookTarget);
      
      // Apply the same roll as the drone
      camera.up.copy(droneUp);
    }
  });

  return (
    <>
      {/* Manual Camera Controls - Only active in manual mode */}
      {cameraMode === 'manual' && (
        <OrbitControls
          enablePan={true}
          enableRotate={true}
          enableZoom={true}
          minPolarAngle={0}
          maxPolarAngle={Math.PI * 0.75}
          mouseButtons={{
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: undefined,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
          target={[position.x, position.y, position.z]}
          minDistance={2}
          maxDistance={200}
          enableDamping={true}
          dampingFactor={0.05}
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

      {/* Invisible click plane for mission point selection */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={(e: any) => {
          // e.point is the world coordinate of the click
          const { mode, setStart, setStop, addScanPoint } = useMission.getState();
          const p: THREE.Vector3 = e.point.clone();
          if (mode === 'selectStart') {
            setStart(p);
          } else if (mode === 'selectStop') {
            setStop(p);
          } else if (mode === 'selectScan') {
            addScanPoint(p);
          }
        }}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial visible={false} />
      </mesh>

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

      {/* Mission markers (start/stop/scan points) */}
      {(() => {
        const { startPoint, stopPoint, scanPoints } = useMission.getState();
        const markers: any[] = [];
        if (startPoint) {
          markers.push(
            <mesh key="mission_start" position={[startPoint.x, startPoint.y + 0.2, startPoint.z]}>
              <sphereGeometry args={[0.2, 12, 12]} />
              <meshStandardMaterial color="#00ff00" />
            </mesh>
          );
        }
        if (stopPoint) {
          markers.push(
            <mesh key="mission_stop" position={[stopPoint.x, stopPoint.y + 0.2, stopPoint.z]}>
              <sphereGeometry args={[0.2, 12, 12]} />
              <meshStandardMaterial color="#ff0000" />
            </mesh>
          );
        }
        scanPoints.forEach((s) => {
          markers.push(
            <mesh key={s.id} position={[s.position.x, s.position.y + 0.2, s.position.z]}>
              <boxGeometry args={[0.25, 0.25, 0.25]} />
              <meshStandardMaterial color="#00aaff" />
            </mesh>
          );
        });

        return markers;
      })()}
    </>
  );
}
