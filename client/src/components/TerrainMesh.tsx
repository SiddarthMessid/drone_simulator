import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import * as ReactDOM from 'react-dom';
import { TerrainGenerator, TerrainConfig, TerrainData } from '../lib/terrain/heightmap';
import { useEnvironment } from '../lib/stores/useEnvironment';
import { useTerrainConfigStore } from '../lib/hooks/useTerrainConfig';
import TerrainEditor from './TerrainEditor';


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

export default function TerrainMesh({ config, textures, debug = false }: TerrainMeshProps) {
  const meshRef = useRef<THREE.Mesh | null>(null);
  
  const { isFlat } = useTerrainConfigStore();

  // Generate terrain data
  const terrainData = useMemo(() => {
    const generator = new TerrainGenerator();
    if (isFlat) {
      // Create flat terrain with a fixed height
      const flatConfig = {
        ...config,
        maxHeight: 1,
        layers: [{
          scale: 1,
          amplitude: 1,
          persistence: 1,
          octaves: 1,
          bias: 1
        }]
      };
      const data = generator.generate(flatConfig);
      // Set all heights to a small constant value for visibility
      const constantHeight = 0.01; // Small positive height to ensure visibility
      for (let i = 0; i < data.positions.length; i += 3) {
        data.positions[i + 1] = constantHeight; // Y coordinate
      }
      data.minHeight = constantHeight;
      data.maxHeight = constantHeight;
      // Update normals to point straight up
      for (let i = 0; i < data.normals.length; i += 3) {
        data.normals[i] = 0;     // x = 0
        data.normals[i + 1] = 1; // y = 1 (up)
        data.normals[i + 2] = 0; // z = 0
      }
      return data;
    }
    return generator.generate(config);
  }, [config]);

  // Create geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    
    geo.setAttribute('position', new THREE.BufferAttribute(terrainData.positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(terrainData.normals, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(terrainData.uvs, 2));
    geo.setAttribute('slope', new THREE.BufferAttribute(terrainData.slopeMap, 1));
    
    geo.setIndex(new THREE.BufferAttribute(terrainData.indices, 1));
    
    return geo;
  }, [terrainData]);

  // Create shader material
  const material = useMemo(() => {
    // Configure textures
    const textureConfig = {
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      repeat: new THREE.Vector2(8, 8)
    };

    // For flat terrain, we'll use a larger texture repeat to make it more visible
    const textureRepeat = isFlat ? 16 : 8;

    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(textureRepeat, textureRepeat);
      }
    });

    return new THREE.ShaderMaterial({
      uniforms: {
        grassTexture: { value: textures.grass },
        rockTexture: { value: textures.rock },
        snowTexture: { value: textures.snow },
        dirtTexture: { value: textures.dirt },
        normalMap: { value: textures.normal },
        terrainHeight: { value: config.maxHeight },
        snowHeight: { value: config.maxHeight * 0.7 },
        rockHeight: { value: config.maxHeight * 0.3 },
        slopeThreshold: { value: 0.7 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vSlope;
        varying float vHeight;
        
        attribute float slope;
        
        void main() {
          vUv = uv;
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
        
        varying vec2 vUv;
        varying float vSlope;
        varying float vHeight;
        
        void main() {
          // Sample all textures
          vec4 grass = texture2D(grassTexture, vUv);
          vec4 rock = texture2D(rockTexture, vUv);
          vec4 snow = texture2D(snowTexture, vUv);
          vec4 dirt = texture2D(dirtTexture, vUv);
          
          // Height-based blending
          float snowBlend = smoothstep(snowHeight, terrainHeight, vHeight);
          float rockBlend = smoothstep(rockHeight, snowHeight, vHeight) * (1.0 - snowBlend);
          float grassBlend = (1.0 - snowBlend - rockBlend) * (1.0 - step(slopeThreshold, vSlope));
          float dirtBlend = (1.0 - snowBlend - rockBlend) * step(slopeThreshold, vSlope);
          
          // Slope-based blending
          float slopeBlend = smoothstep(0.5, 0.7, vSlope);
          rockBlend = max(rockBlend, slopeBlend);
          
          // Combine all textures
          vec4 color = 
            snow * snowBlend +
            rock * rockBlend +
            grass * grassBlend +
            dirt * dirtBlend;
          
          gl_FragColor = color;
        }
      `,
      side: THREE.FrontSide
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
      maxHeight: terrainData.maxHeight
    });
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} material={material} receiveShadow castShadow>
        {debug && <wireframeGeometry attach="geometry" args={[geometry]} />}
      </mesh>
    </group>
  );
}