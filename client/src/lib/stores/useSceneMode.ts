import { create } from 'zustand';

export type SceneMode = 'simulation' | 'hil';

interface SceneModeStore {
    mode: SceneMode;
    setMode: (mode: SceneMode) => void;
}

export const useSceneMode = create<SceneModeStore>((set) => ({
    mode: 'simulation',
    setMode: (mode) => set({ mode }),
}));
