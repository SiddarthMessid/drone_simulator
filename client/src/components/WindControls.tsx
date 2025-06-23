import { useState } from "react";
import { useWind, WindSource } from "../lib/stores/useWind";

export default function WindControls() {
  const { 
    windSources,
    addWindSource,
    updateWindSource,
    removeWindSource,
    toggleWindSource,
    clearAllWind
  } = useWind();
  
  const [showAddForm, setShowAddForm] = useState(false);
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

  const addNewWindSource = () => {
    addWindSource(newWind);
    resetForm();
    setShowAddForm(false);
  };

  const startEdit = (source: WindSource) => {
    setEditingId(source.id);
    setNewWind({
      name: source.name,
      force: source.force,
      direction: source.direction,
      type: source.type,
      variableParams: source.variableParams,
      position: source.position,
      radius: source.radius,
      enabled: source.enabled
    });
    setShowAddForm(true);
  };

  const saveEdit = () => {
    if (editingId) {
      updateWindSource(editingId, newWind);
      setEditingId(null);
      resetForm();
      setShowAddForm(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
    setShowAddForm(false);
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

  const dangerButtonStyle = {
    ...buttonStyle,
    background: 'rgba(239, 68, 68, 0.8)'
  };

  return (
    <div style={{ padding: '20px', color: '#e5e5e5', maxHeight: '600px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
          Wind System
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              if (showAddForm && !editingId) {
                setShowAddForm(false);
              } else if (editingId) {
                cancelEdit();
              } else {
                setShowAddForm(true);
              }
            }}
            style={buttonStyle}
          >
            {showAddForm ? (editingId ? 'Cancel Edit' : 'Cancel') : '+ Add Wind'}
          </button>
          {windSources.length > 0 && (
            <button
              onClick={clearAllWind}
              style={dangerButtonStyle}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Add Wind Form */}
      {showAddForm && (
        <div style={{
          background: 'rgba(30, 30, 30, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
            {editingId ? 'Edit Wind Source' : 'Add New Wind Source'}
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Name:</label>
              <input
                type="text"
                value={newWind.name}
                onChange={(e) => setNewWind({...newWind, name: e.target.value})}
                style={inputStyle}
              />
            </div>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
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

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Type:</label>
            <select
              value={newWind.type}
              onChange={(e) => setNewWind({...newWind, type: e.target.value as 'constant' | 'variable'})}
              style={inputStyle}
            >
              <option value="constant">Constant</option>
              <option value="variable">Variable</option>
            </select>
          </div>

          {newWind.type === 'variable' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Frequency (Hz):</label>
                <input
                  type="number"
                  value={newWind.variableParams.frequency}
                  onChange={(e) => setNewWind({
                    ...newWind, 
                    variableParams: {...newWind.variableParams, frequency: Number(e.target.value)}
                  })}
                  style={inputStyle}
                  min="0.1"
                  max="5"
                  step="0.1"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Amplitude (m/s):</label>
                <input
                  type="number"
                  value={newWind.variableParams.amplitude}
                  onChange={(e) => setNewWind({
                    ...newWind, 
                    variableParams: {...newWind.variableParams, amplitude: Number(e.target.value)}
                  })}
                  style={inputStyle}
                  min="0"
                  max="10"
                  step="0.5"
                />
              </div>
            </div>
          )}

          <button 
            onClick={editingId ? saveEdit : addNewWindSource} 
            style={{...buttonStyle, width: '100%'}}
          >
            {editingId ? 'Save Changes' : 'Add Wind Source'}
          </button>
        </div>
      )}

      {/* Wind Sources List */}
      <div style={{ fontSize: '14px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#a0a0a0' }}>
          Active Wind Sources ({windSources.length}):
        </h4>
        
        {windSources.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#666', 
            padding: '20px',
            border: '2px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '8px'
          }}>
            No wind sources added. Click "Add Wind" to create one.
          </div>
        ) : (
          windSources.map((source) => (
            <div key={source.id} style={{
              background: source.enabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
              border: `1px solid ${source.enabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`,
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600' }}>
                    {source.name} {!source.enabled && '(Disabled)'}
                  </h5>
                  <div style={{ fontSize: '11px', color: '#b0b0b0', lineHeight: '1.4' }}>
                    <div>Force: {source.force.toFixed(1)} m/s | Direction: {(source.direction * 180 / Math.PI).toFixed(0)}°</div>
                    <div>Position: ({source.position.x}, {source.position.y}, {source.position.z}) | Radius: {source.radius}m</div>
                    <div>Type: {source.type}{source.type === 'variable' ? ` (${source.variableParams.frequency}Hz, ±${source.variableParams.amplitude})` : ''}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                  <button
                    onClick={() => startEdit(source)}
                    style={{
                      ...buttonStyle,
                      background: 'rgba(59, 130, 246, 0.8)',
                      fontSize: '10px',
                      padding: '4px 8px'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleWindSource(source.id)}
                    style={{
                      ...buttonStyle,
                      background: source.enabled ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)',
                      fontSize: '10px',
                      padding: '4px 8px'
                    }}
                  >
                    {source.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => removeWindSource(source.id)}
                    style={{...dangerButtonStyle, fontSize: '10px', padding: '4px 8px'}}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {windSources.length > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '6px',
          fontSize: '12px'
        }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>Wind System Status:</strong> {windSources.filter(s => s.enabled).length} active source(s)
          </div>
          <div>
            Wind forces are calculated based on drone position relative to each wind source's area of effect.
          </div>
        </div>
      )}
    </div>
  );
}