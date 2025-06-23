import { create } from "zustand";

interface EditorStore {
  code: string;
  error: string;
  isCompiling: boolean;
  
  setCode: (code: string) => void;
  setError: (error: string) => void;
  setIsCompiling: (isCompiling: boolean) => void;
}

export const useEditor = create<EditorStore>((set) => ({
  code: "",
  error: "",
  isCompiling: false,

  setCode: (code: string) => set({ code }),
  setError: (error: string) => set({ error }),
  setIsCompiling: (isCompiling: boolean) => set({ isCompiling })
}));
