import { create } from 'zustand';
import * as THREE from 'three';

export type MissionMode = 'idle' | 'selectStart' | 'selectStop' | 'selectScan';

export interface MissionPoint {
  id: string;
  position: THREE.Vector3;
}

interface MissionStore {
  mode: MissionMode;
  startPoint: THREE.Vector3 | null;
  stopPoint: THREE.Vector3 | null;
  scanPoints: MissionPoint[];
  setMode: (m: MissionMode) => void;
  setStart: (p: THREE.Vector3) => void;
  setStop: (p: THREE.Vector3) => void;
  addScanPoint: (p: THREE.Vector3) => void;
  clearMission: () => void;
}

export const useMission = create<MissionStore>((set, get) => ({
  mode: 'idle',
  startPoint: null,
  stopPoint: null,
  scanPoints: [],
  setMode: (m: MissionMode) => set({ mode: m }),
  setStart: (p: THREE.Vector3) => set({ startPoint: p, mode: 'idle' }),
  setStop: (p: THREE.Vector3) => set({ stopPoint: p, mode: 'idle' }),
  addScanPoint: (p: THREE.Vector3) => set((s) => ({ scanPoints: [...s.scanPoints, { id: `scan_${Date.now()}`, position: p.clone() }] })),
  clearMission: () => set({ startPoint: null, stopPoint: null, scanPoints: [], mode: 'idle' })
}));
