import { create } from "zustand";

export interface Obstacle {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
  color: string;
}

interface EnvironmentSize {
  width: number;
  height: number;
}

interface EnvironmentStore {
  obstacles: Obstacle[];
  environmentSize: EnvironmentSize;
  
  addObstacle: (obstacle: Omit<Obstacle, 'id'>) => void;
  removeObstacle: (id: string) => void;
  updateObstacle: (id: string, updates: Partial<Obstacle>) => void;
  setEnvironmentSize: (size: EnvironmentSize) => void;
}

export const useEnvironment = create<EnvironmentStore>((set, get) => ({
  obstacles: [],
  environmentSize: { width: 200, height: 200 },

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
  }
}));