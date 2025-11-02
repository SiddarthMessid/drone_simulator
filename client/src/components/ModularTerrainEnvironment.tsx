import { useTexture } from "@react-three/drei";
import TerrainMesh from "./TerrainMesh";
import BoundaryMarkers from "./BoundaryMarkers";
import { useEnvironment } from "../lib/stores/useEnvironment";
import { useTerrainConfigStore } from "../lib/hooks/useTerrainConfig";
import { useSceneMode } from "../lib/stores/useSceneMode";
import * as THREE from "three";
import { useMemo } from "react";

export default function ModularTerrainEnvironment() {
  const { environmentSize, skyColor } = useEnvironment();
  const { config } = useTerrainConfigStore();
  const { isFlat } = useTerrainConfigStore();
  const { mode: sceneMode } = useSceneMode();

  // Load textures
  const textures = {
    grass: useTexture("/textures/grass.png"),
    rock: useTexture("/textures/asphalt.png"),
    snow: useTexture("/textures/sand.jpg"),
    dirt: useTexture("/textures/wood.jpg"),
  };

  // Configure texture repeat
  Object.values(textures).forEach((texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
  });

  const skyTexture = useTexture("/textures/sky.png");

  // Create checkerboard texture for HIL mode
  const checkerboardTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const squareSize = 64;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        ctx.fillStyle = (i + j) % 2 === 0 ? "#ffffff" : "#000000";
        ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    return texture;
  }, []);

  return (
    <>
      {/* Terrain */}
      {sceneMode === "hil" ? (
        // HIL Mode: Simple flat plane with checkerboard
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[1000, 1000]} />
          <meshStandardMaterial map={checkerboardTexture} />
        </mesh>
      ) : (
        // Simulation Mode: Normal terrain
        <TerrainMesh textures={textures} config={config} />
      )}
      {/* Grid Helper (only for flat mode in simulation) */}
      {isFlat && sceneMode === "simulation" && (
        <gridHelper
          args={[100, 50, "#444444", "#222222"]}
          position={[0, 0.01, 0]}
        />
      )}

      {/* Distant procedural mountains layer (infinite-looking) */}
      {!isFlat &&
        (() => {
          try {
            // Shader material that displaces a low-resolution plane using FBM in the vertex shader
            const mountainMaterial = new THREE.ShaderMaterial({
              uniforms: {
                grassTexture: { value: textures.grass },
                rockTexture: { value: textures.rock },
                time: { value: 0 },
                tileScale: { value: 0.0006 }, // how the noise tiles across the huge plane
                heightScale: { value: 80.0 },
              },
              vertexShader: `
              varying vec2 vUv;
              varying float vHeight;

              // Hash / noise helpers
              highp float rand(vec2 co){
                return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
              }

              float noise(vec2 p){
                vec2 i = floor(p);
                vec2 f = fract(p);
                float a = rand(i);
                float b = rand(i + vec2(1.0, 0.0));
                float c = rand(i + vec2(0.0, 1.0));
                float d = rand(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
              }

              float fbm(vec2 p) {
                float v = 0.0;
                float a = 0.5;
                mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
                for (int i = 0; i < 6; i++) {
                  v += a * noise(p);
                  p = m * p * 1.9;
                  a *= 0.5;
                }
                return v;
              }

              uniform float tileScale;
              uniform float heightScale;

              void main() {
                vUv = uv;
                // compute a world-space uv scaled very small so the huge plane samples noise gradually
                vec2 worldUv = (position.xz) * tileScale;
                float n = fbm(worldUv * 1.0);
                
                // Distance from center - fade out closer areas
                float distFromCenter = length(position.xz);
                float distanceFade = smoothstep(500.0, 2000.0, distFromCenter);
                
                float h = n * heightScale * 0.0009 * distanceFade; // small vertical exaggeration for silhouette
                vec3 pos = position + vec3(0.0, h, 0.0);
                vHeight = pos.y;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
              }
            `,
              fragmentShader: `
              uniform sampler2D grassTexture;
              uniform sampler2D rockTexture;
              varying vec2 vUv;
              varying float vHeight;

              void main() {
                // Simple height-based blend between grass (low) and rock (high)
                float gh = smoothstep(-0.5, 20.0, vHeight);
                vec4 g = texture2D(grassTexture, vUv * 8.0);
                vec4 r = texture2D(rockTexture, vUv * 8.0);
                vec4 color = mix(g, r, gh);
                
                // Only show distant mountains, fade out closer areas completely
                float distanceFade = smoothstep(0.0, 200.0, length(vUv - vec2(0.5, 0.5)) * 20000.0);
                float alpha = distanceFade * (1.0 - smoothstep(-10.0, 60.0, vHeight));
                alpha = clamp(alpha, 0.0, 0.6);
                
                // Discard fragments that are too close or too transparent
                if (alpha < 0.01) discard;
                
                gl_FragColor = vec4(color.rgb, alpha);
              }
            `,
              transparent: true,
              side: THREE.FrontSide,
            });

            // Make the distant mountain layer not write depth so it won't z-fight with the close terrain mesh.
            mountainMaterial.depthWrite = false;

            // Low-resolution grid is enough because displacement comes from shader
            return (
              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -50.0, 0]}
                receiveShadow
                renderOrder={-1}
              >
                <planeGeometry args={[20000, 20000, 128, 128]} />
                {/* Make the distant mountain layer not write depth so it won't z-fight with the close terrain mesh. */}
                <primitive object={mountainMaterial} attach="material" />
              </mesh>
            );
          } catch (e) {
            return null;
          }
        })()}

      {/* Boundary Markers - Only show in flat terrain */}
      {isFlat && <BoundaryMarkers environmentSize={environmentSize} />}

      {/* Note: Invisible boundary walls are handled in physics (useEnvironment.getObstacleAABBs) */}

      {/* Skybox - Only in simulation mode */}
      {sceneMode === "simulation" && (
        <mesh>
          <sphereGeometry args={[500, 32, 32]} />
          {skyColor ? (
            <meshBasicMaterial color={skyColor} side={THREE.BackSide} />
          ) : (
            <meshBasicMaterial map={skyTexture} side={THREE.BackSide} />
          )}
        </mesh>
      )}

      {/* HIL Mode: Simple directional light instead of skybox */}
      {sceneMode === "hil" && (
        <>
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[10, 20, 10]}
            intensity={1.0}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={100}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
          />
        </>
      )}
    </>
  );
}
