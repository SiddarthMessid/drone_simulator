import { useFrame } from "@react-three/fiber";
import { useKeyboardControls, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { Controls } from "../App";
import DroneModelSwitcher from "./DroneModelSwitcher";
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
import { useEditor } from "../lib/stores/useEditor";

export default function DroneSimulation() {
  const droneRef = useRef<THREE.Group>(null);
  const [, getControls] = useKeyboardControls<Controls>();
  const { isFocused: editorFocused } = useEditor();

  // Make drone controller, THREE, and stores globally accessible for user scripts
  if (typeof window !== "undefined") {
    (window as any).drone = drone;
    (window as any).THREE = THREE;
    (window as any).useDrone = useDrone;
    (window as any).useMission = useMission;
  }

  const {
    position,
    rotation,
    velocity,
    angularVelocity,
    pidParams,
    updateDrone,
    setTelemetry,
  } = useDrone();

  const { getWindAtPosition, windSources } = useWind();
  const { getObstacleAABBs } = useEnvironment();
  const { playHit } = useAudio();
  const { mode: cameraMode, followOffset, fpvOffset, fpvHeight } = useCamera();

  // Initialize PID controllers and physics
  const pidController = useRef(new PIDController(pidParams));
  const dronePhysics = useRef(new DronePhysics());

  // Yaw accumulator - stores the target yaw angle that accumulates over time
  const targetYaw = useRef(rotation.y);

  // Mission execution state
  const missionState = useRef<
    "idle" | "spawning" | "takeoff" | "flying" | "landing" | "landed"
  >("idle");
  const missionStartTime = useRef(0);
  const skipPhysicsFrames = useRef(0);

  useFrame((state, delta) => {
    if (!droneRef.current) return;

    // Handle mission execution
    const { isExecuting, startPoint, targetPoint, setIsExecuting } =
      useMission.getState();

    if (isExecuting && startPoint && targetPoint) {
      if (missionState.current === "idle") {
        console.log("Starting mission - teleporting to start point");
        // Start mission - teleport drone to start point
        missionState.current = "spawning";
        missionStartTime.current = state.clock.elapsedTime;

        // Teleport drone to start point at ground level
        const spawnPos = new THREE.Vector3(startPoint.x, 0.5, startPoint.z);
        const spawnRot = new THREE.Vector3(0, 0, 0);
        const zeroVel = new THREE.Vector3(0, 0, 0);

        // Skip physics for 2 frames to allow position to settle
        skipPhysicsFrames.current = 2;

        updateDrone({
          position: spawnPos,
          rotation: spawnRot,
          velocity: zeroVel,
          angularVelocity: zeroVel,
        });

        // Immediately update the visual drone position
        if (droneRef.current) {
          droneRef.current.position.copy(spawnPos);
          droneRef.current.rotation.set(0, 0, 0);
        }

        // Drone teleported to start position

        // Wait a frame for the position to update, then start takeoff
        setTimeout(() => {
          // Enable altitude hold to allow autopilot to work
          useDrone.getState().enableAltitudeHold(true);
          missionState.current = "takeoff";
          drone
            .takeoff(10)
            .then(() => {
              console.log("Takeoff complete, starting flight");
              missionState.current = "flying";
              const targetPos = new THREE.Vector3(
                targetPoint.x,
                10,
                targetPoint.z
              );
              return drone.moveTo(targetPos);
            })
            .then(() => {
              console.log("Flight complete, starting landing");
              missionState.current = "landing";
              return drone.land();
            })
            .then(() => {
              console.log("Landing complete");
              missionState.current = "landed";
              drone.enableManualControl();
              setIsExecuting(false);

              // Reset for next mission
              setTimeout(() => {
                missionState.current = "idle";
              }, 1000);
            })
            .catch((err) => {
              console.error("Mission failed:", err);
              setIsExecuting(false);
              missionState.current = "idle";
              drone.enableManualControl();
            });
        }, 100);
      }
    } else if (missionState.current !== "idle" && !isExecuting) {
      // Mission was cancelled
      console.log("Mission cancelled");
      missionState.current = "idle";
      drone.enableManualControl();
      // Reset yaw target to current rotation
      targetYaw.current = rotation.y;
    }

    // Update PID controller parameters
    pidController.current.updateParams(pidParams);

    // Get current control inputs from keyboard (disabled when editor is focused)
    const controls = editorFocused
      ? {
          forward: false,
          backward: false,
          left: false,
          right: false,
          throttleUp: false,
          throttleDown: false,
          yawLeft: false,
          yawRight: false,
        }
      : getControls();

    // Yaw controls (logging removed for performance)

    // Emergency: Press 'R' key to reset yaw target
    if (
      controls.forward &&
      controls.backward &&
      controls.left &&
      controls.right
    ) {
      console.log("🔄 Emergency yaw reset!");
      targetYaw.current = rotation.y;
    }

    // Get gamepad control inputs
    const gamepadInputs = gamepadController.getControlInputs();

    // Combine keyboard and gamepad inputs (gamepad takes priority if active)
    const hasGamepadInput =
      Math.abs(gamepadInputs.pitch) > 0 ||
      Math.abs(gamepadInputs.roll) > 0 ||
      Math.abs(gamepadInputs.yaw) > 0 ||
      Math.abs(gamepadInputs.throttle) > 0;

    // Normalize angle to -PI to PI range
    const normalizeAngle = (angle: number) => {
      while (angle > Math.PI) angle -= 2 * Math.PI;
      while (angle < -Math.PI) angle += 2 * Math.PI;
      return angle;
    };

    // Accumulate yaw based on input (yaw rate control)
    const yawRate = hasGamepadInput
      ? gamepadInputs.yaw
      : controls.yawLeft
      ? 1
      : controls.yawRight
      ? -1
      : 0;

    // Simple yaw control: when no input, lock to current angle
    if (Math.abs(yawRate) < 0.01) {
      // No input - lock target to current rotation
      targetYaw.current = rotation.y;
    } else {
      // Has input - accumulate yaw
      const yawSpeed = 2.0; // radians per second
      targetYaw.current += yawRate * yawSpeed * delta;
      targetYaw.current = normalizeAngle(targetYaw.current);
    }

    const manualSetpoints = hasGamepadInput
      ? { ...gamepadInputs, yaw: targetYaw.current }
      : {
          pitch: controls.forward ? -0.3 : controls.backward ? 0.3 : 0,
          roll: controls.left ? 0.3 : controls.right ? -0.3 : 0,
          yaw: targetYaw.current, // Use accumulated yaw angle
          throttle: controls.throttleUp ? 1 : controls.throttleDown ? -0.5 : 0,
        };

    // Controls are active (logging removed for performance)

    // Get setpoints from drone controller (handles both manual and autopilot modes)
    const setpoints = drone.update(manualSetpoints, delta);

    // Determine motor outputs: bypass PID for manual control, use PID for autopilot
    let motorOutputs;

    const currentCommand = drone.getCurrentCommand();
    const isPositionControl =
      currentCommand &&
      (currentCommand.type === "moveTo" || currentCommand.type === "brake");

    if (drone.isAutopilotActive() && !isPositionControl) {
      // Autopilot mode (hover, takeoff, land): Use PID controller for smooth stabilization
      motorOutputs = pidController.current.update(
        {
          pitch: rotation.x,
          roll: rotation.z,
          yaw: rotation.y,
          altitude: position.y,
        },
        setpoints,
        delta
      );
    } else if (isPositionControl) {
      // Position control mode: setpoints are torques, not angles
      // Apply stabilization + position control torques
      const pitchTorque =
        setpoints.pitch - rotation.x * 2.0 - angularVelocity.x * 1.0;
      const rollTorque =
        setpoints.roll - rotation.z * 2.0 - angularVelocity.z * 1.0;

      // Yaw uses PD to reach target heading
      const yawError = setpoints.yaw - rotation.y;
      const normalizedYawError =
        ((yawError + Math.PI) % (2 * Math.PI)) - Math.PI;
      const yawTorque = normalizedYawError * 4.0 - angularVelocity.y * 1.5; // Original working version

      // Debug yaw control
      if (Math.random() < 0.05) {
        console.log(
          `[YAW] Target: ${((setpoints.yaw * 180) / Math.PI).toFixed(
            1
          )}°, Current: ${((rotation.y * 180) / Math.PI).toFixed(
            1
          )}°, Error: ${((normalizedYawError * 180) / Math.PI).toFixed(
            1
          )}°, Torque: ${yawTorque.toFixed(2)}`
        );
      }

      motorOutputs = {
        pitch: pitchTorque,
        roll: rollTorque,
        yaw: yawTorque,
        throttle: setpoints.throttle,
      };
    } else {
      // Manual mode: Direct control without PID
      // Apply active stabilization to return to level when no input

      let pitchTorque = setpoints.pitch;
      let rollTorque = setpoints.roll;
      let yawTorque = yawRate * 0.5;

      // When no pitch input, stabilize to level (0°)
      if (Math.abs(setpoints.pitch) < 0.01) {
        // Apply restoring torque to return to level + damping
        pitchTorque = -rotation.x * 3.0 - angularVelocity.x * 1.5;
      }

      // When no roll input, stabilize to level (0°)
      if (Math.abs(setpoints.roll) < 0.01) {
        // Apply restoring torque to return to level + damping
        rollTorque = -rotation.z * 3.0 - angularVelocity.z * 1.5;
      }

      // When no yaw input, apply damping to stop rotation
      if (Math.abs(yawRate) < 0.01) {
        // Apply damping proportional to angular velocity
        yawTorque = -angularVelocity.y * 2.0;
      }

      motorOutputs = {
        pitch: pitchTorque,
        roll: rollTorque,
        yaw: yawTorque,
        throttle: setpoints.throttle,
      };
    }

    // Get wind forces at current drone position
    const windAtPosition = getWindAtPosition(
      { x: position.x, y: position.y, z: position.z },
      state.clock.elapsedTime
    );
    const wind = new THREE.Vector3(
      windAtPosition.x,
      windAtPosition.y,
      windAtPosition.z
    );

    // Get obstacle AABBs for collision detection
    const obstacleAABBs = getObstacleAABBs();

    // Skip physics update if we just teleported
    if (skipPhysicsFrames.current > 0) {
      skipPhysicsFrames.current--;
      return; // Skip this frame entirely
    }

    // Update physics with collision detection
    const physicsResult = dronePhysics.current.update(
      { position, rotation, velocity, angularVelocity },
      motorOutputs,
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
    // Use quaternion to match the body-frame rotation used in physics thrust
    droneRef.current.position.copy(newState.position);

    // Build rotation using same order as thrust: yaw first, then pitch/roll
    const yawQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      newState.rotation.y
    );
    const pitchQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      newState.rotation.x
    );
    const rollQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      newState.rotation.z
    );

    // Apply in order: yaw, then pitch, then roll (body-frame)
    const finalQuat = new THREE.Quaternion();
    finalQuat.multiply(yawQuat);
    finalQuat.multiply(pitchQuat);
    finalQuat.multiply(rollQuat);

    droneRef.current.quaternion.copy(finalQuat);

    // Update telemetry
    setTelemetry({
      altitude: newState.position.y,
      speed: newState.velocity.length(),
      pitch: newState.rotation.x * (180 / Math.PI),
      roll: newState.rotation.z * (180 / Math.PI),
      yaw: newState.rotation.y * (180 / Math.PI),
      throttle: setpoints.throttle,
    });

    // Update camera based on mode
    const camera = state.camera;

    if (cameraMode === "topView") {
      // Top-down view for mission planning
      const { topViewHeight } = useCamera.getState();
      const dronePos = newState.position;

      // Position camera directly above drone
      const targetPosition = new THREE.Vector3(
        dronePos.x,
        topViewHeight,
        dronePos.z
      );

      // Smooth transition to top view
      camera.position.lerp(targetPosition, delta * 2);

      // Look straight down at drone
      camera.lookAt(dronePos.x, 0, dronePos.z);
      camera.up.set(0, 0, -1); // North is up in top view
    } else if (cameraMode === "follow") {
      // Reset camera up vector when returning from top view
      camera.up.set(0, 1, 0);

      // Follow camera: using customizable offset with drone rotation
      const offsetVector = new THREE.Vector3(
        followOffset.x,
        followOffset.y,
        followOffset.z
      );
      offsetVector.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        newState.rotation.y
      );

      const idealPosition = new THREE.Vector3(
        newState.position.x + offsetVector.x,
        newState.position.y + followOffset.y, // Keep vertical offset independent
        newState.position.z + offsetVector.z
      );

      // Smoother camera movement with dynamic lerp
      const currentDistance = camera.position.distanceTo(idealPosition);
      const lerpFactor = THREE.MathUtils.clamp(
        delta * (2 + currentDistance),
        0.02,
        0.15
      );

      camera.position.lerp(idealPosition, lerpFactor);
      camera.lookAt(newState.position);
    } else if (cameraMode === "fpv") {
      // FPV camera: mounted on the drone, tilting with roll and pitch
      const droneEuler = new THREE.Euler(
        newState.rotation.x,
        newState.rotation.y,
        newState.rotation.z,
        "YXZ"
      );

      // Calculate drone's orientation vectors with full rotation
      const droneForward = new THREE.Vector3(0, 0, -1);
      droneForward.applyEuler(droneEuler);

      const droneUp = new THREE.Vector3(0, 1, 0);
      droneUp.applyEuler(droneEuler);

      const droneRight = new THREE.Vector3(1, 0, 0);
      droneRight.applyEuler(droneEuler);

      // Camera position: mounted on the drone with offsets
      const fpvPosition = new THREE.Vector3(
        newState.position.x +
          droneUp.x * fpvHeight +
          droneForward.x * fpvOffset.z +
          droneRight.x * fpvOffset.x +
          droneUp.x * fpvOffset.y,
        newState.position.y +
          droneUp.y * fpvHeight +
          droneForward.y * fpvOffset.z +
          droneRight.y * fpvOffset.x +
          droneUp.y * fpvOffset.y,
        newState.position.z +
          droneUp.z * fpvHeight +
          droneForward.z * fpvOffset.z +
          droneRight.z * fpvOffset.x +
          droneUp.z * fpvOffset.y
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
    } else if (cameraMode === "manual") {
      // Manual mode - reset up vector for OrbitControls
      camera.up.set(0, 1, 0);
    }
  });

  return (
    <>
      {/* Manual Camera Controls - Only active in manual mode */}
      {cameraMode === "manual" && (
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
          const {
            mode,
            setStart,
            setTarget,
            addCorridorPoint,
            setStructureCenter,
          } = useMission.getState();
          const p: THREE.Vector3 = e.point.clone();

          if (mode === "selectStart") {
            setStart(p);
          } else if (mode === "selectTarget") {
            setTarget(p);
          } else if (mode === "addingCorridor") {
            addCorridorPoint(p);
          } else if (mode === "addingStructure") {
            setStructureCenter(p);
          }
        }}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Drone */}
      <group ref={droneRef}>
        <DroneModelSwitcher />

        {/* Debug: Thick yellow line showing forward direction (30m) */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -15]}>
          <cylinderGeometry args={[0.15, 0.15, 30, 8]} />
          <meshBasicMaterial color="yellow" />
        </mesh>
      </group>

      {/* Wind Sources Visualization */}
      {windSources.map((source) => (
        <group key={source.id} visible={source.enabled}>
          <mesh
            position={[source.position.x, source.position.y, source.position.z]}
          >
            <cylinderGeometry
              args={[source.radius, source.radius, source.radius * 0.3, 16]}
            />
            <meshBasicMaterial
              color={source.enabled ? "#00ff0030" : "#66666630"}
              transparent
              opacity={0.2}
              wireframe
            />
          </mesh>
          <arrowHelper
            args={[
              new THREE.Vector3(
                Math.cos(source.direction),
                0,
                Math.sin(source.direction)
              ),
              new THREE.Vector3(
                source.position.x,
                source.position.y + source.radius * 0.2,
                source.position.z
              ),
              source.force * 1.5,
              source.enabled ? 0x00ff00 : 0x666666,
              source.force * 0.3,
              source.force * 0.2,
            ]}
          />
        </group>
      ))}

      {/* Mission markers (start/stop/scan points) - Large and visible */}
      {(() => {
        const { startPoint, targetPoint, scanPattern, tempCorridorPoints } =
          useMission.getState();
        const markers: any[] = [];

        if (startPoint) {
          markers.push(
            <group
              key="mission_start"
              position={[startPoint.x, startPoint.y, startPoint.z]}
            >
              {/* Tall cylinder marker */}
              <mesh position={[0, 3, 0]}>
                <cylinderGeometry args={[0.5, 0.8, 6, 16]} />
                <meshStandardMaterial
                  color="#00ff00"
                  emissive="#00ff00"
                  emissiveIntensity={0.5}
                />
              </mesh>
              {/* Base platform */}
              <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[1.5, 1.5, 0.2, 32]} />
                <meshStandardMaterial
                  color="#00ff00"
                  emissive="#00ff00"
                  emissiveIntensity={0.3}
                />
              </mesh>
              {/* Top sphere */}
              <mesh position={[0, 6.5, 0]}>
                <sphereGeometry args={[0.8, 16, 16]} />
                <meshStandardMaterial
                  color="#00ff00"
                  emissive="#00ff00"
                  emissiveIntensity={0.8}
                />
              </mesh>
            </group>
          );
        }

        if (targetPoint) {
          markers.push(
            <group
              key="mission_target"
              position={[targetPoint.x, targetPoint.y, targetPoint.z]}
            >
              {/* Tall cylinder marker */}
              <mesh position={[0, 3, 0]}>
                <cylinderGeometry args={[0.5, 0.8, 6, 16]} />
                <meshStandardMaterial
                  color="#ff0000"
                  emissive="#ff0000"
                  emissiveIntensity={0.5}
                />
              </mesh>
              {/* Base platform */}
              <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[1.5, 1.5, 0.2, 32]} />
                <meshStandardMaterial
                  color="#ff0000"
                  emissive="#ff0000"
                  emissiveIntensity={0.3}
                />
              </mesh>
              {/* Top cone */}
              <mesh position={[0, 6.5, 0]} rotation={[0, 0, 0]}>
                <coneGeometry args={[0.8, 1.5, 16]} />
                <meshStandardMaterial
                  color="#ff0000"
                  emissive="#ff0000"
                  emissiveIntensity={0.8}
                />
              </mesh>
            </group>
          );
        }

        // Render scan pattern visualization
        if (scanPattern) {
          const center = scanPattern.center;

          if (scanPattern.type === "corridor") {
            // Render corridor waypoints
            scanPattern.waypoints.forEach((point, index) => {
              markers.push(
                <group
                  key={`corridor_${index}`}
                  position={[point.x, point.y, point.z]}
                >
                  <mesh position={[0, 2, 0]}>
                    <cylinderGeometry args={[0.3, 0.5, 4, 12]} />
                    <meshStandardMaterial
                      color="#ffaa00"
                      emissive="#ffaa00"
                      emissiveIntensity={0.5}
                    />
                  </mesh>
                  <mesh position={[0, 0.1, 0]}>
                    <cylinderGeometry args={[0.8, 0.8, 0.2, 16]} />
                    <meshStandardMaterial
                      color="#ffaa00"
                      emissive="#ffaa00"
                      emissiveIntensity={0.3}
                    />
                  </mesh>
                </group>
              );

              // Draw thick transparent line to next waypoint
              if (index < scanPattern.waypoints.length - 1) {
                const nextPoint = scanPattern.waypoints[index + 1];
                const start = new THREE.Vector3(
                  point.x,
                  point.y + 0.2,
                  point.z
                );
                const end = new THREE.Vector3(
                  nextPoint.x,
                  nextPoint.y + 0.2,
                  nextPoint.z
                );
                const direction = end.clone().sub(start);
                const length = direction.length();
                const midpoint = start
                  .clone()
                  .add(direction.multiplyScalar(0.5));

                // Calculate rotation to align cylinder with direction
                const axis = new THREE.Vector3(0, 1, 0);
                const quaternion = new THREE.Quaternion();
                quaternion.setFromUnitVectors(
                  axis,
                  direction.clone().normalize()
                );
                const euler = new THREE.Euler().setFromQuaternion(quaternion);

                markers.push(
                  <mesh
                    key={`corridor_line_${index}`}
                    position={[midpoint.x, midpoint.y, midpoint.z]}
                    rotation={[euler.x, euler.y, euler.z]}
                  >
                    <cylinderGeometry args={[0.5, 0.5, length, 16]} />
                    <meshBasicMaterial
                      color="#ffaa00"
                      transparent
                      opacity={0.5}
                    />
                  </mesh>
                );
              }
            });
          } else if (scanPattern.type === "structure") {
            // Circular scan around center
            const radius = scanPattern.radius || 15;
            const numPoints = 8;
            for (let i = 0; i < numPoints; i++) {
              const angle = (i / numPoints) * Math.PI * 2;
              const x = center.x + Math.cos(angle) * radius;
              const z = center.z + Math.sin(angle) * radius;
              markers.push(
                <group key={`structure_${i}`} position={[x, center.y, z]}>
                  <mesh position={[0, 2, 0]}>
                    <cylinderGeometry args={[0.3, 0.5, 4, 12]} />
                    <meshStandardMaterial
                      color="#00ffaa"
                      emissive="#00ffaa"
                      emissiveIntensity={0.5}
                    />
                  </mesh>
                  <mesh position={[0, 0.1, 0]}>
                    <cylinderGeometry args={[0.8, 0.8, 0.2, 16]} />
                    <meshStandardMaterial
                      color="#00ffaa"
                      emissive="#00ffaa"
                      emissiveIntensity={0.3}
                    />
                  </mesh>
                </group>
              );
            }
            // Circle outline
            markers.push(
              <mesh
                key="structure_circle"
                position={[center.x, center.y + 0.1, center.z]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <ringGeometry args={[radius - 0.5, radius + 0.5, 32]} />
                <meshBasicMaterial color="#00ffaa" transparent opacity={0.5} />
              </mesh>
            );
          }
        }

        // Render temporary corridor points (while building path)
        tempCorridorPoints.forEach((point, index) => {
          markers.push(
            <group
              key={`temp_corridor_${index}`}
              position={[point.x, point.y, point.z]}
            >
              <mesh position={[0, 2, 0]}>
                <cylinderGeometry args={[0.3, 0.5, 4, 12]} />
                <meshStandardMaterial
                  color="#ffaa00"
                  emissive="#ffaa00"
                  emissiveIntensity={0.5}
                />
              </mesh>
              <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.8, 0.8, 0.2, 16]} />
                <meshStandardMaterial
                  color="#ffaa00"
                  emissive="#ffaa00"
                  emissiveIntensity={0.3}
                />
              </mesh>
            </group>
          );

          // Draw thick transparent line to next point
          if (index < tempCorridorPoints.length - 1) {
            const nextPoint = tempCorridorPoints[index + 1];
            const start = new THREE.Vector3(point.x, point.y + 0.2, point.z);
            const end = new THREE.Vector3(
              nextPoint.x,
              nextPoint.y + 0.2,
              nextPoint.z
            );
            const direction = end.clone().sub(start);
            const length = direction.length();
            const midpoint = start.clone().add(direction.multiplyScalar(0.5));

            // Calculate rotation to align cylinder with direction
            const axis = new THREE.Vector3(0, 1, 0);
            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(axis, direction.clone().normalize());
            const euler = new THREE.Euler().setFromQuaternion(quaternion);

            markers.push(
              <mesh
                key={`temp_corridor_line_${index}`}
                position={[midpoint.x, midpoint.y, midpoint.z]}
                rotation={[euler.x, euler.y, euler.z]}
              >
                <cylinderGeometry args={[0.5, 0.5, length, 16]} />
                <meshBasicMaterial color="#ffaa00" transparent opacity={0.5} />
              </mesh>
            );
          }
        });

        return markers;
      })()}
    </>
  );
}
