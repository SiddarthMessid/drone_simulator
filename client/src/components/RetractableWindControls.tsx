import { useState } from "react";
import { useWind, WindSource } from "../lib/stores/useWind";

export default function RetractableWindControls() {
  const { 
    windSources,
    addWindSource,
    updateWindSource,
    removeWindSource,
    toggleWindSource,
    clearAllWind
  } = useWind();
  
  const [showPanel, setShowPanel] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newWind, setNewWind] = useState({
    name: "Wind Zone",
    force: 5,
    direction: 0,
    type: 'constant' as 'constant' | 'variable',
    variableParams: { frequency: 0.5, amplitude: 2 },
    position: { x: 0, y: 5, z: 0 },
    radius: 20,
    enabled: true
  });

  const inputStyle = {
    width: '100%',
    padding: '6px 8px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    color: '#e5e5e5',
    fontSize: '12px'
  };

  const buttonStyle = {
    padding: '6px 12px',
    background: 'rgba(59, 130, 246, 0.8)',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    cursor: 'pointer'
  };

  const addNewWindSource = () => {
    addWindSource(newWind);
    resetForm();
  };

  const resetForm = () => {
    setNewWind({
      name: "Wind Zone",
      force: 5,
      direction: 0,
      type: 'constant',
      variableParams: { frequency: 0.5, amplitude: 2 },
      position: { x: 0, y: 5, z: 0 },
      radius: 20,
      enabled: true
    });
  };

  return (
    <div style={{ 
      position: 'relative',
      background: 'rgba(20, 20, 20, 0.95)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      margin: '10px'
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={{
          ...buttonStyle,
          width: '100%',
          borderRadius: showPanel ? '8px 8px 0 0' : '8px',
          background: showPanel ? 'rgba(34, 197, 94, 0.8)' : 'rgba(59, 130, 246, 0.8)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>{showPanel ? '▼ Hide Wind Controls' : '▶ Wind Controls'}</span>
        <span style={{ fontSize: '10px', opacity: 0.8 }}>
          {windSources.filter(w => w.enabled).length} active
        </span>
      </button>

      {/* Retractable Content */}
      {showPanel && (
        <div style={{ padding: '20px', color: '#e5e5e5', maxHeight: '400px', overflowY: 'auto' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
            Wind System Control
          </h3>

          {/* Quick Add Wind */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#a0a0a0' }}>
              Quick Add Wind:
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Force (m/s):</label>
                <input
                  type="number"
                  value={newWind.force}
                  onChange={(e) => setNewWind({...newWind, force: Number(e.target.value)})}
                  style={inputStyle}
                  min="0"
                  max="50"
                  step="0.5"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Direction (°):</label>
                <input
                  type="number"
                  value={newWind.direction * (180 / Math.PI)}
                  onChange={(e) => setNewWind({...newWind, direction: Number(e.target.value) * (Math.PI / 180)})}
                  style={inputStyle}
                  min="0"
                  max="360"
                  step="5"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Radius (m):</label>
                <input
                  type="number"
                  value={newWind.radius}
                  onChange={(e) => setNewWind({...newWind, radius: Number(e.target.value)})}
                  style={inputStyle}
                  min="5"
                  max="100"
                  step="5"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>X Position:</label>
                <input
                  type="number"
                  value={newWind.position.x}
                  onChange={(e) => setNewWind({...newWind, position: {...newWind.position, x: Number(e.target.value)}})}
                  style={inputStyle}
                  min="-100"
                  max="100"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Y Position:</label>
                <input
                  type="number"
                  value={newWind.position.y}
                  onChange={(e) => setNewWind({...newWind, position: {...newWind.position, y: Number(e.target.value)}})}
                  style={inputStyle}
                  min="0"
                  max="50"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Z Position:</label>
                <input
                  type="number"
                  value={newWind.position.z}
                  onChange={(e) => setNewWind({...newWind, position: {...newWind.position, z: Number(e.target.value)}})}
                  style={inputStyle}
                  min="-100"
                  max="100"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={addNewWindSource} style={{...buttonStyle, flex: 1}}>
                Add Wind Source
              </button>
              {windSources.length > 0 && (
                <button
                  onClick={clearAllWind}
                  style={{...buttonStyle, background: 'rgba(239, 68, 68, 0.8)'}}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Active Wind Sources */}
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#a0a0a0' }}>
              Active Wind Sources ({windSources.length}):
            </h4>
            
            {windSources.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#666', 
                padding: '15px',
                border: '2px dashed rgba(255, 255, 255, 0.1)',
                borderRadius: '8px'
              }}>
                No wind sources active
              </div>
            ) : (
              windSources.map((source) => (
                <div key={source.id} style={{
                  background: source.enabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                  border: `1px solid ${source.enabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`,
                  borderRadius: '6px',
                  padding: '10px',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>
                        {source.name} {!source.enabled && '(Disabled)'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#b0b0b0' }}>
                        {source.force.toFixed(1)} m/s at {(source.direction * 180 / Math.PI).toFixed(0)}° | 
                        Pos: ({source.position.x}, {source.position.y}, {source.position.z}) | 
                        R: {source.radius}m
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => toggleWindSource(source.id)}
                        style={{
                          ...buttonStyle,
                          background: source.enabled ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)',
                          fontSize: '10px',
                          padding: '4px 6px'
                        }}
                      >
                        {source.enabled ? 'Off' : 'On'}
                      </button>
                      <button
                        onClick={() => removeWindSource(source.id)}
                        style={{
                          ...buttonStyle,
                          background: 'rgba(239, 68, 68, 0.8)',
                          fontSize: '10px',
                          padding: '4px 6px'
                        }}
                      >
                        Del
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}