import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useMultiDrone } from '../lib/stores/useMultiDrone';
import { Plus, Minus, Triangle, Minus as LineIcon, Circle, Users, Wind, Target, AlertTriangle } from 'lucide-react';

export default function MultiDroneController() {
  const {
    state,
    toggleEnabled,
    addDrone,
    removeDrone,
    setActiveDrone,
    formationFlight,
    swarmBehavior,
    emergencyLandAll,
    getDrone,
    updateFormationPositions,
    getDroneCount
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
                onClick={() => state.activeDroneId && removeDrone(state.activeDroneId)}
                disabled={!state.activeDroneId}
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
                backgroundColor: state.activeDroneId === id ? 
                  state.droneColors.get(id) : 'transparent',
                borderColor: state.droneColors.get(id)
              }}
            >
              {id.split('_')[1]}
            </Button>
          ))}
        </div>

        {/* Formation Controls */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Formations</h3>
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => formationFlight('triangle')}
              disabled={getDroneCount() < 2}
              variant="outline"
              size="sm"
            >
              <Triangle className="w-4 h-4 mr-1" />
              Triangle
            </Button>
            <Button
              onClick={() => formationFlight('line')}
              disabled={getDroneCount() < 2}
              variant="outline"
              size="sm"
            >
              <LineIcon className="w-4 h-4 mr-1" />
              Line
            </Button>
            <Button
              onClick={() => formationFlight('circle')}
              disabled={getDroneCount() < 2}
              variant="outline"
              size="sm"
            >
              <Circle className="w-4 h-4 mr-1" />
              Circle
            </Button>
          </div>
        </div>

        {/* Swarm Behaviors: simplified to only Follow (toggle) */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Swarm Behaviors</h3>
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={() => swarmBehavior('follow')}
              disabled={getDroneCount() < 2}
              variant="outline"
              size="sm"
            >
              <Users className="w-4 h-4 mr-1" />
              Follow (toggle)
            </Button>
            <Button
              onClick={() => {
                if (!state.activeDroneId) return;
                const drone = getDrone(state.activeDroneId);
                if (!drone) return;
                const enabled = typeof drone.isPositionHoldEnabled === 'function' ? drone.isPositionHoldEnabled() : false;
                drone.enablePositionHold(!enabled);
                // Trigger an update to store so UI re-renders and other drones get updated
                updateFormationPositions();
              }}
              disabled={!state.activeDroneId}
              variant={state.activeDroneId && getDrone(state.activeDroneId) && typeof getDrone(state.activeDroneId)!.isPositionHoldEnabled === 'function' && getDrone(state.activeDroneId)!.isPositionHoldEnabled() ? 'default' : 'outline'}
              size="sm"
            >
              <Target className="w-4 h-4 mr-1" />
              Position Hold
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
          Emergency Land All
        </Button>
      </div>
    </div>
  );
}