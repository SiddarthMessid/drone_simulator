import { create } from "zustand";
import * as THREE from "three";

export interface Obstacle {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
  color?: string;
  modelId?: string; // Reference to a model in the registry
  customProperties?: Record<string, any>; // For model-specific properties
}

export interface AABB {
  center: THREE.Vector3;
  half: THREE.Vector3;
}

interface EnvironmentSize {
  width: number;
  height: number;
}

// Default obstacles for navigation practice
const DEFAULT_OBSTACLES: Obstacle[] = [
  { id: 'default-1', name: 'Tower 1', position: { x: 15, y: 5, z: 15 }, size: { x: 2, y: 10, z: 2 }, color: '#666666' },
  { id: 'default-2', name: 'Tower 2', position: { x: -15, y: 3, z: -15 }, size: { x: 3, y: 6, z: 3 }, color: '#666666' },
  { id: 'default-3', name: 'Tower 3', position: { x: 20, y: 4, z: -20 }, size: { x: 1.5, y: 8, z: 1.5 }, color: '#666666' },
  { id: 'default-4', name: 'Tower 4', position: { x: -25, y: 6, z: 10 }, size: { x: 2.5, y: 12, z: 2.5 }, color: '#666666' }
];

export interface TerrainData {
  heightMap: Float32Array;
  resolution: number;
  width: number;
  height: number;
  minHeight: number;
  maxHeight: number;
}

interface EnvironmentStore {
  obstacles: Obstacle[];
  environmentSize: EnvironmentSize;
  groundTexture?: string;
  skyColor?: string;
  terrain?: TerrainData;
  
  addObstacle: (obstacle: Omit<Obstacle, 'id'>) => void;
  removeObstacle: (id: string) => void;
  updateObstacle: (id: string, updates: Partial<Obstacle>) => void;
  setEnvironmentSize: (size: EnvironmentSize) => void;
  setGroundTexture: (texture?: string) => void;
  setSkyColor: (color?: string) => void;
  setTerrainData: (data?: TerrainData) => void;
  getAllObstacles: () => Obstacle[];
  getObstacleAABBs: () => AABB[];
  getTerrainHeight: (x: number, z: number) => number;
}

export const useEnvironment = create<EnvironmentStore>((set, get) => ({
  obstacles: [],
  environmentSize: { width: 200, height: 200 },
  groundTexture: undefined,
  skyColor: undefined,
  terrain: undefined,

  addObstacle: (obstacle: Omit<Obstacle, 'id'>) => {
    const id = `obstacle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newObstacle: Obstacle = { ...obstacle, id };
    set(state => ({ obstacles: [...state.obstacles, newObstacle] }));
  },

  removeObstacle: (id: string) => {
    set(state => ({
      obstacles: state.obstacles.filter(obstacle => obstacle.id !== id)
    }));
  },

  updateObstacle: (id: string, updates: Partial<Obstacle>) => {
    set(state => ({
      obstacles: state.obstacles.map(obstacle =>
        obstacle.id === id ? { ...obstacle, ...updates } : obstacle
      )
    }));
  },

  setEnvironmentSize: (size: EnvironmentSize) => {
    set({ environmentSize: size });
  },

  setGroundTexture: (texture?: string) => {
    set({ groundTexture: texture });
  },

  setSkyColor: (color?: string) => {
    set({ skyColor: color });
  },

  setTerrainData: (data?: TerrainData) => {
    set({ terrain: data });
  },

  getAllObstacles: () => {
    return [...DEFAULT_OBSTACLES, ...get().obstacles];
  },

  getObstacleAABBs: () => {
    const allObstacles = [...DEFAULT_OBSTACLES, ...get().obstacles];
    return allObstacles.map(obstacle => ({
      center: new THREE.Vector3(obstacle.position.x, obstacle.position.y, obstacle.position.z),
      half: new THREE.Vector3(obstacle.size.x / 2, obstacle.size.y / 2, obstacle.size.z / 2)
    }));
  },

  getTerrainHeight: (x: number, z: number): number => {
    const { terrain } = get();
    if (!terrain || !terrain.heightMap) return 0;

    const { heightMap, resolution, width, height } = terrain;
    
    // Convert world coordinates to heightmap coordinates
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    const mapX = ((x + halfWidth) / width) * (resolution - 1);
    const mapZ = ((z + halfHeight) / height) * (resolution - 1);
    
    // Get the four nearest heightmap points
    const x1 = Math.floor(mapX);
    const x2 = Math.min(x1 + 1, resolution - 1);
    const z1 = Math.floor(mapZ);
    const z2 = Math.min(z1 + 1, resolution - 1);
    
    // Bounds check
    if (x1 < 0 || x2 >= resolution || z1 < 0 || z2 >= resolution) {
      return 0;
    }
    
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
}));