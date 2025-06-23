import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useEnvironment } from "../lib/stores/useEnvironment";

export default function Environment() {
  const { obstacles, environmentSize } = useEnvironment();
  const grassTexture = useTexture("/textures/grass.png");
  
  // Configure texture repeat
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(20, 20);

  return (
    <>
      {/* Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[environmentSize.width, environmentSize.height]} />
        <meshLambertMaterial map={grassTexture} />
      </mesh>

      {/* Boundary Markers */}
      {Array.from({ length: 20 }, (_, i) => (
        <group key={i}>
          {/* Perimeter posts */}
          <mesh position={[50, 2, (i - 10) * 10]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 4, 8]} />
            <meshPhongMaterial color="#8B4513" />
          </mesh>
          <mesh position={[-50, 2, (i - 10) * 10]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 4, 8]} />
            <meshPhongMaterial color="#8B4513" />
          </mesh>
          <mesh position={[(i - 10) * 10, 2, 50]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 4, 8]} />
            <meshPhongMaterial color="#8B4513" />
          </mesh>
          <mesh position={[(i - 10) * 10, 2, -50]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 4, 8]} />
            <meshPhongMaterial color="#8B4513" />
          </mesh>
        </group>
      ))}

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

      {/* Reference Grid */}
      <gridHelper args={[100, 50, "#444444", "#222222"]} position={[0, -0.45, 0]} />

      {/* Default Obstacles for navigation practice */}
      {[
        { pos: [15, 5, 15], size: [2, 10, 2] },
        { pos: [-15, 3, -15], size: [3, 6, 3] },
        { pos: [20, 4, -20], size: [1.5, 8, 1.5] },
        { pos: [-25, 6, 10], size: [2.5, 12, 2.5] }
      ].map((obstacle, index) => (
        <mesh key={`default-${index}`} position={obstacle.pos as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={obstacle.size as [number, number, number]} />
          <meshPhongMaterial color="#666666" />
        </mesh>
      ))}

      {/* Custom User-Added Obstacles */}
      {obstacles.map((obstacle) => (
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

      {/* Sky box simulation with fog */}
      <fog attach="fog" args={['#87ceeb', 50, 200]} />
    </>
  );
}
