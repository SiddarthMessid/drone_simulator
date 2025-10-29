import ModularTerrainEnvironment from "./ModularTerrainEnvironment";
import { useEnvironment } from "../lib/stores/useEnvironment";
import { useTerrainConfigStore } from "../lib/hooks/useTerrainConfig";

export default function Environment() {
  const { getAllObstacles } = useEnvironment();
  const allObstacles = getAllObstacles();
  const { isFlat } = useTerrainConfigStore();

  return (
    <>
      <ModularTerrainEnvironment />

      {/* Only show landing pad and obstacles in flat terrain mode */}
      {isFlat && (
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

          {/* All Obstacles (Default + User-Added) */}
          {allObstacles.map((obstacle) => (
            <mesh
              key={obstacle.id}
              position={[
                obstacle.position.x,
                obstacle.position.y,
                obstacle.position.z,
              ]}
              castShadow
              receiveShadow
            >
              <boxGeometry
                args={[obstacle.size.x, obstacle.size.y, obstacle.size.z]}
              />
              <meshPhongMaterial color={obstacle.color} />
            </mesh>
          ))}
        </>
      )}
    </>
  );
}
