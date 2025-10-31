import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMultiDrone } from "../lib/stores/useMultiDrone";
import DroneModelSwitcher from "./DroneModelSwitcher";
import { PIDController } from "../lib/pidController";
import { DronePhysics } from "../lib/dronePhysics";
import { useWind } from "../lib/stores/useWind";
import { useEnvironment } from "../lib/stores/useEnvironment";
import { useAudio } from "../lib/stores/useAudio";
import { useCamera } from "../lib/stores/useCamera";

export default function DroneFlock() {
  const {
    state: { enabled, drones, dronePositions, droneColors },
    updateDronePosition,
    updateMainDroneFormation,
  } = useMultiDrone();

  const droneRefs = useRef<Map<string, THREE.Group>>(new Map());
  const pidControllers = useRef<Map<string, PIDController>>(new Map());
  const dronePhysics = useRef<Map<string, DronePhysics>>(new Map());

  const { getWindAtPosition } = useWind();
  const { getObstacleAABBs } = useEnvironment();
  const { playHit } = useAudio();
  const { mode: cameraMode, followOffset } = useCamera();

  // Initialize physics and controllers for each drone
  // Use array of drone IDs as dependency to detect when drones are added/removed
  const droneIds = Array.from(drones.keys());

  useEffect(() => {
    drones.forEach((droneController, id) => {
      if (!pidControllers.current.has(id)) {
        console.log(`Initializing PID controller for drone ${id}`);
        pidControllers.current.set(
          id,
          new PIDController(droneController.getPIDParams())
        );
      }
      if (!dronePhysics.current.has(id)) {
        console.log(`Initializing physics for drone ${id}`);
        dronePhysics.current.set(id, new DronePhysics());

        // Initialize drone state with its stored position
        const initialPos = dronePositions.get(id);
        if (initialPos) {
          const initialState = {
            position: initialPos.clone(),
            rotation: new THREE.Vector3(0, 0, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            angularVelocity: new THREE.Vector3(0, 0, 0),
          };
          droneController.updateState(initialState);
          console.log(`Initialized drone ${id} at position:`, initialPos);
        }
      }
    });

    // Clean up removed drones
    pidControllers.current.forEach((_, id) => {
      if (!drones.has(id)) {
        console.log(`Removing PID controller for drone ${id}`);
        pidControllers.current.delete(id);
      }
    });

    dronePhysics.current.forEach((_, id) => {
      if (!drones.has(id)) {
        console.log(`Removing physics for drone ${id}`);
        dronePhysics.current.delete(id);
      }
    });
  }, [droneIds.length, droneIds.join(","), drones, dronePositions]);

  useFrame((state, delta) => {
    const obstacleAABBs = getObstacleAABBs();

    // Update all fleet drones to follow the main drone continuously
    updateMainDroneFormation();

    // Update each drone's physics
    drones.forEach((droneController, id) => {
      const droneRef = droneRefs.current.get(id);
      if (!droneRef) return;

      const pidController = pidControllers.current.get(id);
      const physics = dronePhysics.current.get(id);
      if (!pidController || !physics) return;

      const droneState = droneController.getState();
      const setpoints = droneController.getSetpoints();

      // Debug logging for first frame only
      if (state.clock.elapsedTime < 0.1) {
        console.log(`Drone ${id} setpoints:`, setpoints);
        console.log(`Drone ${id} position:`, droneState.position);
      }

      // Convert DroneState to PIDState
      const pidState = {
        pitch: droneState.rotation.x,
        roll: droneState.rotation.z,
        yaw: droneState.rotation.y,
        altitude: droneState.position.y,
      };

      const pidOutputs = pidController.update(pidState, setpoints, delta);

      // Get wind forces at current drone position
      const windAtPosition = getWindAtPosition(
        droneState.position,
        state.clock.elapsedTime
      );
      const wind = new THREE.Vector3(
        windAtPosition.x,
        windAtPosition.y,
        windAtPosition.z
      );

      // Update physics with collision detection
      const { newState, collision } = physics.update(
        droneState,
        pidOutputs,
        wind,
        delta,
        obstacleAABBs
      );

      // Play hit sound on collision
      if (collision.collided) {
        console.log(`Drone ${id} collision detected!`, collision);
        playHit();
      }

      // Update drone controller state
      droneController.updateState(newState);

      // Update drone model position and rotation
      droneRef.position.copy(newState.position);
      droneRef.rotation.set(
        newState.rotation.x,
        newState.rotation.y,
        newState.rotation.z
      );

      // Update stored position for formation/swarm calculations
      updateDronePosition(id, newState.position);
    });
  });

  return enabled ? (
    <>
      {Array.from(drones.keys()).map((id) => {
        const position = dronePositions.get(id);
        if (!position) return null;

        return (
          <group
            key={id}
            ref={(el) => el && droneRefs.current.set(id, el)}
            position={[position.x, position.y, position.z]}
          >
            <DroneModelSwitcher color={droneColors.get(id) || "#2a2a2a"} />
          </group>
        );
      })}
    </>
  ) : null;
}
