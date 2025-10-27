import { SCENE_TEMPLATES, SceneType, SceneSettings, ObstacleTemplate } from './sceneTemplates';
import { Obstacle } from './stores/useEnvironment';

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
}

interface Position {
  x: number;
  y: number;
  z: number;
}

export interface GeneratedScene {
  obstacles: Omit<Obstacle, 'id'>[];
  environmentSize: { width: number; height: number };
  groundTexture?: string;
  skyColor?: string;
}

export class SceneGenerator {
  private random: SeededRandom;
  private placedPositions: Position[] = [];
  private environmentSize = { width: 100, height: 100 };
  private clusterCenters: Position[] = [];
  private linearAxis: { isVertical: boolean; offset: number } | null = null;

  constructor(seed: number) {
    this.random = new SeededRandom(seed);
  }

  generate(sceneType: SceneType, settings: SceneSettings): GeneratedScene {
    this.placedPositions = [];
    const template = SCENE_TEMPLATES[sceneType];
    const obstacles: Omit<Obstacle, 'id'>[] = [];

    this.environmentSize = {
      width: 100 + settings.complexity * 100,
      height: 100 + settings.complexity * 100
    };

    for (const obstacleTemplate of template.obstacles) {
      const count = this.calculateCount(
        obstacleTemplate,
        settings.density,
        settings.complexity
      );

      const generatedObstacles = this.generateObstacles(
        obstacleTemplate,
        count,
        settings
      );

      obstacles.push(...generatedObstacles);
    }

    return {
      obstacles,
      environmentSize: this.environmentSize,
      groundTexture: template.groundTexture,
      skyColor: template.skyColor
    };
  }

  private calculateCount(
    template: ObstacleTemplate,
    density: number,
    complexity: number
  ): number {
    const range = template.maxCount - template.minCount;
    const densityFactor = density;
    const complexityFactor = complexity * 0.5;
    
    const count = template.minCount + range * (densityFactor + complexityFactor) / 1.5;
    return Math.round(count);
  }

  private generateObstacles(
    template: ObstacleTemplate,
    count: number,
    settings: SceneSettings
  ): Omit<Obstacle, 'id'>[] {
    const obstacles: Omit<Obstacle, 'id'>[] = [];
    const { placementRules } = template;

    this.initializePatternAnchors(template, count);

    for (let i = 0; i < count; i++) {
      let position: Position | null = null;
      let attempts = 0;
      const maxAttempts = 50;

      while (attempts < maxAttempts) {
        position = this.generatePosition(template, i, count, settings);
        
        if (this.isValidPosition(position, placementRules)) {
          break;
        }
        
        position = null;
        attempts++;
      }

      if (position) {
        const size = this.generateSize(template, settings.sizeVariation);
        
        const modelId = template.modelVariants 
          ? template.modelVariants[Math.floor(this.random.next() * template.modelVariants.length)]
          : template.modelId;

        const obstacle: Omit<Obstacle, 'id'> = {
          name: `${template.type} ${i + 1}`,
          position,
          size,
          ...(modelId ? { modelId } : { color: this.varyColor(template.color!, settings.sizeVariation * 0.3) })
        };

        // Add model-specific transforms if using a model
        if (modelId && (template.modelScale || template.modelRotation)) {
          obstacle.rotation = template.modelRotation 
            ? {
                x: template.modelRotation.x + (this.random.next() - 0.5) * 0.2,
                y: template.modelRotation.y + this.random.next() * Math.PI * 2, // Random rotation around Y
                z: template.modelRotation.z + (this.random.next() - 0.5) * 0.2
              }
            : { x: 0, y: this.random.next() * Math.PI * 2, z: 0 };
        }

        obstacles.push(obstacle);

        if (!placementRules.allowOverlap) {
          this.placedPositions.push(position);
        }
      }
    }

    return obstacles;
  }

  private initializePatternAnchors(template: ObstacleTemplate, count: number): void {
    const { pattern } = template.placementRules;
    const halfWidth = this.environmentSize.width / 2 - 10;
    const halfHeight = this.environmentSize.height / 2 - 10;

    if (pattern === 'cluster') {
      const numClusters = Math.max(2, Math.floor(count / 8));
      this.clusterCenters = [];
      for (let i = 0; i < numClusters; i++) {
        this.clusterCenters.push({
          x: this.random.range(-halfWidth, halfWidth),
          y: 0,
          z: this.random.range(-halfHeight, halfHeight)
        });
      }
    } else if (pattern === 'linear') {
      const isVertical = this.random.next() > 0.5;
      const offset = isVertical 
        ? this.random.range(-halfWidth * 0.8, halfWidth * 0.8)
        : this.random.range(-halfHeight * 0.8, halfHeight * 0.8);
      this.linearAxis = { isVertical, offset };
    }
  }

  private generatePosition(
    template: ObstacleTemplate,
    index: number,
    total: number,
    settings: SceneSettings
  ): Position {
    const { placementRules } = template;
    const { pattern } = placementRules;
    
    let x: number, z: number;
    const halfWidth = this.environmentSize.width / 2 - 10;
    const halfHeight = this.environmentSize.height / 2 - 10;

    switch (pattern) {
      case 'grid': {
        const cols = Math.ceil(Math.sqrt(total));
        const spacing = (this.environmentSize.width - 20) / cols;
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        x = -halfWidth + col * spacing + this.random.range(-spacing * 0.3, spacing * 0.3);
        z = -halfHeight + row * spacing + this.random.range(-spacing * 0.3, spacing * 0.3);
        break;
      }
      
      case 'linear': {
        if (this.linearAxis) {
          if (this.linearAxis.isVertical) {
            x = this.linearAxis.offset + this.random.range(-2, 2);
            z = -halfHeight + (index / total) * (this.environmentSize.height - 20);
          } else {
            x = -halfWidth + (index / total) * (this.environmentSize.width - 20);
            z = this.linearAxis.offset + this.random.range(-2, 2);
          }
        } else {
          x = this.random.range(-halfWidth, halfWidth);
          z = this.random.range(-halfHeight, halfHeight);
        }
        break;
      }
      
      case 'cluster': {
        if (this.clusterCenters.length > 0) {
          const clusterIndex = index % this.clusterCenters.length;
          const clusterCenter = this.clusterCenters[clusterIndex];
          
          const clusterRadius = this.random.range(5, 15);
          const angle = this.random.range(0, Math.PI * 2);
          const radius = this.random.range(0, clusterRadius);
          
          x = clusterCenter.x + Math.cos(angle) * radius;
          z = clusterCenter.z + Math.sin(angle) * radius;
        } else {
          x = this.random.range(-halfWidth, halfWidth);
          z = this.random.range(-halfHeight, halfHeight);
        }
        break;
      }
      
      default: {
        x = this.random.range(-halfWidth, halfWidth);
        z = this.random.range(-halfHeight, halfHeight);
      }
    }

    return {
      x,
      y: placementRules.heightOffset,
      z
    };
  }

  private isValidPosition(position: Position, placementRules: any): boolean {
    const keepoutRadius = 15;
    const distanceFromCenter = Math.sqrt(position.x * position.x + position.z * position.z);
    
    if (distanceFromCenter < keepoutRadius) {
      return false;
    }

    if (placementRules.allowOverlap) {
      return true;
    }

    if (this.placedPositions.length === 0) {
      return true;
    }

    let hasObstacleWithinMaxDistance = false;

    for (const placed of this.placedPositions) {
      const dx = position.x - placed.x;
      const dz = position.z - placed.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance < placementRules.minDistance) {
        return false;
      }
      
      if (placementRules.maxDistance && distance <= placementRules.maxDistance) {
        hasObstacleWithinMaxDistance = true;
      }
    }

    if (placementRules.maxDistance && !hasObstacleWithinMaxDistance) {
      return false;
    }

    return true;
  }

  private generateSize(
    template: ObstacleTemplate,
    sizeVariation: number
  ): { x: number; y: number; z: number } {
    const variation = template.sizeVariation * sizeVariation;
    
    return {
      x: template.baseSize.x * (1 + this.random.range(-variation, variation)),
      y: template.baseSize.y * (1 + this.random.range(-variation, variation)),
      z: template.baseSize.z * (1 + this.random.range(-variation, variation))
    };
  }

  private varyColor(baseColor: string, variation: number): string {
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const vary = (value: number) => {
      const change = Math.floor(this.random.range(-30, 30) * variation);
      return Math.max(0, Math.min(255, value + change));
    };

    const newR = vary(r).toString(16).padStart(2, '0');
    const newG = vary(g).toString(16).padStart(2, '0');
    const newB = vary(b).toString(16).padStart(2, '0');

    return `#${newR}${newG}${newB}`;
  }
}

export function generateScene(sceneType: SceneType, settings: SceneSettings): GeneratedScene {
  const generator = new SceneGenerator(settings.seed);
  return generator.generate(sceneType, settings);
}
