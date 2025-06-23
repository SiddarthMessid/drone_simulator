import { useState } from "react";
import { useEnvironment, Obstacle } from "../lib/stores/useEnvironment";

export default function EnvironmentEditor() {
  const { 
    obstacles,
    environmentSize,
    addObstacle,
    removeObstacle,
    updateObstacle,
    setEnvironmentSize
  } = useEnvironment();
  
  const [showPanel, setShowPanel] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newObstacle, setNewObstacle] = useState({
    name: "Obstacle",
    position: { x: 0, y: 2, z: 0 },
    size: { x: 2, y: 4, z: 2 },
    color: "#666666"
  });
  const [envSize, setEnvSize] = useState(environmentSize);

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

  const addNewObstacle = () => {
    addObstacle(newObstacle);
    resetObstacleForm();
  };

  const resetObstacleForm = () => {
    setNewObstacle({
      name: "Obstacle",
      position: { x: 0, y: 2, z: 0 },
      size: { x: 2, y: 4, z: 2 },
      color: "#666666"
    });
  };

  const startEdit = (obstacle: Obstacle) => {
    setEditingId(obstacle.id);
  };

  const saveEdit = (id: string, updates: Partial<Obstacle>) => {
    updateObstacle(id, updates);
    setEditingId(null);
  };

  const updateEnvironmentSize = () => {
    setEnvironmentSize(envSize);
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
        <span>{showPanel ? '▼ Hide Environment Editor' : '▶ Environment Editor'}</span>
        <span style={{ fontSize: '10px', opacity: 0.8 }}>
          {obstacles.length} obstacles
        </span>
      </button>

      {/* Retractable Content */}
      {showPanel && (
        <div style={{ padding: '20px', color: '#e5e5e5', maxHeight: '400px', overflowY: 'auto' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
            Environment Configuration
          </h3>

          {/* Environment Size Controls */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#a0a0a0' }}>
              Environment Size:
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Width (m):</label>
                <input
                  type="number"
                  value={envSize.width}
                  onChange={(e) => setEnvSize({...envSize, width: Number(e.target.value)})}
                  style={inputStyle}
                  min="50"
                  max="500"
                  step="10"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Height (m):</label>
                <input
                  type="number"
                  value={envSize.height}
                  onChange={(e) => setEnvSize({...envSize, height: Number(e.target.value)})}
                  style={inputStyle}
                  min="50"
                  max="500"
                  step="10"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'end' }}>
                <button onClick={updateEnvironmentSize} style={{...buttonStyle, width: '100%'}}>
                  Update Size
                </button>
              </div>
            </div>
          </div>

          {/* Add New Obstacle */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#a0a0a0' }}>
              Add New Obstacle:
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Name:</label>
                <input
                  type="text"
                  value={newObstacle.name}
                  onChange={(e) => setNewObstacle({...newObstacle, name: e.target.value})}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Color:</label>
                <input
                  type="color"
                  value={newObstacle.color}
                  onChange={(e) => setNewObstacle({...newObstacle, color: e.target.value})}
                  style={{...inputStyle, height: '30px'}}
                />
              </div>
            </div>

            {/* Position Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>X Position:</label>
                <input
                  type="number"
                  value={newObstacle.position.x}
                  onChange={(e) => setNewObstacle({...newObstacle, position: {...newObstacle.position, x: Number(e.target.value)}})}
                  style={inputStyle}
                  min="-50"
                  max="50"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Y Position:</label>
                <input
                  type="number"
                  value={newObstacle.position.y}
                  onChange={(e) => setNewObstacle({...newObstacle, position: {...newObstacle.position, y: Number(e.target.value)}})}
                  style={inputStyle}
                  min="0"
                  max="50"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Z Position:</label>
                <input
                  type="number"
                  value={newObstacle.position.z}
                  onChange={(e) => setNewObstacle({...newObstacle, position: {...newObstacle.position, z: Number(e.target.value)}})}
                  style={inputStyle}
                  min="-50"
                  max="50"
                />
              </div>
            </div>

            {/* Size Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Width:</label>
                <input
                  type="number"
                  value={newObstacle.size.x}
                  onChange={(e) => setNewObstacle({...newObstacle, size: {...newObstacle.size, x: Number(e.target.value)}})}
                  style={inputStyle}
                  min="0.5"
                  max="20"
                  step="0.5"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Height:</label>
                <input
                  type="number"
                  value={newObstacle.size.y}
                  onChange={(e) => setNewObstacle({...newObstacle, size: {...newObstacle.size, y: Number(e.target.value)}})}
                  style={inputStyle}
                  min="0.5"
                  max="50"
                  step="0.5"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Depth:</label>
                <input
                  type="number"
                  value={newObstacle.size.z}
                  onChange={(e) => setNewObstacle({...newObstacle, size: {...newObstacle.size, z: Number(e.target.value)}})}
                  style={inputStyle}
                  min="0.5"
                  max="20"
                  step="0.5"
                />
              </div>
            </div>

            <button onClick={addNewObstacle} style={{...buttonStyle, width: '100%'}}>
              Add Obstacle
            </button>
          </div>

          {/* Existing Obstacles */}
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#a0a0a0' }}>
              Obstacles ({obstacles.length}):
            </h4>
            
            {obstacles.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#666', 
                padding: '15px',
                border: '2px dashed rgba(255, 255, 255, 0.1)',
                borderRadius: '8px'
              }}>
                No custom obstacles added
              </div>
            ) : (
              obstacles.map((obstacle) => (
                <div key={obstacle.id} style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '6px',
                  padding: '10px',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>
                        {obstacle.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#b0b0b0' }}>
                        Pos: ({obstacle.position.x}, {obstacle.position.y}, {obstacle.position.z}) | 
                        Size: ({obstacle.size.x}, {obstacle.size.y}, {obstacle.size.z})
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => startEdit(obstacle)}
                        style={{
                          ...buttonStyle,
                          background: 'rgba(34, 197, 94, 0.8)',
                          fontSize: '10px',
                          padding: '4px 6px'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeObstacle(obstacle.id)}
                        style={{
                          ...buttonStyle,
                          background: 'rgba(239, 68, 68, 0.8)',
                          fontSize: '10px',
                          padding: '4px 6px'
                        }}
                      >
                        Delete
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