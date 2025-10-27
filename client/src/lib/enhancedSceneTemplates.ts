import { SceneType, SceneTemplate } from './sceneTemplates';

export const ENHANCED_SCENE_TEMPLATES: Record<SceneType, SceneTemplate> = {
  forest: {
    name: 'Forest',
    description: 'Dense forest with various types of trees and rocks',
    type: 'forest',
    groundTexture: '/textures/forest_ground.png',
    skyColor: '#87CEEB',
    defaultSettings: {
      density: 0.8,
      sizeVariation: 0.5,
      complexity: 0.6,
      seed: 77777
    },
    obstacles: [
      {
        type: 'Pine Tree',
        modelId: 'tree-pine',
        modelVariants: ['tree-pine', 'tree-pine-tall', 'tree-pine-old'],
        baseSize: { x: 2, y: 10, z: 2 },
        sizeVariation: 0.3,
        minCount: 20,
        maxCount: 50,
        placementRules: {
          minDistance: 5,
          maxDistance: 45,
          heightOffset: 0,
          allowOverlap: false,
          pattern: 'cluster'
        }
      },
      {
        type: 'Rock Formation',
        modelId: 'rock-formation',
        modelVariants: ['rock-small', 'rock-medium', 'rock-large'],
        baseSize: { x: 3, y: 2, z: 3 },
        sizeVariation: 0.4,
        minCount: 8,
        maxCount: 15,
        placementRules: {
          minDistance: 4,
          maxDistance: 40,
          heightOffset: 0,
          allowOverlap: false,
          pattern: 'random'
        }
      }
    ]
  },
  urban: {
    name: 'Urban Environment',
    description: 'City environment with buildings, streets, and urban furniture',
    type: 'urban',
    groundTexture: '/textures/asphalt.png',
    skyColor: '#B4D4E4',
    defaultSettings: {
      density: 0.6,
      sizeVariation: 0.3,
      complexity: 0.7,
      seed: 88888
    },
    obstacles: [
      {
        type: 'Building',
        modelId: 'building-house',
        modelVariants: [
          'building-house',
          'building-apartment',
          'building-office'
        ],
        baseSize: { x: 8, y: 15, z: 8 },
        sizeVariation: 0.2,
        minCount: 5,
        maxCount: 12,
        placementRules: {
          minDistance: 15,
          maxDistance: 45,
          heightOffset: 0,
          allowOverlap: false,
          pattern: 'grid'
        }
      },
      {
        type: 'Street Lamp',
        modelId: 'lamp-post',
        baseSize: { x: 0.5, y: 4, z: 0.5 },
        sizeVariation: 0.1,
        minCount: 8,
        maxCount: 16,
        placementRules: {
          minDistance: 8,
          maxDistance: 40,
          heightOffset: 0,
          allowOverlap: false,
          pattern: 'linear'
        }
      }
    ]
  },
  warehouse: {
    name: 'Warehouse',
    description: 'Indoor warehouse with shelves, crates, and machinery',
    type: 'warehouse',
    groundTexture: '/textures/concrete.png',
    skyColor: '#2C2C2C',
    defaultSettings: {
      density: 0.7,
      sizeVariation: 0.2,
      complexity: 0.5,
      seed: 99999
    },
    obstacles: [
      {
        type: 'Shelf Unit',
        modelId: 'warehouse-shelf',
        baseSize: { x: 6, y: 5, z: 2 },
        sizeVariation: 0.1,
        minCount: 8,
        maxCount: 16,
        modelRotation: { x: 0, y: 0, z: 0 },
        placementRules: {
          minDistance: 8,
          maxDistance: 35,
          heightOffset: 0,
          allowOverlap: false,
          pattern: 'grid'
        }
      },
      {
        type: 'Forklift',
        modelId: 'warehouse-forklift',
        baseSize: { x: 2, y: 2.5, z: 3 },
        sizeVariation: 0.1,
        minCount: 2,
        maxCount: 4,
        modelRotation: { x: 0, y: 0, z: 0 },
        placementRules: {
          minDistance: 5,
          maxDistance: 30,
          heightOffset: 0,
          allowOverlap: false,
          pattern: 'random'
        }
      }
    ]
  },
  // Add more enhanced templates...
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
        modelId: 'tree-oak',
        modelVariants: ['tree-oak', 'tree-maple', 'tree-birch'],
        baseSize: { x: 3, y: 8, z: 3 },
        sizeVariation: 0.4,
        minCount: 10,
        maxCount: 20,
        placementRules: {
          minDistance: 6,
          maxDistance: 40,
          heightOffset: 0,
          allowOverlap: false,
          pattern: 'random'
        }
      },
      {
        type: 'Bench',
        modelId: 'park-bench',
        baseSize: { x: 2, y: 1, z: 0.6 },
        sizeVariation: 0,
        minCount: 4,
        maxCount: 8,
        modelRotation: { x: 0, y: 0, z: 0 },
        placementRules: {
          minDistance: 8,
          maxDistance: 35,
          heightOffset: 0,
          allowOverlap: false,
          pattern: 'linear'
        }
      }
    ]
  },
  building_interior: {
    name: 'Building Interior',
    description: 'Indoor environment with furniture and office equipment',
    type: 'building_interior',
    groundTexture: '/textures/floor_tiles.png',
    skyColor: '#E0E0E0',
    defaultSettings: {
      density: 0.6,
      sizeVariation: 0.2,
      complexity: 0.4,
      seed: 55555
    },
    obstacles: [
      {
        type: 'Desk',
        modelId: 'office-desk',
        baseSize: { x: 1.6, y: 0.8, z: 0.8 },
        sizeVariation: 0.1,
        minCount: 6,
        maxCount: 12,
        modelRotation: { x: 0, y: 0, z: 0 },
        placementRules: {
          minDistance: 4,
          maxDistance: 30,
          heightOffset: 0,
          allowOverlap: false,
          pattern: 'grid'
        }
      },
      {
        type: 'Cabinet',
        modelId: 'office-cabinet',
        baseSize: { x: 1, y: 2, z: 0.5 },
        sizeVariation: 0.1,
        minCount: 4,
        maxCount: 8,
        modelRotation: { x: 0, y: 0, z: 0 },
        placementRules: {
          minDistance: 3,
          maxDistance: 25,
          heightOffset: 0,
          allowOverlap: false,
          pattern: 'linear'
        }
      }
    ]
  },
  disaster: {
    name: 'Disaster Zone',
    description: 'Challenging environment with debris and obstacles',
    type: 'disaster',
    groundTexture: '/textures/rough_ground.png',
    skyColor: '#A89F9F',
    defaultSettings: {
      density: 0.7,
      sizeVariation: 0.6,
      complexity: 0.8,
      seed: 66666
    },
    obstacles: [
      {
        type: 'Debris Pile',
        modelId: 'debris-pile',
        modelVariants: ['debris-small', 'debris-medium', 'debris-large'],
        baseSize: { x: 4, y: 2, z: 4 },
        sizeVariation: 0.5,
        minCount: 8,
        maxCount: 15,
        placementRules: {
          minDistance: 5,
          maxDistance: 40,
          heightOffset: 0,
          allowOverlap: true,
          pattern: 'random'
        }
      },
      {
        type: 'Fallen Structure',
        modelId: 'structure-fallen',
        modelVariants: ['structure-wall', 'structure-pillar', 'structure-beam'],
        baseSize: { x: 6, y: 3, z: 2 },
        sizeVariation: 0.4,
        minCount: 5,
        maxCount: 10,
        placementRules: {
          minDistance: 8,
          maxDistance: 35,
          heightOffset: 0,
          allowOverlap: true,
          pattern: 'random'
        }
      }
    ]
  }
};