import * as THREE from 'three';
import { GLTFLoader, DRACOLoader, GLTF } from 'three-stdlib';

export interface ModelDefinition {
  id: string;
  name: string;
  category: 'nature' | 'urban' | 'furniture' | 'custom';
  modelUrl: string;
  scale?: THREE.Vector3;
  rotation?: THREE.Euler;
  collision: {
    type: 'box' | 'compound' | 'mesh';
    shapes?: {
      type: 'box' | 'sphere' | 'cylinder';
      offset: THREE.Vector3;
      size: THREE.Vector3;
      rotation?: THREE.Euler;
    }[];
  };
  lod?: {
    distances: number[];
    models: string[];
  };
}

class ModelRegistry {
  private models: Map<string, ModelDefinition> = new Map();
  private loadedModels: Map<string, GLTF> = new Map();
  private loader: GLTFLoader;
  private dracoLoader: DRACOLoader;

  constructor() {
    this.loader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/draco/');
    this.loader.setDRACOLoader(this.dracoLoader);
  }

  registerModel(definition: ModelDefinition) {
    this.models.set(definition.id, definition);
  }

  async loadModel(modelId: string): Promise<GLTF> {
    const cached = this.loadedModels.get(modelId);
    if (cached) return cached;

    const definition = this.models.get(modelId);
    if (!definition) throw new Error(`Model ${modelId} not found in registry`);

    const gltf = await this.loader.loadAsync(definition.modelUrl);
    this.loadedModels.set(modelId, gltf);
    return gltf;
  }

  getDefinition(modelId: string): ModelDefinition | undefined {
    return this.models.get(modelId);
  }

  getCollisionShapes(modelId: string): THREE.Object3D[] {
    const definition = this.models.get(modelId);
    if (!definition) return [];

    const shapes: THREE.Object3D[] = [];

    if (definition.collision.type === 'compound' && definition.collision.shapes) {
      for (const shape of definition.collision.shapes) {
        let collider: THREE.Mesh;

        switch (shape.type) {
          case 'box':
            collider = new THREE.Mesh(
              new THREE.BoxGeometry(shape.size.x, shape.size.y, shape.size.z),
              new THREE.MeshBasicMaterial({ visible: false })
            );
            break;
          case 'sphere':
            collider = new THREE.Mesh(
              new THREE.SphereGeometry(shape.size.x),
              new THREE.MeshBasicMaterial({ visible: false })
            );
            break;
          case 'cylinder':
            collider = new THREE.Mesh(
              new THREE.CylinderGeometry(shape.size.x, shape.size.x, shape.size.y),
              new THREE.MeshBasicMaterial({ visible: false })
            );
            break;
        }

        collider.position.copy(shape.offset);
        if (shape.rotation) {
          collider.rotation.copy(shape.rotation);
        }

        shapes.push(collider);
      }
    }

    return shapes;
  }
}

// Export singleton instance
export const modelRegistry = new ModelRegistry();

// Register default models
modelRegistry.registerModel({
  id: 'tree-pine',
  name: 'Pine Tree',
  category: 'nature',
  modelUrl: '/models/nature/pine_tree.glb',
  scale: new THREE.Vector3(1, 1, 1),
  collision: {
    type: 'compound',
    shapes: [
      {
        type: 'cylinder',
        offset: new THREE.Vector3(0, 2, 0),
        size: new THREE.Vector3(0.3, 4, 0.3)
      },
      {
        type: 'box',
        offset: new THREE.Vector3(0, 5, 0),
        size: new THREE.Vector3(2, 6, 2)
      }
    ]
  },
  lod: {
    distances: [0, 50, 100],
    models: [
      '/models/nature/pine_tree_lod0.glb',
      '/models/nature/pine_tree_lod1.glb',
      '/models/nature/pine_tree_lod2.glb'
    ]
  }
});

modelRegistry.registerModel({
  id: 'building-house',
  name: 'House',
  category: 'urban',
  modelUrl: '/models/urban/house.glb',
  collision: {
    type: 'box',
    shapes: [
      {
        type: 'box',
        offset: new THREE.Vector3(0, 2.5, 0),
        size: new THREE.Vector3(5, 5, 5)
      }
    ]
  }
});