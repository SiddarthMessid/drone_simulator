import React from "react";
import { Button } from "./ui/button";
import { Microscope, Mountain } from "lucide-react";
import { useSceneMode } from "../lib/stores/useSceneMode";

export default function SceneModeToggle() {
  const { mode, setMode } = useSceneMode();

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2 bg-slate-800/90 backdrop-blur-sm p-2 rounded-lg shadow-lg">
      <Button
        variant={mode === "simulation" ? "default" : "outline"}
        size="sm"
        onClick={() => setMode("simulation")}
        className="flex items-center gap-2"
      >
        <Mountain className="w-4 h-4" />
        Simulation Scene
      </Button>
      <Button
        variant={mode === "hil" ? "default" : "outline"}
        size="sm"
        onClick={() => setMode("hil")}
        className="flex items-center gap-2"
      >
        <Microscope className="w-4 h-4" />
        HIL Test Scene
      </Button>
    </div>
  );
}
