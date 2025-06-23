import { create } from "zustand";

interface VariableWindParams {
  frequency: number; // Hz
  amplitude: number; // m/s
}

interface WindStore {
  windForce: number;
  windDirection: number; // radians
  windType: 'constant' | 'variable';
  variableWindParams: VariableWindParams;
  
  setWindForce: (force: number) => void;
  setWindDirection: (direction: number) => void;
  setWindType: (type: 'constant' | 'variable') => void;
  setVariableWindParams: (params: VariableWindParams) => void;
  getCurrentWindForce: (time: number) => number;
}

export const useWind = create<WindStore>((set, get) => ({
  windForce: 0,
  windDirection: 0,
  windType: 'constant',
  variableWindParams: {
    frequency: 0.5,
    amplitude: 2
  },

  setWindForce: (force: number) => set({ windForce: force }),
  setWindDirection: (direction: number) => set({ windDirection: direction }),
  setWindType: (type: 'constant' | 'variable') => set({ windType: type }),
  setVariableWindParams: (params: VariableWindParams) => set({ variableWindParams: params }),

  getCurrentWindForce: (time: number) => {
    const { windForce, windType, variableWindParams } = get();
    
    if (windType === 'constant') {
      return windForce;
    } else {
      // Variable wind using sine wave
      const variation = Math.sin(time * variableWindParams.frequency * 2 * Math.PI) * variableWindParams.amplitude;
      return Math.max(0, windForce + variation);
    }
  }
}));
