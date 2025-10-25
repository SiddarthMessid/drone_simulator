import { create } from "zustand";
import * as THREE from "three";

export interface Obstacle {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
  color: string;
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

interface EnvironmentStore {
  obstacles: Obstacle[];
  environmentSize: EnvironmentSize;
  groundTexture?: string;
  skyColor?: string;
  
  addObstacle: (obstacle: Omit<Obstacle, 'id'>) => void;
  removeObstacle: (id: string) => void;
  updateObstacle: (id: string, updates: Partial<Obstacle>) => void;
  setEnvironmentSize: (size: EnvironmentSize) => void;
  setGroundTexture: (texture?: string) => void;
  setSkyColor: (color?: string) => void;
  getAllObstacles: () => Obstacle[];
  getObstacleAABBs: () => AABB[];
}

export const useEnvironment = create<EnvironmentStore>((set, get) => ({
  obstacles: [],
  environmentSize: { width: 200, height: 200 },
  groundTexture: undefined,
  skyColor: undefined,

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

  getAllObstacles: () => {
    return [...DEFAULT_OBSTACLES, ...get().obstacles];
  },

  getObstacleAABBs: () => {
    const allObstacles = [...DEFAULT_OBSTACLES, ...get().obstacles];
    return allObstacles.map(obstacle => ({
      center: new THREE.Vector3(obstacle.position.x, obstacle.position.y, obstacle.position.z),
      half: new THREE.Vector3(obstacle.size.x / 2, obstacle.size.y / 2, obstacle.size.z / 2)
    }));
  }
}));