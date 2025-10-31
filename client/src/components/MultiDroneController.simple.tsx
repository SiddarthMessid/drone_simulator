import { Button } from "./ui/button";
import { useMultiDrone } from "../lib/stores/useMultiDrone.simple";
import {
  Plus,
  Minus,
  Triangle,
  Minus as LineIcon,
  Circle,
  AlertTriangle,
} from "lucide-react";

export default function MultiDroneControllerSimple() {
  const {
    state,
    toggleEnabled,
    addDrone,
    removeDrone,
    setActiveDrone,
    formationFlight,
    emergencyLandAll,
    getDroneCount,
  } = useMultiDrone();

  return (
    <div className="flex flex-col h-full bg-slate-900/95 text-white">
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Drone Fleet Control</h2>
          <Button
            onClick={toggleEnabled}
            variant={state.enabled ? "default" : "secondary"}
            size="sm"
          >
            {state.enabled ? "Disable Fleet" : "Enable Fleet"}
          </Button>
        </div>

        {state.enabled && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">
                {getDroneCount()}/{state.maxDrones} Drones
              </span>
            </div>

            {/* Drone Management */}
            <div className="flex space-x-2">
              <Button
                onClick={() => addDrone()}
                disabled={getDroneCount() >= state.maxDrones}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Drone
              </Button>
              <Button
                onClick={() => {
                  const lastId = Array.from(state.drones.keys()).pop();
                  if (lastId) removeDrone(lastId);
                }}
                disabled={getDroneCount() === 0}
                variant="destructive"
                className="flex-1"
              >
                <Minus className="w-4 h-4 mr-1" />
                Remove Drone
              </Button>
            </div>
          </>
        )}

        {/* Drone Selection */}
        <div className="grid grid-cols-4 gap-2">
          {Array.from(state.drones.keys()).map((id) => (
            <Button
              key={id}
              onClick={() => setActiveDrone(id)}
              variant={state.activeDroneId === id ? "default" : "outline"}
              style={{
                backgroundColor:
                  state.activeDroneId === id
                    ? state.droneColors.get(id)
                    : "transparent",
                borderColor: state.droneColors.get(id),
              }}
            >
              {id.split("_")[1]}
            </Button>
          ))}
        </div>

        {/* Formation Controls */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Formations</h3>
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => formationFlight("triangle")}
              disabled={getDroneCount() === 0}
              variant={
                state.currentFormation === "triangle" ? "default" : "outline"
              }
              size="sm"
            >
              <Triangle className="w-4 h-4 mr-1" />V
            </Button>
            <Button
              onClick={() => formationFlight("line")}
              disabled={getDroneCount() === 0}
              variant={
                state.currentFormation === "line" ? "default" : "outline"
              }
              size="sm"
            >
              <LineIcon className="w-4 h-4 mr-1" />
              Line
            </Button>
            <Button
              onClick={() => formationFlight("circle")}
              disabled={getDroneCount() === 0}
              variant={
                state.currentFormation === "circle" ? "default" : "outline"
              }
              size="sm"
            >
              <Circle className="w-4 h-4 mr-1" />
              Circle
            </Button>
          </div>
        </div>

        {/* Emergency Controls */}
        <Button
          onClick={emergencyLandAll}
          disabled={getDroneCount() === 0}
          variant="destructive"
          className="w-full"
        >
          <AlertTriangle className="w-4 h-4 mr-1" />
          Emergency Stop All
        </Button>

        {/* Info */}
        <div className="text-xs text-gray-500 p-2 bg-slate-800 rounded">
          <p>• Drones follow the main drone in formation</p>
          <p>• Select formation to change pattern</p>
          <p>• All drones maintain same altitude as leader</p>
        </div>
      </div>
    </div>
  );
}
