import ModularTerrainEnvironment from "./ModularTerrainEnvironment";
import InteractiveObstacle from "./InteractiveObstacle";
import { useEnvironment } from "../lib/stores/useEnvironment";
import { useEnvironmentEditor } from "../lib/stores/useEnvironmentEditor";
import { useTerrainConfigStore } from "../lib/hooks/useTerrainConfig";
import { useSceneMode } from "../lib/stores/useSceneMode";

export default function Environment() {
  const { getAllObstacles, updateObstacle } = useEnvironment();
  const allObstacles = getAllObstacles();
  const { isFlat } = useTerrainConfigStore();
  const { mode: sceneMode } = useSceneMode();

  const {
    selectedObstacleId,
    transformMode,
    enabledAxes,
    setSelectedObstacleId,
  } = useEnvironmentEditor();

  return (
    <>
      <ModularTerrainEnvironment />

      {/* Landing Pad - only in flat terrain mode and simulation mode */}
      {isFlat && sceneMode === "simulation" && (
        <>
          {/* Target Landing Pad */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.05, 0]}
            receiveShadow
          >
            <circleGeometry args={[3, 32]} />
            <meshPhongMaterial color="#ffaa00" transparent opacity={0.7} />
          </mesh>

          {/* Landing Pad Center */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.1, 0]}
            receiveShadow
          >
            <circleGeometry args={[0.5, 16]} />
            <meshPhongMaterial color="#ff4400" />
          </mesh>
        </>
      )}

      {/* All Obstacles (Default + User-Added) - Interactive - Only show in simulation mode */}
      {sceneMode === "simulation" &&
        allObstacles.map((obstacle) => (
          <InteractiveObstacle
            key={obstacle.id}
            obstacle={obstacle}
            isSelected={selectedObstacleId === obstacle.id}
            onSelect={() => setSelectedObstacleId(obstacle.id)}
            onTransform={(position, rotation) => {
              console.log("Updating obstacle:", obstacle.id, {
                position: { x: position.x, y: position.y, z: position.z },
                rotation: {
                  x: (rotation.x * 180) / Math.PI,
                  y: (rotation.y * 180) / Math.PI,
                  z: (rotation.z * 180) / Math.PI,
                },
              });
              updateObstacle(obstacle.id, {
                position: { x: position.x, y: position.y, z: position.z },
                rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
              });
            }}
            transformMode={transformMode}
            enabledAxes={enabledAxes}
          />
        ))}
    </>
  );
}
