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
  isFlat: true,
  config: {
    // Expand the terrain footprint and add a very large-scale layer so mountains
    // occupy more of the world instead of tiny bumps.
    width: 1000,
    height: 1000,
    resolution: 128,
    maxHeight: 75,
    layers: [
      // Very large features (mountain ranges)
      {
        scale: 0.0004,
        amplitude: 1.0,
        persistence: 0.6,
        octaves: 6,
        bias: 0
      },
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