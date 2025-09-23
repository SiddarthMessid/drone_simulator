import { AlertCircle, ExternalLink } from "lucide-react";

export default function WebGLFallback() {
  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: 'rgba(20, 20, 20, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <AlertCircle size={24} color="#f59e0b" />
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
            WebGL Not Available
          </h2>
        </div>
        
        <p style={{ 
          margin: '0 0 24px 0', 
          fontSize: '16px', 
          lineHeight: '1.6',
          color: 'rgba(255, 255, 255, 0.8)'
        }}>
          This drone simulation requires WebGL for 3D graphics. WebGL may not be available in embedded environments.
        </p>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          marginBottom: '24px'
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: '14px', 
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            Try these solutions:
          </p>
          <ul style={{
            textAlign: 'left',
            margin: 0,
            paddingLeft: '20px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            <li>Open in a separate browser tab</li>
            <li>Enable hardware acceleration in browser settings</li>
            <li>Update your graphics drivers</li>
            <li>Try a different browser (Chrome, Firefox, Safari)</li>
          </ul>
        </div>
        
        <button
          onClick={openInNewTab}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '0 auto',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
          onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
        >
          <ExternalLink size={16} />
          Open in New Tab
        </button>
      </div>
    </div>
  );
}