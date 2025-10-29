import { create } from 'zustand';
import * as THREE from 'three';

export type MissionMode = 'idle' | 'selectStart' | 'selectTarget' | 'addingSurvey' | 'addingStructure' | 'addingCorridor';
export type ScanType = 'none' | 'corridor' | 'structure' | 'survey';

export interface MissionPoint {
  id: string;
  position: THREE.Vector3;
}

export interface SurveyPattern {
  type: 'survey';
  polygonPoints: THREE.Vector3[]; // 3+ points defining the area
  spacing: number;
  angle: number;
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

export type ScanPattern = SurveyPattern | StructurePattern | CorridorPattern | null;

interface MissionStore {
  mode: MissionMode;
  startPoint: THREE.Vector3 | null;
  targetPoint: THREE.Vector3 | null;
  scanPattern: ScanPattern;
  selectedScanType: ScanType;
  isExecuting: boolean;

  // Temporary points while building scan
  tempSurveyPoints: THREE.Vector3[];
  tempCorridorPoints: THREE.Vector3[];
  structureRadius: number;
  surveySpacing: number;

  setMode: (m: MissionMode) => void;
  setStart: (p: THREE.Vector3) => void;
  setTarget: (p: THREE.Vector3) => void;
  setSelectedScanType: (type: ScanType) => void;
  setIsExecuting: (executing: boolean) => void;

  // Survey scan methods
  addSurveyPoint: (p: THREE.Vector3) => void;
  completeSurvey: () => void;

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
  tempSurveyPoints: [],
  tempCorridorPoints: [],
  structureRadius: 15,
  surveySpacing: 5,

  setMode: (m: MissionMode) => set({ mode: m }),
  setStart: (p: THREE.Vector3) => set({ startPoint: p, mode: 'idle' }),
  setTarget: (p: THREE.Vector3) => set({ targetPoint: p, mode: 'idle' }),
  setSelectedScanType: (type: ScanType) => set({ selectedScanType: type }),
  setIsExecuting: (executing: boolean) => set({ isExecuting: executing }),

  // Survey scan: click 3+ points to define polygon
  addSurveyPoint: (p: THREE.Vector3) => {
    const { tempSurveyPoints } = get();
    set({ tempSurveyPoints: [...tempSurveyPoints, p.clone()] });
  },

  completeSurvey: () => {
    const { tempSurveyPoints, surveySpacing } = get();
    if (tempSurveyPoints.length >= 3) {
      set({
        scanPattern: {
          type: 'survey',
          polygonPoints: tempSurveyPoints,
          spacing: surveySpacing,
          angle: 0
        },
        tempSurveyPoints: [],
        mode: 'idle'
      });
    }
  },

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
    tempSurveyPoints: [],
    tempCorridorPoints: [],
    mode: 'idle'
  })
}));
