import { useState, useEffect } from 'react';
import { useCamera, CameraMode } from '../lib/stores/useCamera';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Camera, Eye, Move3D } from 'lucide-react';

export default function CameraControls() {
  const { 
    mode, 
    followOffset, 
    fpvOffset, 
    fpvHeight,
    setMode,
    setFollowOffset,
    setFpvOffset,
    setFpvHeight
  } = useCamera();

  // Track current slider values
  const [currentFollowOffset, setCurrentFollowOffset] = useState(followOffset);
  const [currentFpvOffset, setCurrentFpvOffset] = useState(fpvOffset);
  const [currentFpvHeight, setCurrentFpvHeight] = useState(fpvHeight);

  // Keep current values in sync with stored values
  useEffect(() => {
    setCurrentFollowOffset(followOffset);
  }, [followOffset]);

  useEffect(() => {
    setCurrentFpvOffset(fpvOffset);
  }, [fpvOffset]);

  useEffect(() => {
    setCurrentFpvHeight(fpvHeight);
  }, [fpvHeight]);

  const modes: { value: CameraMode; label: string; icon: typeof Camera }[] = [
    { value: 'follow', label: 'Follow', icon: Camera },
    { value: 'fpv', label: 'FPV', icon: Eye },
    { value: 'manual', label: 'Manual', icon: Move3D },
  ];

  return (
    <div style={{
      position: 'absolute',
      bottom: '60px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(20, 20, 20, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 20,
      minWidth: '320px',
      maxHeight: '70vh',
      overflowY: 'auto',
    }}>
      {/* Camera Mode Buttons */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        {modes.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={mode === value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode(value)}
            style={{
              background: mode === value ? 'rgba(59, 130, 246, 0.8)' : 'rgba(0, 0, 0, 0.5)',
              color: mode === value ? '#fff' : '#888',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </Button>
        ))}
      </div>

      {/* Follow Camera Settings */}
      {mode === 'follow' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '12px',
          borderRadius: '6px',
        }}>
          <div style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
            Follow Camera Settings
          </div>
          
          {/* X Offset */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
              <span>X Offset (Left/Right)</span>
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{currentFollowOffset.x.toFixed(1)}</span>
            </div>
            <Slider
              defaultValue={[followOffset.x]}
              value={[currentFollowOffset.x]}
              onValueChange={(values) => setCurrentFollowOffset({ ...currentFollowOffset, x: values[0] })}
              onValueCommit={(values) => setFollowOffset({ ...followOffset, x: values[0] })}
              min={-30}
              max={30}
              step={0.5}
            />
          </div>

          {/* Y Offset */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
              <span>Y Offset (Height)</span>
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{currentFollowOffset.y.toFixed(1)}</span>
            </div>
            <Slider
              defaultValue={[followOffset.y]}
              value={[currentFollowOffset.y]}
              onValueChange={(values) => setCurrentFollowOffset({ ...currentFollowOffset, y: values[0] })}
              onValueCommit={(values) => setFollowOffset({ ...followOffset, y: values[0] })}
              min={0}
              max={30}
              step={0.5}
            />
          </div>

          {/* Z Offset */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
              <span>Z Offset (Distance)</span>
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{currentFollowOffset.z.toFixed(1)}</span>
            </div>
            <Slider
              defaultValue={[followOffset.z]}
              value={[currentFollowOffset.z]}
              onValueChange={(values) => setCurrentFollowOffset({ ...currentFollowOffset, z: values[0] })}
              onValueCommit={(values) => setFollowOffset({ ...followOffset, z: values[0] })}
              min={-30}
              max={30}
              step={0.5}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const defaultValues = { x: -15, y: 8, z: 15 };
              setFollowOffset(defaultValues);
              setCurrentFollowOffset(defaultValues);
            }}
            style={{
              fontSize: '10px',
              background: 'rgba(0, 0, 0, 0.5)',
              color: '#888',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            Reset to Default
          </Button>
        </div>
      )}

      {/* FPV Settings */}
      {mode === 'fpv' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '12px',
          borderRadius: '6px',
        }}>
          <div style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
            FPV Camera Settings
          </div>

          {/* Height */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
              <span>Height Above Drone</span>
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{fpvHeight.toFixed(2)}</span>
            </div>
            <Slider
              defaultValue={[fpvHeight]}
              value={[currentFpvHeight]}
              onValueChange={(values) => setCurrentFpvHeight(values[0])}
              onValueCommit={(values) => setFpvHeight(values[0])}
              min={0}
              max={5}
              step={0.1}
            />
          </div>
          
          {/* X Offset */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
              <span>X Offset (Sideways)</span>
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{currentFpvOffset.x.toFixed(2)}</span>
            </div>
            <Slider
              defaultValue={[fpvOffset.x]}
              value={[currentFpvOffset.x]}
              onValueChange={(values) => setCurrentFpvOffset({ ...currentFpvOffset, x: values[0] })}
              onValueCommit={(values) => setFpvOffset({ ...fpvOffset, x: values[0] })}
              min={-3}
              max={3}
              step={0.1}
            />
          </div>

          {/* Y Offset */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
              <span>Y Offset (Vertical)</span>
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{currentFpvOffset.y.toFixed(2)}</span>
            </div>
            <Slider
              defaultValue={[fpvOffset.y]}
              value={[currentFpvOffset.y]}
              onValueChange={(values) => setCurrentFpvOffset({ ...currentFpvOffset, y: values[0] })}
              onValueCommit={(values) => setFpvOffset({ ...fpvOffset, y: values[0] })}
              min={-3}
              max={3}
              step={0.1}
            />
          </div>

          {/* Z Offset */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
              <span>Z Offset (Forward/Back)</span>
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{currentFpvOffset.z.toFixed(2)}</span>
            </div>
            <Slider
              defaultValue={[fpvOffset.z]}
              value={[currentFpvOffset.z]}
              onValueChange={(values) => setCurrentFpvOffset({ ...currentFpvOffset, z: values[0] })}
              onValueCommit={(values) => setFpvOffset({ ...fpvOffset, z: values[0] })}
              min={-3}
              max={3}
              step={0.1}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const defaultHeight = 1.2;
              const defaultOffset = { x: 0, y: 0, z: 0.3 };
              setFpvHeight(defaultHeight);
              setCurrentFpvHeight(defaultHeight);
              setFpvOffset(defaultOffset);
              setCurrentFpvOffset(defaultOffset);
            }}
            style={{
              fontSize: '10px',
              background: 'rgba(0, 0, 0, 0.5)',
              color: '#888',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            Reset to Default
          </Button>
        </div>
      )}

      {/* Manual Camera Instructions */}
      {mode === 'manual' && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '10px',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#aaa',
          lineHeight: '1.4',
        }}>
          <div style={{ marginBottom: '4px', color: '#fff', fontWeight: 'bold' }}>
            Manual Camera Controls:
          </div>
          <div>• Right-click + Drag to rotate</div>
          <div>• Scroll to zoom in/out</div>
        </div>
      )}
    </div>
  );
}
