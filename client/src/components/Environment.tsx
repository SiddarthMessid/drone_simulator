import ModularTerrainEnvironment from './ModularTerrainEnvironment';
import { useEnvironment } from "../lib/stores/useEnvironment";

export default function Environment() {
  const { getAllObstacles } = useEnvironment();
  const allObstacles = getAllObstacles();

  return (
    <>
      <ModularTerrainEnvironment />

      {/* Target Landing Pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} receiveShadow>
        <circleGeometry args={[3, 32]} />
        <meshPhongMaterial color="#ffaa00" transparent opacity={0.7} />
      </mesh>

      {/* Landing Pad Center */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]} receiveShadow>
        <circleGeometry args={[0.5, 16]} />
        <meshPhongMaterial color="#ff4400" />
      </mesh>

      {/* All Obstacles (Default + User-Added) */}
      {allObstacles.map((obstacle) => (
        <mesh 
          key={obstacle.id} 
          position={[obstacle.position.x, obstacle.position.y, obstacle.position.z]} 
          castShadow 
          receiveShadow
        >
          <boxGeometry args={[obstacle.size.x, obstacle.size.y, obstacle.size.z]} />
          <meshPhongMaterial color={obstacle.color} />
        </mesh>
      ))}
    </>
  );
}
