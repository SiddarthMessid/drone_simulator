import { useTexture } from "@react-three/drei";
import TerrainMesh from "./TerrainMesh";
import BoundaryMarkers from "./BoundaryMarkers";
import { useEnvironment } from "../lib/stores/useEnvironment";
import { useTerrainConfigStore } from "../lib/hooks/useTerrainConfig";
import * as THREE from "three";

export default function ModularTerrainEnvironment() {
  const { environmentSize, skyColor } = useEnvironment();
  const { config } = useTerrainConfigStore();

  // Load textures
  const textures = {
    grass: useTexture("/textures/grass.png"),
    rock: useTexture("/textures/asphalt.png"),
    snow: useTexture("/textures/sand.jpg"),
    dirt: useTexture("/textures/wood.jpg")
  };

  // Configure texture repeat
  Object.values(textures).forEach(texture => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
  });

  const skyTexture = useTexture("/textures/sky.png");

  return (
    <>
        {/* Terrain */}
      <TerrainMesh textures={textures} config={config} disableCollision={false} />      {/* Grid Helper */}
      <gridHelper args={[100, 50, "#444444", "#222222"]} position={[0, -0.45, 0]} />

      {/* Boundary Markers */}
      <BoundaryMarkers environmentSize={environmentSize} />

      {/* Skybox */}
      <mesh>
        <sphereGeometry args={[500, 32, 32]} />
        {skyColor ? (
          <meshBasicMaterial color={skyColor} side={THREE.BackSide} />
        ) : (
          <meshBasicMaterial map={skyTexture} side={THREE.BackSide} />
        )}
      </mesh>
    </>
  );
}