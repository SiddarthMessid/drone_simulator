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
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{followOffset.x.toFixed(1)}</span>
            </div>
            <Slider
              value={[followOffset.x]}
              onValueChange={(values) => setFollowOffset({ ...followOffset, x: values[0] })}
              min={-30}
              max={30}
              step={0.5}
            />
          </div>

          {/* Y Offset */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
              <span>Y Offset (Height)</span>
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{followOffset.y.toFixed(1)}</span>
            </div>
            <Slider
              value={[followOffset.y]}
              onValueChange={(values) => setFollowOffset({ ...followOffset, y: values[0] })}
              min={0}
              max={30}
              step={0.5}
            />
          </div>

          {/* Z Offset */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
              <span>Z Offset (Distance)</span>
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{followOffset.z.toFixed(1)}</span>
            </div>
            <Slider
              value={[followOffset.z]}
              onValueChange={(values) => setFollowOffset({ ...followOffset, z: values[0] })}
              min={-30}
              max={30}
              step={0.5}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setFollowOffset({ x: -15, y: 8, z: 15 })}
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
              value={[fpvHeight]}
              onValueChange={(values) => setFpvHeight(values[0])}
              min={0}
              max={5}
              step={0.1}
            />
          </div>
          
          {/* X Offset */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
              <span>X Offset (Sideways)</span>
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{fpvOffset.x.toFixed(2)}</span>
            </div>
            <Slider
              value={[fpvOffset.x]}
              onValueChange={(values) => setFpvOffset({ ...fpvOffset, x: values[0] })}
              min={-3}
              max={3}
              step={0.1}
            />
          </div>

          {/* Y Offset */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
              <span>Y Offset (Vertical)</span>
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{fpvOffset.y.toFixed(2)}</span>
            </div>
            <Slider
              value={[fpvOffset.y]}
              onValueChange={(values) => setFpvOffset({ ...fpvOffset, y: values[0] })}
              min={-3}
              max={3}
              step={0.1}
            />
          </div>

          {/* Z Offset */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
              <span>Z Offset (Forward/Back)</span>
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{fpvOffset.z.toFixed(2)}</span>
            </div>
            <Slider
              value={[fpvOffset.z]}
              onValueChange={(values) => setFpvOffset({ ...fpvOffset, z: values[0] })}
              min={-3}
              max={3}
              step={0.1}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFpvHeight(1.2);
              setFpvOffset({ x: 0, y: 0, z: 0.3 });
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
