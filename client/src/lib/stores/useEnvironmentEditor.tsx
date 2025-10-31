import { create } from "zustand";

type TransformMode = "translate" | "rotate" | null;
type Axis = "x" | "y" | "z";

interface EnvironmentEditorState {
  selectedObstacleId: string | null;
  transformMode: TransformMode;
  enabledAxes: Set<Axis>;
  setSelectedObstacleId: (id: string | null) => void;
  setTransformMode: (mode: TransformMode) => void;
  setEnabledAxes: (axes: Set<Axis>) => void;
  toggleAxis: (axis: Axis) => void;
}

export const useEnvironmentEditor = create<EnvironmentEditorState>(
  (set, get) => ({
    selectedObstacleId: null,
    transformMode: null,
    enabledAxes: new Set(),

    setSelectedObstacleId: (id) => set({ selectedObstacleId: id }),

    setTransformMode: (mode) => set({ transformMode: mode }),

    setEnabledAxes: (axes) => set({ enabledAxes: axes }),

    toggleAxis: (axis) => {
      const { enabledAxes, transformMode } = get();
      const newAxes = new Set(enabledAxes);

      if (newAxes.has(axis)) {
        newAxes.delete(axis);
      } else {
        // For rotation, only one axis at a time
        if (transformMode === "rotate") {
          newAxes.clear();
        }
        // For translation, max 2 axes
        if (transformMode === "translate" && newAxes.size >= 2) {
          return;
        }
        newAxes.add(axis);
      }

      set({ enabledAxes: newAxes });
    },
  })
);
