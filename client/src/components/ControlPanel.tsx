import { useDrone } from "../lib/stores/useDrone";

export default function ControlPanel() {
  const { telemetry, pidParams } = useDrone();

  const infoStyle = {
    padding: '8px 0',
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    fontSize: '14px'
  };

  const valueStyle = {
    color: '#60a5fa',
    fontFamily: 'Monaco, Consolas, "Courier New", monospace'
  };

  return (
    <div style={{ padding: '20px', color: '#e5e5e5' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
        Drone Control Panel
      </h3>

      {/* Controls Guide */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#a0a0a0' }}>
          6-Channel Control System:
        </h4>
        <div style={{ fontSize: '12px', color: '#d0d0d0', lineHeight: '1.5' }}>
          <div><strong>W/S:</strong> Pitch Forward/Backward</div>
          <div><strong>A/D:</strong> Roll Left/Right</div>
          <div><strong>←/→:</strong> Yaw Left/Right</div>
          <div><strong>↑/↓:</strong> Throttle Up/Down</div>
        </div>
      </div>

      {/* Telemetry Data */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#a0a0a0' }}>
          Live Telemetry:
        </h4>
        
        <div style={infoStyle}>
          <span>Altitude:</span>
          <span style={valueStyle}>{telemetry.altitude.toFixed(2)} m</span>
        </div>
        
        <div style={infoStyle}>
          <span>Speed:</span>
          <span style={valueStyle}>{telemetry.speed.toFixed(2)} m/s</span>
        </div>
        
        <div style={infoStyle}>
          <span>Pitch:</span>
          <span style={valueStyle}>{telemetry.pitch.toFixed(1)}°</span>
        </div>
        
        <div style={infoStyle}>
          <span>Roll:</span>
          <span style={valueStyle}>{telemetry.roll.toFixed(1)}°</span>
        </div>
        
        <div style={infoStyle}>
          <span>Yaw:</span>
          <span style={valueStyle}>{telemetry.yaw.toFixed(1)}°</span>
        </div>
        
        <div style={{...infoStyle, borderBottom: 'none'}}>
          <span>Throttle:</span>
          <span style={valueStyle}>{(telemetry.throttle * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* PID Parameters */}
      <div>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#a0a0a0' }}>
          Current PID Parameters:
        </h4>
        
        {Object.entries(pidParams).map(([axis, params]) => (
          <div key={axis} style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', textTransform: 'capitalize' }}>
              {axis}:
            </div>
            <div style={{ fontSize: '11px', color: '#b0b0b0', paddingLeft: '8px' }}>
              P: <span style={valueStyle}>{params.kp.toFixed(2)}</span> | 
              I: <span style={valueStyle}>{params.ki.toFixed(2)}</span> | 
              D: <span style={valueStyle}>{params.kd.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
