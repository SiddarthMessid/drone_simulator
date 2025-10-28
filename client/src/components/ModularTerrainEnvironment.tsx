import { useTexture } from "@react-three/drei";
import TerrainMesh from "./TerrainMesh";
import BoundaryMarkers from "./BoundaryMarkers";
import { useEnvironment } from "../lib/stores/useEnvironment";
import { useTerrainConfigStore } from "../lib/hooks/useTerrainConfig";
import * as THREE from "three";

export default function ModularTerrainEnvironment() {
  const { environmentSize, skyColor } = useEnvironment();
  const { config } = useTerrainConfigStore();
  const { isFlat } = useTerrainConfigStore();

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
  <TerrainMesh textures={textures} config={config} />
      {/* Grid Helper (only for flat mode) */}
      {isFlat && <gridHelper args={[100, 50, "#444444", "#222222"]} position={[0, -0.45, 0]} />}

      {/* Large distant tiled ground to hide terrain edges and give an "infinite" feeling */}
      {isFlat && (() => {
        try {
          // Clone a texture so we can set a very large repeat without affecting the close-up terrain
          const distantTexture = textures.grass.clone();
          distantTexture.wrapS = distantTexture.wrapT = THREE.RepeatWrapping;
          // Large repeat to avoid obvious repetition at horizon
          distantTexture.repeat.set(2000, 2000);
          // Use mipmaps and linear filtering to reduce shimmering
          distantTexture.generateMipmaps = true;
          distantTexture.minFilter = THREE.LinearMipMapLinearFilter;
          distantTexture.magFilter = THREE.LinearFilter;
          // modest anisotropy to reduce aliasing at glancing angles
          // If the renderer sets anisotropy later this may be overridden.
          // @ts-ignore
          distantTexture.anisotropy = Math.min(8, 4);

          return (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.71, 0]} receiveShadow renderOrder={0}>
              <planeGeometry args={[20000, 20000]} />
              <meshPhongMaterial map={distantTexture} side={THREE.FrontSide} depthWrite={false} transparent={true} />
            </mesh>
          );
        } catch (e) {
          return null;
        }
      })()}

      {/* Distant procedural mountains layer (infinite-looking) */}
      {!isFlat && (() => {
        try {
          // Shader material that displaces a low-resolution plane using FBM in the vertex shader
          const mountainMaterial = new THREE.ShaderMaterial({
            uniforms: {
              grassTexture: { value: textures.grass },
              rockTexture: { value: textures.rock },
              time: { value: 0 },
              tileScale: { value: 0.0006 }, // how the noise tiles across the huge plane
              heightScale: { value: 120.0 }
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
                float h = n * heightScale * 0.0009; // small vertical exaggeration for silhouette
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
                // fade out alpha towards horizon to blend with sky (invert so distant silhouettes fade)
                float alpha = 1.0 - smoothstep(-10.0, 60.0, vHeight);
                alpha = clamp(alpha, 0.05, 1.0);
                gl_FragColor = vec4(color.rgb, alpha);
              }
            `,
            transparent: true,
            side: THREE.FrontSide
          });

          // Make the distant mountain layer not write depth so it won't z-fight with the close terrain mesh.
          mountainMaterial.depthWrite = false;

          // Low-resolution grid is enough because displacement comes from shader
          return (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, 0]} receiveShadow renderOrder={0}>
              <planeGeometry args={[20000, 20000, 128, 128]} />
              {/* Make the distant mountain layer not write depth so it won't z-fight with the close terrain mesh. */}
              <primitive object={mountainMaterial} attach="material" />
            </mesh>
          );
        } catch (e) {
          return null;
        }
      })()}

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