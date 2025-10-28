import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Target, Play, X, Plus } from 'lucide-react';
import { useMission } from '../lib/stores/useMission';

export default function MissionPlanner() {
  const { mode, setMode, startPoint, stopPoint, scanPoints, setStart, setStop, addScanPoint, clearMission } = useMission();

  return (
    <div className="p-2 bg-slate-800 text-white rounded-md space-y-2">
      <h3 className="text-sm font-semibold">Mission Planner</h3>
      <div className="flex gap-2">
        <Button variant={mode === 'selectStart' ? 'default' : 'outline'} size="sm" onClick={() => setMode('selectStart')}>
          <Target className="w-4 h-4 mr-1" /> Select Start
        </Button>
        <Button variant={mode === 'selectStop' ? 'default' : 'outline'} size="sm" onClick={() => setMode('selectStop')}>
          <Play className="w-4 h-4 mr-1" /> Select Stop
        </Button>
        <Button variant={mode === 'selectScan' ? 'default' : 'outline'} size="sm" onClick={() => setMode('selectScan')}>
          <Plus className="w-4 h-4 mr-1" /> Add Scan Point
        </Button>
      </div>

      <div className="text-xs text-gray-300">
        <div>Start: {startPoint ? `${startPoint.x.toFixed(2)}, ${startPoint.y.toFixed(2)}, ${startPoint.z.toFixed(2)}` : '—'}</div>
        <div>Stop: {stopPoint ? `${stopPoint.x.toFixed(2)}, ${stopPoint.y.toFixed(2)}, ${stopPoint.z.toFixed(2)}` : '—'}</div>
        <div>Scan points: {scanPoints.length}</div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => clearMission()}>
          <X className="w-4 h-4 mr-1" /> Clear
        </Button>
      </div>

      <div className="text-xs text-gray-400 mt-1">Mode: {mode}</div>
    </div>
  );
}
