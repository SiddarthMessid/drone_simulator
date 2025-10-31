import { create } from 'zustand';
import * as THREE from 'three';

export type MissionMode = 'idle' | 'selectStart' | 'selectTarget' | 'addingStructure' | 'addingCorridor';
export type ScanType = 'none' | 'corridor' | 'structure';

export interface MissionPoint {
  id: string;
  position: THREE.Vector3;
}

export interface StructurePattern {
  type: 'structure';
  center: THREE.Vector3;
  radius: number;
  numPoints: number;
}

export interface CorridorPattern {
  type: 'corridor';
  waypoints: THREE.Vector3[];
  width: number;
}

export type ScanPattern = StructurePattern | CorridorPattern | null;

interface MissionStore {
  mode: MissionMode;
  startPoint: THREE.Vector3 | null;
  targetPoint: THREE.Vector3 | null;
  scanPattern: ScanPattern;
  selectedScanType: ScanType;
  isExecuting: boolean;

  // Temporary points while building scan
  tempCorridorPoints: THREE.Vector3[];
  structureRadius: number;

  setMode: (m: MissionMode) => void;
  setStart: (p: THREE.Vector3) => void;
  setTarget: (p: THREE.Vector3) => void;
  setSelectedScanType: (type: ScanType) => void;
  setIsExecuting: (executing: boolean) => void;

  // Structure scan methods
  setStructureCenter: (p: THREE.Vector3) => void;
  setStructureRadius: (r: number) => void;

  // Corridor scan methods
  addCorridorPoint: (p: THREE.Vector3) => void;
  completeCorridor: () => void;

  clearMission: () => void;
}

export const useMission = create<MissionStore>((set, get) => ({
  mode: 'idle',
  startPoint: null,
  targetPoint: null,
  scanPattern: null,
  selectedScanType: 'corridor',
  isExecuting: false,
  tempCorridorPoints: [],
  structureRadius: 15,

  setMode: (m: MissionMode) => set({ mode: m }),
  setStart: (p: THREE.Vector3) => set({ startPoint: p, mode: 'idle' }),
  setTarget: (p: THREE.Vector3) => set({ targetPoint: p, mode: 'idle' }),
  setSelectedScanType: (type: ScanType) => set({ selectedScanType: type }),
  setIsExecuting: (executing: boolean) => set({ isExecuting: executing }),

  // Structure scan: click center, adjust radius
  setStructureCenter: (p: THREE.Vector3) => {
    const { structureRadius } = get();
    set({
      scanPattern: {
        type: 'structure',
        center: p.clone(),
        radius: structureRadius,
        numPoints: 8
      },
      mode: 'idle'
    });
  },

  setStructureRadius: (r: number) => {
    set({ structureRadius: r });
    const { scanPattern } = get();
    if (scanPattern && scanPattern.type === 'structure') {
      set({
        scanPattern: {
          ...scanPattern,
          radius: r
        }
      });
    }
  },

  // Corridor scan: click multiple points to create path
  addCorridorPoint: (p: THREE.Vector3) => {
    const { tempCorridorPoints } = get();
    set({ tempCorridorPoints: [...tempCorridorPoints, p.clone()] });
  },

  completeCorridor: () => {
    const { tempCorridorPoints } = get();
    if (tempCorridorPoints.length >= 2) {
      set({
        scanPattern: {
          type: 'corridor',
          waypoints: tempCorridorPoints,
          width: 10
        },
        tempCorridorPoints: [],
        mode: 'idle'
      });
    }
  },

  clearMission: () => set({
    startPoint: null,
    targetPoint: null,
    scanPattern: null,
    tempCorridorPoints: [],
    mode: 'idle'
  })
}));
