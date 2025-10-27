import { useState } from 'react';
import { TerrainConfig } from '../lib/terrain/heightmap';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { useTerrainConfigStore } from '../lib/hooks/useTerrainConfig';

export default function TerrainEditor() {
  const [showPanel, setShowPanel] = useState(false);
  const { config, updateConfig, isFlat, toggleFlat } = useTerrainConfigStore();

  const updateTerrainConfig = (updates: Partial<TerrainConfig>) => {
    const newConfig = { ...config, ...updates };
    updateConfig(newConfig);
  };

  const updateLayer = (layerIndex: number, updates: any) => {
    const newLayers = [...config.layers];
    newLayers[layerIndex] = { ...newLayers[layerIndex], ...updates };
    updateTerrainConfig({ layers: newLayers });
  };

  return (
    <div style={{ 
      position: 'relative',
      background: 'rgba(20, 20, 20, 0.95)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      margin: '10px'
    }}>
      <Button
        onClick={() => setShowPanel(!showPanel)}
        style={{
          width: '100%',
          borderRadius: showPanel ? '8px 8px 0 0' : '8px',
          background: showPanel ? 'rgba(34, 197, 94, 0.8)' : 'rgba(59, 130, 246, 0.8)'
        }}
      >
        {showPanel ? '▼ Hide Terrain Editor' : '▶ Terrain Editor'}
      </Button>

      {showPanel && (
        <div style={{ padding: '20px', color: '#e5e5e5', maxHeight: '400px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#a0a0a0' }}>
              Terrain Type:
            </h4>
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <Button
                onClick={() => toggleFlat()}
                style={{
                  flex: 1,
                  background: isFlat ? 'rgba(59, 130, 246, 0.8)' : 'rgba(0, 0, 0, 0.2)',
                  border: isFlat ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                Flat Terrain
              </Button>
              <Button
                onClick={() => toggleFlat()}
                style={{
                  flex: 1,
                  background: !isFlat ? 'rgba(59, 130, 246, 0.8)' : 'rgba(0, 0, 0, 0.2)',
                  border: !isFlat ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                Mountain Terrain
              </Button>
            </div>
          </div>

          {!isFlat && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#a0a0a0' }}>
                  Terrain Height:
                </h4>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
                    <span>Maximum Height</span>
                    <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{config.maxHeight}m</span>
                  </div>
                  <Slider
                    value={[config.maxHeight]}
                    onValueChange={(values) => updateTerrainConfig({ maxHeight: values[0] })}
                    min={20}
                    max={200}
                    step={5}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#a0a0a0' }}>
                  Terrain Detail:
                </h4>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
                    <span>Resolution</span>
                    <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{config.resolution}x{config.resolution}</span>
                  </div>
                  <Slider
                    value={[config.resolution]}
                    onValueChange={(values) => updateTerrainConfig({ resolution: values[0] })}
                    min={64}
                    max={512}
                    step={64}
                  />
                </div>
              </div>

              {config.layers.map((layer, index) => (
                <div key={index} style={{ 
                  marginBottom: '20px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '12px',
                  borderRadius: '6px'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#a0a0a0' }}>
                    Layer {index + 1}:
                  </h4>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
                      <span>Scale (Feature Size)</span>
                      <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{layer.scale.toFixed(3)}</span>
                    </div>
                    <Slider
                      value={[layer.scale]}
                      onValueChange={(values) => updateLayer(index, { scale: values[0] })}
                      min={0.001}
                      max={0.1}
                      step={0.001}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
                      <span>Amplitude (Height Impact)</span>
                      <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{layer.amplitude.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[layer.amplitude]}
                      onValueChange={(values) => updateLayer(index, { amplitude: values[0] })}
                      min={0.1}
                      max={2.0}
                      step={0.1}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
                      <span>Persistence (Detail Strength)</span>
                      <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{layer.persistence.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[layer.persistence]}
                      onValueChange={(values) => updateLayer(index, { persistence: values[0] })}
                      min={0.1}
                      max={0.9}
                      step={0.05}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
                      <span>Octaves (Detail Layers)</span>
                      <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{layer.octaves}</span>
                    </div>
                    <Slider
                      value={[layer.octaves]}
                      onValueChange={(values) => updateLayer(index, { octaves: values[0] })}
                      min={1}
                      max={6}
                      step={1}
                    />
                  </div>
                </div>
              ))}

            </>
          )}
          
          <Button
            onClick={() => updateTerrainConfig(config)}
            variant="outline"
            style={{
              width: '100%',
              fontSize: '12px',
              background: 'rgba(0, 0, 0, 0.5)',
              color: '#888',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginTop: '20px'
            }}
          >
            {isFlat ? 'Apply Flat Terrain' : 'Apply Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}