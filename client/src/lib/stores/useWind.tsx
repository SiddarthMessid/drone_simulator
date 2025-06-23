import { create } from "zustand";

interface VariableWindParams {
  frequency: number; // Hz
  amplitude: number; // m/s
}

export interface WindSource {
  id: string;
  name: string;
  force: number;
  direction: number; // radians
  type: 'constant' | 'variable';
  variableParams: VariableWindParams;
  enabled: boolean;
  position: { x: number; y: number; z: number };
  radius: number; // area of effect
}

interface WindStore {
  windSources: WindSource[];
  
  addWindSource: (source: Omit<WindSource, 'id'>) => void;
  updateWindSource: (id: string, updates: Partial<WindSource>) => void;
  removeWindSource: (id: string) => void;
  toggleWindSource: (id: string) => void;
  clearAllWind: () => void;
  getWindAtPosition: (position: { x: number; y: number; z: number }, time: number) => { x: number; y: number; z: number };
}

export const useWind = create<WindStore>((set, get) => ({
  windSources: [],

  addWindSource: (source: Omit<WindSource, 'id'>) => {
    const id = `wind_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSource: WindSource = { ...source, id };
    set(state => ({ windSources: [...state.windSources, newSource] }));
  },

  updateWindSource: (id: string, updates: Partial<WindSource>) => {
    set(state => ({
      windSources: state.windSources.map(source =>
        source.id === id ? { ...source, ...updates } : source
      )
    }));
  },

  removeWindSource: (id: string) => {
    set(state => ({
      windSources: state.windSources.filter(source => source.id !== id)
    }));
  },

  toggleWindSource: (id: string) => {
    set(state => ({
      windSources: state.windSources.map(source =>
        source.id === id ? { ...source, enabled: !source.enabled } : source
      )
    }));
  },

  clearAllWind: () => {
    set({ windSources: [] });
  },

  getWindAtPosition: (position: { x: number; y: number; z: number }, time: number) => {
    const { windSources } = get();
    let totalWind = { x: 0, y: 0, z: 0 };

    windSources.forEach(source => {
      if (!source.enabled) return;

      // Calculate distance from wind source
      const dx = position.x - source.position.x;
      const dy = position.y - source.position.y;
      const dz = position.z - source.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Apply wind if within radius
      if (distance <= source.radius) {
        let windForce = source.force;

        // Apply variable wind effect
        if (source.type === 'variable') {
          const variation = Math.sin(time * source.variableParams.frequency * 2 * Math.PI) * source.variableParams.amplitude;
          windForce = Math.max(0, windForce + variation);
        }

        // Calculate falloff based on distance
        const falloff = Math.max(0, 1 - (distance / source.radius));
        windForce *= falloff;

        // Apply wind direction
        const windX = Math.cos(source.direction) * windForce;
        const windZ = Math.sin(source.direction) * windForce;

        totalWind.x += windX;
        totalWind.z += windZ;
      }
    });

    return totalWind;
  }
}));
