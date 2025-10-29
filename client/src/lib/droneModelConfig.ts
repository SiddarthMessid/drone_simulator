/**
 * Drone Model Configuration
 * 
 * This file controls which drone model is used in the simulation.
 * You can easily switch between the procedural model and GLTF models.
 */

export type DroneModelType = 'procedural' | 'gltf';

export interface DroneModelConfig {
  type: DroneModelType;
  gltfPath?: string;
  scale?: number;
  // Propeller configuration for GLTF models
  propellerNames?: string[]; // Specific mesh names if auto-detection doesn't work
  propellerAxis?: 'x' | 'y' | 'z'; // Rotation axis for propellers
}

export const droneModelConfig: DroneModelConfig = {
  // Change this to 'gltf' to use your GLTF/GLB model
  type: 'procedural', // 'procedural' or 'gltf'

  // GLTF/GLB model settings (GLB is binary GLTF - single file)
  gltfPath: '/models/drone/drone_gltf.glb',
  scale: 50, // Much larger scale - the model is very small
  propellerAxis: 'y', // Most drone models use Y-axis for propeller rotation

  // Leave empty to auto-detect propellers, or specify names manually
  // propellerNames: []
};
