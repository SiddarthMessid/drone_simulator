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
  {
    id: "default-1",
    name: "Tower 1",
    position: { x: 15, y: 5, z: 15 },
    size: { x: 2, y: 10, z: 2 },
    color: "#666666",
  },
  {
    id: "default-2",
    name: "Tower 2",
    position: { x: -15, y: 3, z: -15 },
    size: { x: 3, y: 6, z: 3 },
    color: "#666666",
  },
  {
    id: "default-3",
    name: "Tower 3",
    position: { x: 20, y: 4, z: -20 },
    size: { x: 1.5, y: 8, z: 1.5 },
    color: "#666666",
  },
  {
    id: "default-4",
    name: "Tower 4",
    position: { x: -25, y: 6, z: 10 },
    size: { x: 2.5, y: 12, z: 2.5 },
    color: "#666666",
  },
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

  addObstacle: (obstacle: Omit<Obstacle, "id">) => void;
  removeObstacle: (id: string) => void;
  updateObstacle: (id: string, updates: Partial<Obstacle>) => void;
  clearObstacles: () => void;
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

  addObstacle: (obstacle: Omit<Obstacle, "id">) => {
    const id = `obstacle_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const newObstacle: Obstacle = { ...obstacle, id };
    set((state) => ({ obstacles: [...state.obstacles, newObstacle] }));
  },

  removeObstacle: (id: string) => {
    set((state) => ({
      obstacles: state.obstacles.filter((obstacle) => obstacle.id !== id),
    }));
  },

  updateObstacle: (id: string, updates: Partial<Obstacle>) => {
    set((state) => ({
      obstacles: state.obstacles.map((obstacle) =>
        obstacle.id === id ? { ...obstacle, ...updates } : obstacle
      ),
    }));
  },

  clearObstacles: () => {
    set({ obstacles: [] });
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
    const state = get();
    // In flat terrain, return default obstacles + user obstacles
    // In mountain terrain, return only user obstacles (no defaults)
    return [...DEFAULT_OBSTACLES, ...state.obstacles];
  },

  getObstacleAABBs: () => {
    const state = get();
    const allObstacles = [...DEFAULT_OBSTACLES, ...state.obstacles];
    const aabbs = allObstacles.map((obstacle) => ({
      center: new THREE.Vector3(
        obstacle.position.x,
        obstacle.position.y,
        obstacle.position.z
      ),
      half: new THREE.Vector3(
        obstacle.size.x / 2,
        obstacle.size.y / 2,
        obstacle.size.z / 2
      ),
    }));

    // Add invisible boundary walls for mountain terrain
    // Check if terrain data exists and is large (mountain terrain)
    if (state.terrain && state.terrain.width >= 1500) {
      const terrainSize = state.terrain.width;
      const halfSize = terrainSize / 2;
      const wallHeight = 500;
      const wallThickness = 10;

      // North Wall
      aabbs.push({
        center: new THREE.Vector3(0, wallHeight / 2, -halfSize),
        half: new THREE.Vector3(
          terrainSize / 2,
          wallHeight / 2,
          wallThickness / 2
        ),
      });

      // South Wall
      aabbs.push({
        center: new THREE.Vector3(0, wallHeight / 2, halfSize),
        half: new THREE.Vector3(
          terrainSize / 2,
          wallHeight / 2,
          wallThickness / 2
        ),
      });

      // East Wall
      aabbs.push({
        center: new THREE.Vector3(halfSize, wallHeight / 2, 0),
        half: new THREE.Vector3(
          wallThickness / 2,
          wallHeight / 2,
          terrainSize / 2
        ),
      });

      // West Wall
      aabbs.push({
        center: new THREE.Vector3(-halfSize, wallHeight / 2, 0),
        half: new THREE.Vector3(
          wallThickness / 2,
          wallHeight / 2,
          terrainSize / 2
        ),
      });

      // Bottom Safety Net
      aabbs.push({
        center: new THREE.Vector3(0, -100, 0),
        half: new THREE.Vector3(terrainSize / 2, 5, terrainSize / 2),
      });
    }

    return aabbs;
  },

  getTerrainHeight: (x: number, z: number): number => {
    const { terrain } = get();
    if (!terrain || !terrain.heightMap) return 0;

    const { heightMap, resolution, width, height } = terrain;

    // Convert world coordinates to heightmap coordinates
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Clamp to terrain bounds
    const clampedX = Math.max(-halfWidth, Math.min(halfWidth, x));
    const clampedZ = Math.max(-halfHeight, Math.min(halfHeight, z));

    const mapX = ((clampedX + halfWidth) / width) * (resolution - 1);
    const mapZ = ((clampedZ + halfHeight) / height) * (resolution - 1);

    // Get the four nearest heightmap points
    const x1 = Math.max(0, Math.floor(mapX));
    const x2 = Math.min(x1 + 1, resolution - 1);
    const z1 = Math.max(0, Math.floor(mapZ));
    const z2 = Math.min(z1 + 1, resolution - 1);

    // Calculate interpolation factors
    const fx = Math.max(0, Math.min(1, mapX - x1));
    const fz = Math.max(0, Math.min(1, mapZ - z1));

    // Get heights at each corner
    const h11 = heightMap[z1 * resolution + x1] || 0;
    const h21 = heightMap[z1 * resolution + x2] || 0;
    const h12 = heightMap[z2 * resolution + x1] || 0;
    const h22 = heightMap[z2 * resolution + x2] || 0;

    // Bilinear interpolation
    const h1 = h11 * (1 - fx) + h21 * fx;
    const h2 = h12 * (1 - fx) + h22 * fx;

    return h1 * (1 - fz) + h2 * fz;
  },
}));
