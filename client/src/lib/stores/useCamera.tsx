import { create } from 'zustand';

export type CameraMode = 'follow' | 'fpv' | 'manual';

interface CameraState {
  mode: CameraMode;
  followOffset: { x: number; y: number; z: number };
  fpvOffset: { x: number; y: number; z: number };
  fpvHeight: number;
  manualPosition: { x: number; y: number; z: number };
  manualTarget: { x: number; y: number; z: number };
  setMode: (mode: CameraMode) => void;
  setFollowOffset: (offset: { x: number; y: number; z: number }) => void;
  setFpvOffset: (offset: { x: number; y: number; z: number }) => void;
  setFpvHeight: (height: number) => void;
  setManualPosition: (position: { x: number; y: number; z: number }) => void;
  setManualTarget: (target: { x: number; y: number; z: number }) => void;
}

export const useCamera = create<CameraState>((set) => ({
  mode: 'follow',
  followOffset: { x: -15, y: 8, z: 15 },
  fpvOffset: { x: 0, y: 0, z: 0.3 },
  fpvHeight: 1.2,
  manualPosition: { x: 0, y: 10, z: 20 },
  manualTarget: { x: 0, y: 0, z: 0 },
  setMode: (mode) => set({ mode }),
  setFollowOffset: (offset) => set({ followOffset: offset }),
  setFpvOffset: (offset) => set({ fpvOffset: offset }),
  setFpvHeight: (height) => set({ fpvHeight: height }),
  setManualPosition: (position) => set({ manualPosition: position }),
  setManualTarget: (target) => set({ manualTarget: target }),
}));
