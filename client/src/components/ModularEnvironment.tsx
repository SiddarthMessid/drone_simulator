import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useEnvironment, Obstacle } from "../lib/stores/useEnvironment";
import { modelRegistry } from "../lib/models/modelRegistry";

type ModelCache = {
  [key: string]: THREE.Group;
};

export default function ModularEnvironment() {
  const {
    environmentSize,
    getAllObstacles,
    groundTexture: storeGroundTexture,
    skyColor,
  } = useEnvironment();
  const allObstacles = getAllObstacles();

  const [modelCache, setModelCache] = useState<ModelCache>({});
  const [loadingModels, setLoadingModels] = useState(true);

  const textureToLoad = storeGroundTexture || "/textures/grass.png";
  const groundTexture = useTexture(textureToLoad);
  const skyTexture = useTexture("/textures/sky.png");

  // Configure texture repeat
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(20, 20);

  // LOD management
  const cameraRef = useRef<THREE.Camera>();
  const lodGroups = useRef<Map<string, THREE.LOD>>(new Map());

  useFrame((state) => {
    if (!cameraRef.current) {
      cameraRef.current = state.camera;
    }

    // Update LODs based on camera position
    lodGroups.current.forEach((lod) => {
      lod.update(cameraRef.current!);
    });
  });

  // Load all required models
  useEffect(() => {
    const modelsToLoad = new Set(
      allObstacles.filter((obs) => obs.modelId).map((obs) => obs.modelId!)
    );

    if (modelsToLoad.size === 0) {
      setLoadingModels(false);
      return;
    }

    const loadModel = async (modelId: string) => {
      try {
        const gltf = await modelRegistry.loadModel(modelId);
        const model = gltf.scene.clone();

        // Apply model definition transforms
        const def = modelRegistry.getDefinition(modelId);
        if (def?.scale) {
          model.scale.copy(def.scale);
        }
        if (def?.rotation) {
          model.rotation.copy(def.rotation);
        }

        setModelCache((prev) => ({
          ...prev,
          [modelId]: model,
        }));
      } catch (error) {
        console.error(`Failed to load model ${modelId}:`, error);
      }
    };

    Promise.all(Array.from(modelsToLoad).map(loadModel)).finally(() =>
      setLoadingModels(false)
    );
  }, [allObstacles]);

  const renderObstacle = (obstacle: Obstacle) => {
    if (obstacle.modelId) {
      const model = modelCache[obstacle.modelId];
      if (!model) return null; // Still loading or failed to load

      const def = modelRegistry.getDefinition(obstacle.modelId);
      if (!def) return null;

      // Create LOD group if model has LOD configurations
      if (def.lod) {
        const lodGroup = new THREE.LOD();
        lodGroup.position.set(
          obstacle.position.x,
          obstacle.position.y,
          obstacle.position.z
        );
        if (obstacle.rotation) {
          lodGroup.rotation.set(
            obstacle.rotation.x,
            obstacle.rotation.y,
            obstacle.rotation.z
          );
        }

        // Add LOD levels
        def.lod.distances.forEach((distance, index) => {
          const levelModel = model.clone();
          lodGroup.addLevel(levelModel, distance);
        });

        lodGroups.current.set(obstacle.id, lodGroup);
        return lodGroup;
      }

      // Regular model without LOD
      return (
        <primitive
          key={obstacle.id}
          object={model.clone()}
          position={[
            obstacle.position.x,
            obstacle.position.y,
            obstacle.position.z,
          ]}
          rotation={
            obstacle.rotation
              ? [obstacle.rotation.x, obstacle.rotation.y, obstacle.rotation.z]
              : [0, 0, 0]
          }
        />
      );
    }

    // Fallback to basic geometry for obstacles without models
    return (
      <mesh
        key={obstacle.id}
        position={[
          obstacle.position.x,
          obstacle.position.y,
          obstacle.position.z,
        ]}
        rotation={
          obstacle.rotation
            ? [obstacle.rotation.x, obstacle.rotation.y, obstacle.rotation.z]
            : [0, 0, 0]
        }
        castShadow
        receiveShadow
      >
        <boxGeometry
          args={[obstacle.size.x, obstacle.size.y, obstacle.size.z]}
        />
        <meshPhongMaterial color={obstacle.color || "#666666"} />
      </mesh>
    );
  };

  return (
    <>
      {/* Ground Plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        receiveShadow
      >
        <planeGeometry args={[environmentSize.width, environmentSize.height]} />
        <meshLambertMaterial map={groundTexture} />
      </mesh>

      {/* Grid Helper */}
      <gridHelper
        args={[100, 50, "#444444", "#222222"]}
        position={[0, -0.45, 0]}
      />

      {/* Boundary Markers */}
      <BoundaryMarkers environmentSize={environmentSize} />

      {/* Obstacles are now rendered in Environment.tsx as InteractiveObstacles */}

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

function BoundaryMarkers({
  environmentSize,
}: {
  environmentSize: { width: number; height: number };
}) {
  const halfWidth = environmentSize.width / 2;
  const halfHeight = environmentSize.height / 2;
  const postHeight = 2;
  const spacing = 10;

  const posts = [];

  // Generate boundary posts
  for (let x = -halfWidth; x <= halfWidth; x += spacing) {
    posts.push(
      <mesh
        key={`north-${x}`}
        position={[x, postHeight / 2, -halfHeight]}
        castShadow
      >
        <boxGeometry args={[0.2, postHeight, 0.2]} />
        <meshPhongMaterial color="#ff0000" />
      </mesh>,
      <mesh
        key={`south-${x}`}
        position={[x, postHeight / 2, halfHeight]}
        castShadow
      >
        <boxGeometry args={[0.2, postHeight, 0.2]} />
        <meshPhongMaterial color="#ff0000" />
      </mesh>
    );
  }

  for (let z = -halfHeight; z <= halfHeight; z += spacing) {
    posts.push(
      <mesh
        key={`west-${z}`}
        position={[-halfWidth, postHeight / 2, z]}
        castShadow
      >
        <boxGeometry args={[0.2, postHeight, 0.2]} />
        <meshPhongMaterial color="#ff0000" />
      </mesh>,
      <mesh
        key={`east-${z}`}
        position={[halfWidth, postHeight / 2, z]}
        castShadow
      >
        <boxGeometry args={[0.2, postHeight, 0.2]} />
        <meshPhongMaterial color="#ff0000" />
      </mesh>
    );
  }

  return <>{posts}</>;
}
