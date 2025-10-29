import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Target, Play, X, Plus, Map, Eye } from "lucide-react";
import { useMission } from "../lib/stores/useMission";
import { useCamera } from "../lib/stores/useCamera";

export default function MissionPlanner() {
  const {
    mode,
    setMode,
    startPoint,
    targetPoint,
    scanPattern,
    clearMission,
    selectedScanType,
    setSelectedScanType,
    tempSurveyPoints,
    tempCorridorPoints,
    structureRadius,
    completeSurvey,
    completeCorridor,
    setStructureRadius,
    addSurveyPoint,
    addCorridorPoint,
    setStructureCenter,
    isExecuting,
    setIsExecuting,
  } = useMission();
  const {
    mode: cameraMode,
    enterMissionPlanningMode,
    exitMissionPlanningMode,
  } = useCamera();
  const [isPlanningActive, setIsPlanningActive] = useState(false);

  const handleStartPlanning = () => {
    setIsPlanningActive(true);
    enterMissionPlanningMode();
  };

  const handleExitPlanning = () => {
    setIsPlanningActive(false);
    exitMissionPlanningMode();
    setMode("idle");
  };

  if (!isPlanningActive) {
    return (
      <div className="p-4 bg-slate-800 text-white rounded-md space-y-3">
        <h3 className="text-lg font-semibold">Mission Planner</h3>
        <p className="text-sm text-gray-300">
          Plan drone missions by selecting waypoints on the map
        </p>
        <Button onClick={handleStartPlanning} className="w-full" size="lg">
          <Map className="w-5 h-5 mr-2" />
          Start Mission Planning
        </Button>
      </div>
    );
  }

  return (
    <div className="p-3 bg-slate-800 text-white rounded-md space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">Mission Planning Mode</h3>
        <Button variant="default" size="sm" onClick={handleExitPlanning}>
          <X className="w-4 h-4 mr-1" />
          Close
        </Button>
      </div>

      <div className="text-xs text-blue-300 bg-blue-900/30 p-2 rounded">
        📍 Click on the terrain to place waypoints
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant={mode === "selectStart" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("selectStart")}
          className="w-full justify-start"
        >
          <Target className="w-4 h-4 mr-2" />
          {startPoint ? "✓ Start Point Set" : "Set Start Point"}
        </Button>
        <Button
          variant={mode === "selectTarget" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("selectTarget")}
          className="w-full justify-start"
        >
          <Play className="w-4 h-4 mr-2" />
          {targetPoint ? "✓ Target Point Set" : "Set Target Point"}
        </Button>
      </div>

      <div className="border-t border-gray-700 pt-2 mt-2">
        <h4 className="text-xs font-semibold mb-2">Scan Patterns</h4>
        <div className="grid grid-cols-3 gap-1 mb-2">
          <Button
            variant={selectedScanType === "corridor" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedScanType("corridor")}
            className="text-xs px-2"
          >
            Corridor
          </Button>
          <Button
            variant={selectedScanType === "structure" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedScanType("structure")}
            className="text-xs px-2"
          >
            Structure
          </Button>
          <Button
            variant={selectedScanType === "survey" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedScanType("survey")}
            className="text-xs px-2"
          >
            Survey
          </Button>
        </div>
        <Button
          variant={
            mode === "addingSurvey" ||
            mode === "addingCorridor" ||
            mode === "addingStructure"
              ? "default"
              : "outline"
          }
          size="sm"
          onClick={() => {
            if (selectedScanType === "survey") {
              setMode("addingSurvey");
            } else if (selectedScanType === "corridor") {
              setMode("addingCorridor");
            } else if (selectedScanType === "structure") {
              setMode("addingStructure");
            }
          }}
          className="w-full justify-start"
        >
          <Plus className="w-4 h-4 mr-2" />
          {scanPattern
            ? `✓ ${selectedScanType} Scan Set`
            : `Set ${selectedScanType} Scan`}
        </Button>
      </div>

      {mode === "addingSurvey" && (
        <div className="bg-blue-900/30 p-2 rounded space-y-2">
          <div className="text-xs text-blue-300">
            📍 Click to add survey points ({tempSurveyPoints.length} added, need
            3+)
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={completeSurvey}
            disabled={tempSurveyPoints.length < 3}
            className="w-full"
          >
            Complete Survey ({tempSurveyPoints.length} points)
          </Button>
        </div>
      )}

      {mode === "addingCorridor" && (
        <div className="bg-blue-900/30 p-2 rounded space-y-2">
          <div className="text-xs text-blue-300">
            📍 Click to add corridor waypoints ({tempCorridorPoints.length}{" "}
            added, need 2+)
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={completeCorridor}
            disabled={tempCorridorPoints.length < 2}
            className="w-full"
          >
            Complete Corridor ({tempCorridorPoints.length} points)
          </Button>
        </div>
      )}

      {mode === "addingStructure" && (
        <div className="bg-blue-900/30 p-2 rounded space-y-2">
          <div className="text-xs text-blue-300">
            📍 Click to set structure center point
          </div>
        </div>
      )}

      <div className="text-xs text-gray-300 space-y-1 bg-slate-900/50 p-2 rounded">
        <div>
          Start:{" "}
          {startPoint
            ? `(${startPoint.x.toFixed(1)}, ${startPoint.z.toFixed(1)})`
            : "—"}
        </div>
        <div>
          Target:{" "}
          {targetPoint
            ? `(${targetPoint.x.toFixed(1)}, ${targetPoint.z.toFixed(1)})`
            : "—"}
        </div>
        <div>Scan: {scanPattern ? scanPattern.type : "—"}</div>
      </div>

      {startPoint && targetPoint && (
        <Button
          variant="default"
          size="sm"
          onClick={() => setIsExecuting(true)}
          disabled={isExecuting}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <Play className="w-4 h-4 mr-1" />
          {isExecuting ? "Mission Running..." : "Start Mission"}
        </Button>
      )}

      <Button
        variant="destructive"
        size="sm"
        onClick={() => clearMission()}
        className="w-full"
      >
        <X className="w-4 h-4 mr-1" /> Clear All Points
      </Button>
    </div>
  );
}
