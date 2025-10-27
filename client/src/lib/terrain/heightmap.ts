import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export interface TerrainLayer {
  scale: number;       // Scale of the noise
  amplitude: number;   // Height multiplier
  persistence: number; // How much each octave contributes
  octaves: number;     // Number of noise layers to combine
  bias: number;        // Vertical offset
}

export interface TerrainConfig {
  width: number;      // Width of terrain in world units
  height: number;     // Length of terrain in world units
  resolution: number; // Number of vertices per side
  maxHeight: number;  // Maximum terrain height
  layers: TerrainLayer[];
  seed?: string;      // Random seed for noise generation
}

export interface TerrainData {
  heightMap: Float32Array;    // Raw height data
  positions: Float32Array;    // Vertex positions
  normals: Float32Array;     // Vertex normals
  uvs: Float32Array;         // Texture coordinates
  indices: Uint32Array;      // Triangle indices
  slopeMap: Float32Array;    // Slope data for texturing
  minHeight: number;
  maxHeight: number;
}

export class TerrainGenerator {
  private noise2D: (x: number, y: number) => number;

  constructor(seed?: string) {
    this.noise2D = createNoise2D();
  }

  generate(config: TerrainConfig): TerrainData {
    const { width, height, resolution, maxHeight: targetMaxHeight, layers } = config;
    
    // Initialize arrays
    const heightMap = new Float32Array(resolution * resolution);
    const slopeMap = new Float32Array(resolution * resolution);
    
    // Generate height data
    let minHeight = Infinity;
    let maxActualHeight = -Infinity;

    for (let z = 0; z < resolution; z++) {
      for (let x = 0; x < resolution; x++) {
        const worldX = (x / resolution) * width - width / 2;
        const worldZ = (z / resolution) * height - height / 2;
        
        let totalHeight = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxAmplitude = 0;

        // Combine multiple noise layers
        for (const layer of layers) {
          for (let o = 0; o < layer.octaves; o++) {
            const noiseX = worldX * layer.scale * frequency;
            const noiseZ = worldZ * layer.scale * frequency;
            
            totalHeight += this.noise2D(noiseX, noiseZ) * amplitude * layer.amplitude;
            
            maxAmplitude += amplitude * layer.amplitude;
            amplitude *= layer.persistence;
            frequency *= 2;
          }
          
          totalHeight += layer.bias;
        }

        // Normalize and scale
        totalHeight = (totalHeight / maxAmplitude) * targetMaxHeight;
        
        const index = z * resolution + x;
        heightMap[index] = totalHeight;

        minHeight = Math.min(minHeight, totalHeight);
        maxActualHeight = Math.max(maxActualHeight, totalHeight);
      }
    }

    // Calculate slope map and normals
    const positions = new Float32Array(resolution * resolution * 3);
    const normals = new Float32Array(resolution * resolution * 3);
    const uvs = new Float32Array(resolution * resolution * 2);
    
    for (let z = 0; z < resolution; z++) {
      for (let x = 0; x < resolution; x++) {
        const index = z * resolution + x;
        const vertexIndex = index * 3;
        const uvIndex = index * 2;

        // Set vertex position
        positions[vertexIndex] = (x / resolution) * width - width / 2;
        positions[vertexIndex + 1] = heightMap[index];
        positions[vertexIndex + 2] = (z / resolution) * height - height / 2;

        // Calculate normal using central differences
        const left = x > 0 ? heightMap[index - 1] : heightMap[index];
        const right = x < resolution - 1 ? heightMap[index + 1] : heightMap[index];
        const up = z > 0 ? heightMap[index - resolution] : heightMap[index];
        const down = z < resolution - 1 ? heightMap[index + resolution] : heightMap[index];

        const dX = (right - left) / (2 / resolution * width);
        const dZ = (down - up) / (2 / resolution * height);

        const normal = new THREE.Vector3(-dX, 1, -dZ).normalize();
        normals[vertexIndex] = normal.x;
        normals[vertexIndex + 1] = normal.y;
        normals[vertexIndex + 2] = normal.z;

        // Calculate slope for texturing
        slopeMap[index] = 1 - normal.y; // 0 = flat, 1 = vertical

        // Set UV coordinates
        uvs[uvIndex] = x / (resolution - 1);
        uvs[uvIndex + 1] = z / (resolution - 1);
      }
    }

    // Generate indices for triangles
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
      minHeight,
      maxHeight: maxActualHeight
    };
  }

  // Helper method to sample height at any point
  sampleHeight(heightMap: Float32Array, resolution: number, width: number, height: number, x: number, z: number): number {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    // Convert world coordinates to heightmap coordinates
    const mapX = ((x + halfWidth) / width) * (resolution - 1);
    const mapZ = ((z + halfHeight) / height) * (resolution - 1);
    
    // Get the four nearest heightmap points
    const x1 = Math.floor(mapX);
    const x2 = Math.min(x1 + 1, resolution - 1);
    const z1 = Math.floor(mapZ);
    const z2 = Math.min(z1 + 1, resolution - 1);
    
    // Calculate interpolation factors
    const fx = mapX - x1;
    const fz = mapZ - z1;
    
    // Get heights at each corner
    const h11 = heightMap[z1 * resolution + x1];
    const h21 = heightMap[z1 * resolution + x2];
    const h12 = heightMap[z2 * resolution + x1];
    const h22 = heightMap[z2 * resolution + x2];
    
    // Bilinear interpolation
    const h1 = h11 * (1 - fx) + h21 * fx;
    const h2 = h12 * (1 - fx) + h22 * fx;
    
    return h1 * (1 - fz) + h2 * fz;
  }
}