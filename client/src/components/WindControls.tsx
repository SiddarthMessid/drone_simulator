import { useState } from "react";
import { useWind } from "../lib/stores/useWind";

export default function WindControls() {
  const { 
    windForce, 
    windDirection, 
    windType, 
    variableWindParams,
    setWindForce, 
    setWindDirection, 
    setWindType,
    setVariableWindParams 
  } = useWind();
  
  const [tempDirection, setTempDirection] = useState(windDirection * (180 / Math.PI));

  const handleDirectionChange = (degrees: number) => {
    setTempDirection(degrees);
    setWindDirection(degrees * (Math.PI / 180));
  };

  const inputStyle = {
    width: '100%',
    padding: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    color: '#e5e5e5',
    fontSize: '14px'
  };

  const sliderStyle = {
    width: '100%',
    height: '6px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '3px',
    outline: 'none',
    cursor: 'pointer'
  };

  return (
    <div style={{ padding: '20px', color: '#e5e5e5' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
        Wind Controls
      </h3>

      {/* Wind Force */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Wind Force: {windForce.toFixed(1)} m/s
        </label>
        <input
          type="range"
          min="0"
          max="20"
          step="0.5"
          value={windForce}
          onChange={(e) => setWindForce(Number(e.target.value))}
          style={sliderStyle}
        />
      </div>

      {/* Wind Direction */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Wind Direction: {tempDirection.toFixed(0)}°
        </label>
        <input
          type="range"
          min="0"
          max="360"
          step="5"
          value={tempDirection}
          onChange={(e) => handleDirectionChange(Number(e.target.value))}
          style={sliderStyle}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '12px', 
          color: '#a0a0a0',
          marginTop: '4px'
        }}>
          <span>N (0°)</span>
          <span>E (90°)</span>
          <span>S (180°)</span>
          <span>W (270°)</span>
        </div>
      </div>

      {/* Wind Type */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Wind Type:
        </label>
        <select
          value={windType}
          onChange={(e) => setWindType(e.target.value as 'constant' | 'variable')}
          style={inputStyle}
        >
          <option value="constant">Constant</option>
          <option value="variable">Variable</option>
        </select>
      </div>

      {/* Variable Wind Parameters */}
      {windType === 'variable' && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
              Variation Frequency: {variableWindParams.frequency.toFixed(2)} Hz
            </label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={variableWindParams.frequency}
              onChange={(e) => setVariableWindParams({
                ...variableWindParams,
                frequency: Number(e.target.value)
              })}
              style={sliderStyle}
            />
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
              Variation Amplitude: {variableWindParams.amplitude.toFixed(1)} m/s
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={variableWindParams.amplitude}
              onChange={(e) => setVariableWindParams({
                ...variableWindParams,
                amplitude: Number(e.target.value)
              })}
              style={sliderStyle}
            />
          </div>
        </div>
      )}

      {/* Reset Button */}
      <button
        onClick={() => {
          setWindForce(0);
          setWindDirection(0);
          setTempDirection(0);
          setWindType('constant');
          setVariableWindParams({ frequency: 0.5, amplitude: 2 });
        }}
        style={{
          width: '100%',
          padding: '10px',
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '6px',
          color: '#fca5a5',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
        }}
      >
        Clear Wind
      </button>

      {/* Wind Status */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.2)',
        borderRadius: '6px',
        fontSize: '12px'
      }}>
        <div style={{ marginBottom: '4px' }}>
          <strong>Status:</strong> {windForce > 0 ? 'Wind Active' : 'No Wind'}
        </div>
        {windForce > 0 && (
          <div>
            <strong>Effect:</strong> {windType === 'variable' ? 'Variable' : 'Constant'} wind from {
              tempDirection < 45 || tempDirection >= 315 ? 'North' :
              tempDirection < 135 ? 'East' :
              tempDirection < 225 ? 'South' : 'West'
            }
          </div>
        )}
      </div>
    </div>
  );
}
