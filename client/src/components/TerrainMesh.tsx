import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import * as ReactDOM from "react-dom";
import {
  TerrainGenerator,
  TerrainConfig,
  TerrainData,
} from "../lib/terrain/heightmap";
import { useEnvironment } from "../lib/stores/useEnvironment";
import { useTerrainConfigStore } from "../lib/hooks/useTerrainConfig";
import TerrainEditor from "./TerrainEditor";

interface TerrainMeshProps {
  config: TerrainConfig;
  textures: {
    grass: THREE.Texture;
    rock: THREE.Texture;
    snow: THREE.Texture;
    dirt: THREE.Texture;
    normal?: THREE.Texture;
  };
  debug?: boolean;
}

export default function TerrainMesh({
  config,
  textures,
  debug = false,
}: TerrainMeshProps) {
  const meshRef = useRef<THREE.Mesh | null>(null);

  const { isFlat } = useTerrainConfigStore();

  // Generate terrain data
  const terrainData = useMemo(() => {
    // If the user chose a flat terrain, construct a simple constant-height grid
    if (isFlat) {
      const resolution = config.resolution;
      const width = config.width;
      const height = config.height;
      const constantHeight = 0; // Flat terrain at ground level (y=0)

      const positions = new Float32Array(resolution * resolution * 3);
      const normals = new Float32Array(resolution * resolution * 3);
      const uvs = new Float32Array(resolution * resolution * 2);
      const slopeMap = new Float32Array(resolution * resolution);
      const heightMap = new Float32Array(resolution * resolution);

      for (let z = 0; z < resolution; z++) {
        for (let x = 0; x < resolution; x++) {
          const idx = z * resolution + x;
          const vi = idx * 3;
          const ui = idx * 2;

          positions[vi] = (x / (resolution - 1)) * width - width / 2;
          positions[vi + 1] = constantHeight;
          positions[vi + 2] = (z / (resolution - 1)) * height - height / 2;

          // Flat normal pointing up
          normals[vi] = 0;
          normals[vi + 1] = 1;
          normals[vi + 2] = 0;

          uvs[ui] = x / (resolution - 1);
          uvs[ui + 1] = z / (resolution - 1);

          slopeMap[idx] = 0;
          heightMap[idx] = constantHeight;
        }
      }

      // Build indices
      const indices: number[] = [];
      for (let z = 0; z < resolution - 1; z++) {
        for (let x = 0; x < resolution - 1; x++) {
          const topLeft = z * resolution + x;
          const topRight = topLeft + 1;
          const bottomLeft = (z + 1) * resolution + x;
          const bottomRight = bottomLeft + 1;

          indices.push(topLeft, bottomLeft, topRight);
          indices.push(topRight, bottomLeft, bottomRight);
        }
      }

      return {
        heightMap,
        positions,
        normals,
        uvs,
        indices: new Uint32Array(indices),
        slopeMap,
        minHeight: constantHeight,
        maxHeight: constantHeight,
      } as TerrainData;
    }

    // Otherwise fall back to the procedural generator for mountainous/interesting terrain
    const generator = new TerrainGenerator();
    return generator.generate(config);
  }, [config]);

  // Create geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();

    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(terrainData.positions, 3)
    );
    geo.setAttribute(
      "normal",
      new THREE.BufferAttribute(terrainData.normals, 3)
    );
    geo.setAttribute("uv", new THREE.BufferAttribute(terrainData.uvs, 2));
    geo.setAttribute(
      "slope",
      new THREE.BufferAttribute(terrainData.slopeMap, 1)
    );

    geo.setIndex(new THREE.BufferAttribute(terrainData.indices, 1));

    return geo;
  }, [terrainData]);

  // Create shader material
  const material = useMemo(() => {
    // Configure textures
    const textureConfig = {
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      repeat: new THREE.Vector2(8, 8),
    };

    // For flat terrain, we'll use a larger texture repeat to make it more visible
    const textureRepeat = isFlat ? 16 : 8;

    Object.values(textures).forEach((texture) => {
      if (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(textureRepeat, textureRepeat);
      }
    });

    // Use world-space texture sampling and stronger slope/height blending so
    // grass appears correctly on mountain slopes.
    return new THREE.ShaderMaterial({
      uniforms: {
        grassTexture: { value: textures.grass },
        rockTexture: { value: textures.rock },
        snowTexture: { value: textures.snow },
        dirtTexture: { value: textures.dirt },
        normalMap: { value: textures.normal },
        terrainHeight: { value: config.maxHeight },
        snowHeight: { value: config.maxHeight * 0.6 },
        rockHeight: { value: config.maxHeight * 0.25 },
        slopeThreshold: { value: 0.6 },
        tileScale: { value: Math.max(config.width, config.height) / 40.0 },
      },
      vertexShader: `
          varying vec2 vUv;
          varying vec2 vWorldUv;
          varying float vSlope;
          varying float vHeight;
        
          attribute float slope;
        
          void main() {
            vUv = uv;
            vWorldUv = position.xz;
            vSlope = slope;
            vHeight = position.y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
      fragmentShader: `
        uniform sampler2D grassTexture;
        uniform sampler2D rockTexture;
        uniform sampler2D snowTexture;
        uniform sampler2D dirtTexture;
        uniform sampler2D normalMap;
        uniform float terrainHeight;
        uniform float snowHeight;
        uniform float rockHeight;
        uniform float slopeThreshold;
        uniform float tileScale; // world meters per texture repeat

        varying vec2 vUv;
        varying vec2 vWorldUv;
        varying float vSlope;
        varying float vHeight;

        void main() {
          // Convert world-space uv into texture space using tileScale and wrap using fract
          // to avoid extremely large UVs that can cause precision flicker on some GPUs.
          vec2 worldUV = fract(vWorldUv / tileScale);

          // Sample textures using wrapped world-space UVs so the texture maps properly across large mountains
          vec4 grass = texture2D(grassTexture, worldUV);
          // Darken the grass color moderately
          grass.rgb *= 0.45; // Reduce brightness to 45% for darker green
          vec4 rock = texture2D(rockTexture, worldUV);
          vec4 snow = texture2D(snowTexture, worldUV);
          vec4 dirt = texture2D(dirtTexture, worldUV);

          // Height-based blending (snow on peaks)
          float snowBlend = smoothstep(snowHeight, terrainHeight, vHeight);
          // Rock becomes more present at mid/high heights
          float rockBlend = smoothstep(rockHeight, snowHeight, vHeight) * (1.0 - snowBlend);

          // Slope-based influence for dirt/rock
          float slopeFactor = smoothstep(slopeThreshold * 0.5, slopeThreshold, vSlope);

          // Grass appears where there is remaining weight and slope is gentle
          float baseRemaining = max(0.0, 1.0 - snowBlend - rockBlend);
          float grassBlend = baseRemaining * (1.0 - slopeFactor);
          float dirtBlend = baseRemaining * slopeFactor;

          // Normalize (not strictly necessary but keeps sums sane)
          float total = snowBlend + rockBlend + grassBlend + dirtBlend + 1e-5;
          snowBlend /= total;
          rockBlend /= total;
          grassBlend /= total;
          dirtBlend /= total;

          // Combine textures
          vec4 color = snow * snowBlend + rock * rockBlend + grass * grassBlend + dirt * dirtBlend;

          gl_FragColor = color;
        }
      `,
      side: THREE.FrontSide,
    });
  }, [textures, config.maxHeight]);

  // Update environment collision data
  useFrame(() => {
    if (!meshRef.current) return;

    // Update terrain collision info in environment store
    useEnvironment.getState().setTerrainData({
      heightMap: terrainData.heightMap,
      resolution: config.resolution,
      width: config.width,
      height: config.height,
      minHeight: terrainData.minHeight,
      maxHeight: terrainData.maxHeight,
    });
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        receiveShadow
        castShadow
        renderOrder={1}
      >
        {debug && <wireframeGeometry attach="geometry" args={[geometry]} />}
      </mesh>
    </group>
  );
}
