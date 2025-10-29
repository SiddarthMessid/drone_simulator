import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMultiDrone } from "../lib/stores/useMultiDrone.simple";
import DroneModel from "./DroneModel";
import { PIDController } from "../lib/pidController";
import { DronePhysics } from "../lib/dronePhysics";
import { useWind } from "../lib/stores/useWind";
import { useEnvironment } from "../lib/stores/useEnvironment";
import { useAudio } from "../lib/stores/useAudio";

export default function DroneFlockSimple() {
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

  // Initialize PID and physics for each drone
  useEffect(() => {
    drones.forEach((controller, id) => {
      if (!pidControllers.current.has(id)) {
        pidControllers.current.set(
          id,
          new PIDController(controller.getPIDParams())
        );
        console.log(`Initialized PID for ${id}`);
      }
      if (!dronePhysics.current.has(id)) {
        dronePhysics.current.set(id, new DronePhysics());
        console.log(`Initialized physics for ${id}`);
      }
    });

    // Cleanup removed drones
    pidControllers.current.forEach((_, id) => {
      if (!drones.has(id)) {
        pidControllers.current.delete(id);
        dronePhysics.current.delete(id);
      }
    });
  }, [drones.size]);

  useFrame((state, delta) => {
    if (!enabled) return;

    const obstacleAABBs = getObstacleAABBs();

    // Update leader position for all drones
    updateMainDroneFormation();

    // Update each drone
    drones.forEach((controller, id) => {
      const droneRef = droneRefs.current.get(id);
      if (!droneRef) return;

      const pidController = pidControllers.current.get(id);
      const physics = dronePhysics.current.get(id);
      if (!pidController || !physics) return;

      // Get current state and setpoints
      const droneState = controller.getState();
      const setpoints = controller.getSetpoints();

      // Convert to PID state
      const pidState = {
        pitch: droneState.rotation.x,
        roll: droneState.rotation.z,
        yaw: droneState.rotation.y,
        altitude: droneState.position.y,
      };

      // Calculate PID outputs
      const pidOutputs = pidController.update(pidState, setpoints, delta);

      // Get wind
      const windAtPosition = getWindAtPosition(
        droneState.position,
        state.clock.elapsedTime
      );
      const wind = new THREE.Vector3(
        windAtPosition.x,
        windAtPosition.y,
        windAtPosition.z
      );

      // Update physics
      const { newState, collision } = physics.update(
        droneState,
        pidOutputs,
        wind,
        delta,
        obstacleAABBs
      );

      if (collision.collided) {
        playHit();
      }

      // Update controller state
      controller.updateState(newState);

      // Update visual
      droneRef.position.copy(newState.position);
      droneRef.rotation.set(
        newState.rotation.x,
        newState.rotation.y,
        newState.rotation.z
      );

      // Update stored position
      updateDronePosition(id, newState.position);
    });
  });

  if (!enabled) return null;

  return (
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
            <DroneModel color={droneColors.get(id) || "#2a2a2a"} />
          </group>
        );
      })}
    </>
  );
}
