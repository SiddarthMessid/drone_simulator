import { create } from "zustand";

interface EditorStore {
  code: string;
  error: string;
  isCompiling: boolean;
  isFocused: boolean;

  setCode: (code: string) => void;
  setError: (error: string) => void;
  setIsCompiling: (isCompiling: boolean) => void;
  setIsFocused: (isFocused: boolean) => void;
}

export const useEditor = create<EditorStore>((set) => ({
  code: "",
  error: "",
  isCompiling: false,
  isFocused: false,

  setCode: (code: string) => set({ code }),
  setError: (error: string) => set({ error }),
  setIsCompiling: (isCompiling: boolean) => set({ isCompiling }),
  setIsFocused: (isFocused: boolean) => set({ isFocused }),
}));
