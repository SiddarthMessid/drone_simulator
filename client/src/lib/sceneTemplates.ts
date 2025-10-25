export type SceneType = 'park' | 'disaster' | 'building_interior' | 'urban' | 'forest' | 'warehouse';

export interface SceneTemplate {
  name: string;
  description: string;
  type: SceneType;
  defaultSettings: SceneSettings;
  groundTexture?: string;
  skyColor?: string;
  obstacles: ObstacleTemplate[];
}

export interface SceneSettings {
  density: number;
  sizeVariation: number;
  complexity: number;
  seed: number;
}

export interface ObstacleTemplate {
  type: string;
  color: string;
  baseSize: { x: number; y: number; z: number };
  sizeVariation: number;
  minCount: number;
  maxCount: number;
  placementRules: PlacementRules;
}

export interface PlacementRules {
  minDistance: number;
  maxDistance: number;
  heightOffset: number;
  allowOverlap: boolean;
  pattern?: 'grid' | 'random' | 'cluster' | 'linear';
}

export const SCENE_TEMPLATES: Record<SceneType, SceneTemplate> = {
  park: {
    name: 'Park',
    description: 'A peaceful park with trees, benches, and paths',
    type: 'park',
    groundTexture: '/textures/grass.png',
    skyColor: '#87CEEB',
    defaultSettings: {
      density: 0.5,
      sizeVariation: 0.3,
      complexity: 0.5,
      seed: 12345
    },
    obstacles: [
      {
        type: 'Tree',
        color: '#228B22',
        baseSize: { x: 1.5, y: 6, z: 1.5 },
        sizeVariation: 0.4,
        minCount: 10,
        maxCount: 30,
        placementRules: {
          minDistance: 8,
          maxDistance: 40,
          heightOffset: 3,
          allowOverlap: false,
          pattern: 'random'
        }
      },
      {
        type: 'Bench',
        color: '#8B4513',
        baseSize: { x: 2, y: 1, z: 0.8 },
        sizeVariation: 0.1,
        minCount: 3,
        maxCount: 8,
        placementRules: {
          minDistance: 10,
          maxDistance: 35,
          heightOffset: 0.5,
          allowOverlap: false,
          pattern: 'random'
        }
      },
      {
        type: 'Bush',
        color: '#2E8B57',
        baseSize: { x: 2, y: 1.5, z: 2 },
        sizeVariation: 0.5,
        minCount: 8,
        maxCount: 20,
        placementRules: {
          minDistance: 5,
          maxDistance: 45,
          heightOffset: 0.75,
          allowOverlap: false,
          pattern: 'cluster'
        }
      }
    ]
  },
  
  disaster: {
    name: 'Disaster Zone',
    description: 'Emergency response scenario with rubble and debris',
    type: 'disaster',
    groundTexture: '/textures/asphalt.png',
    skyColor: '#696969',
    defaultSettings: {
      density: 0.7,
      sizeVariation: 0.6,
      complexity: 0.7,
      seed: 54321
    },
    obstacles: [
      {
        type: 'Rubble Large',
        color: '#696969',
        baseSize: { x: 4, y: 3, z: 3.5 },
        sizeVariation: 0.7,
        minCount: 5,
        maxCount: 15,
        placementRules: {
          minDistance: 12,
          maxDistance: 45,
          heightOffset: 1.5,
          allowOverlap: false,
          pattern: 'cluster'
        }
      },
      {
        type: 'Debris',
        color: '#A9A9A9',
        baseSize: { x: 2, y: 1.5, z: 2 },
        sizeVariation: 0.8,
        minCount: 15,
        maxCount: 35,
        placementRules: {
          minDistance: 3,
          maxDistance: 50,
          heightOffset: 0.75,
          allowOverlap: false,
          pattern: 'random'
        }
      },
      {
        type: 'Damaged Wall',
        color: '#8B7355',
        baseSize: { x: 6, y: 4, z: 1 },
        sizeVariation: 0.3,
        minCount: 3,
        maxCount: 8,
        placementRules: {
          minDistance: 15,
          maxDistance: 40,
          heightOffset: 2,
          allowOverlap: false,
          pattern: 'random'
        }
      }
    ]
  },
  
  building_interior: {
    name: 'Building Interior',
    description: 'Indoor environment with rooms and furniture',
    type: 'building_interior',
    skyColor: '#FFFFFF',
    defaultSettings: {
      density: 0.6,
      sizeVariation: 0.2,
      complexity: 0.6,
      seed: 11111
    },
    obstacles: [
      {
        type: 'Wall',
        color: '#D3D3D3',
        baseSize: { x: 10, y: 5, z: 0.5 },
        sizeVariation: 0.2,
        minCount: 8,
        maxCount: 16,
        placementRules: {
          minDistance: 8,
          maxDistance: 30,
          heightOffset: 2.5,
          allowOverlap: false,
          pattern: 'grid'
        }
      },
      {
        type: 'Desk',
        color: '#8B4513',
        baseSize: { x: 3, y: 1.5, z: 1.5 },
        sizeVariation: 0.15,
        minCount: 5,
        maxCount: 12,
        placementRules: {
          minDistance: 6,
          maxDistance: 25,
          heightOffset: 0.75,
          allowOverlap: false,
          pattern: 'random'
        }
      },
      {
        type: 'Cabinet',
        color: '#654321',
        baseSize: { x: 2, y: 3, z: 1 },
        sizeVariation: 0.2,
        minCount: 4,
        maxCount: 10,
        placementRules: {
          minDistance: 5,
          maxDistance: 30,
          heightOffset: 1.5,
          allowOverlap: false,
          pattern: 'random'
        }
      }
    ]
  },
  
  urban: {
    name: 'Urban Street',
    description: 'City environment with buildings and street furniture',
    type: 'urban',
    groundTexture: '/textures/asphalt.png',
    skyColor: '#87CEEB',
    defaultSettings: {
      density: 0.6,
      sizeVariation: 0.4,
      complexity: 0.7,
      seed: 99999
    },
    obstacles: [
      {
        type: 'Building',
        color: '#708090',
        baseSize: { x: 8, y: 12, z: 8 },
        sizeVariation: 0.5,
        minCount: 4,
        maxCount: 10,
        placementRules: {
          minDistance: 15,
          maxDistance: 45,
          heightOffset: 6,
          allowOverlap: false,
          pattern: 'grid'
        }
      },
      {
        type: 'Street Light',
        color: '#2F4F4F',
        baseSize: { x: 0.5, y: 6, z: 0.5 },
        sizeVariation: 0.1,
        minCount: 6,
        maxCount: 15,
        placementRules: {
          minDistance: 10,
          maxDistance: 40,
          heightOffset: 3,
          allowOverlap: false,
          pattern: 'linear'
        }
      },
      {
        type: 'Parked Car',
        color: '#4169E1',
        baseSize: { x: 4, y: 1.8, z: 2 },
        sizeVariation: 0.2,
        minCount: 5,
        maxCount: 12,
        placementRules: {
          minDistance: 8,
          maxDistance: 35,
          heightOffset: 0.9,
          allowOverlap: false,
          pattern: 'linear'
        }
      }
    ]
  },
  
  forest: {
    name: 'Forest',
    description: 'Dense forest with trees and rocks',
    type: 'forest',
    groundTexture: '/textures/grass.png',
    skyColor: '#228B22',
    defaultSettings: {
      density: 0.8,
      sizeVariation: 0.5,
      complexity: 0.6,
      seed: 77777
    },
    obstacles: [
      {
        type: 'Pine Tree',
        color: '#0F4C0F',
        baseSize: { x: 2, y: 10, z: 2 },
        sizeVariation: 0.6,
        minCount: 20,
        maxCount: 50,
        placementRules: {
          minDistance: 5,
          maxDistance: 45,
          heightOffset: 5,
          allowOverlap: false,
          pattern: 'cluster'
        }
      },
      {
        type: 'Oak Tree',
        color: '#228B22',
        baseSize: { x: 2.5, y: 8, z: 2.5 },
        sizeVariation: 0.5,
        minCount: 10,
        maxCount: 25,
        placementRules: {
          minDistance: 6,
          maxDistance: 40,
          heightOffset: 4,
          allowOverlap: false,
          pattern: 'random'
        }
      },
      {
        type: 'Rock',
        color: '#696969',
        baseSize: { x: 2, y: 1.5, z: 2 },
        sizeVariation: 0.7,
        minCount: 8,
        maxCount: 20,
        placementRules: {
          minDistance: 8,
          maxDistance: 45,
          heightOffset: 0.75,
          allowOverlap: false,
          pattern: 'random'
        }
      }
    ]
  },
  
  warehouse: {
    name: 'Warehouse',
    description: 'Industrial warehouse with shelves and boxes',
    type: 'warehouse',
    groundTexture: '/textures/asphalt.png',
    skyColor: '#D3D3D3',
    defaultSettings: {
      density: 0.7,
      sizeVariation: 0.3,
      complexity: 0.5,
      seed: 33333
    },
    obstacles: [
      {
        type: 'Shelf Unit',
        color: '#8B4513',
        baseSize: { x: 6, y: 5, z: 2 },
        sizeVariation: 0.2,
        minCount: 8,
        maxCount: 20,
        placementRules: {
          minDistance: 8,
          maxDistance: 35,
          heightOffset: 2.5,
          allowOverlap: false,
          pattern: 'grid'
        }
      },
      {
        type: 'Crate Large',
        color: '#8B7355',
        baseSize: { x: 3, y: 3, z: 3 },
        sizeVariation: 0.3,
        minCount: 10,
        maxCount: 25,
        placementRules: {
          minDistance: 5,
          maxDistance: 40,
          heightOffset: 1.5,
          allowOverlap: false,
          pattern: 'cluster'
        }
      },
      {
        type: 'Pallet Stack',
        color: '#A0522D',
        baseSize: { x: 2.5, y: 2, z: 2 },
        sizeVariation: 0.4,
        minCount: 8,
        maxCount: 18,
        placementRules: {
          minDistance: 6,
          maxDistance: 38,
          heightOffset: 1,
          allowOverlap: false,
          pattern: 'random'
        }
      }
    ]
  }
};
