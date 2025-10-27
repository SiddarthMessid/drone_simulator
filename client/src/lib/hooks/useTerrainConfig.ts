import { useState } from 'react';
import { TerrainConfig } from '../terrain/heightmap';
import { create } from 'zustand';

interface TerrainConfigState {
  config: TerrainConfig;
  isFlat: boolean;
  updateConfig: (newConfig: TerrainConfig) => void;
  toggleFlat: () => void;
}

export const useTerrainConfigStore = create<TerrainConfigState>((set) => ({
  isFlat: false,
  config: {
    width: 200,
    height: 200,
    resolution: 128,
    maxHeight: 75,
    layers: [
      {
        scale: 0.002,    // Large features (mountains)
        amplitude: 0.9,
        persistence: 0.65,
        octaves: 5,
        bias: 0
      },
      {
        scale: 0.004,    // Medium features (hills)
        amplitude: 0.5,
        persistence: 0.65,
        octaves: 4,
        bias: 0
      },
      {
        scale: 0.008,    // Small features (terrain variation)
        amplitude: 0.3,
        persistence: 0.65,
        octaves: 3,
        bias: 0
      }
    ]
  },
  updateConfig: (newConfig) => set({ config: newConfig }),
  toggleFlat: () => set(state => ({ isFlat: !state.isFlat }))
}));