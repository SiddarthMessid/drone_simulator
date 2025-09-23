import React, { Component, ReactNode } from 'react';
import WebGLFallback from './WebGLFallback';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('WebGL Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Check if it's a WebGL-related error
      const isWebGLError = this.state.error?.message?.toLowerCase().includes('webgl') ||
                          this.state.error?.message?.toLowerCase().includes('context') ||
                          this.state.error?.stack?.toLowerCase().includes('webgl');
      
      if (isWebGLError) {
        return <WebGLFallback />;
      }
      
      // For other errors, show a generic fallback
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
            <h2>Something went wrong</h2>
            <p>Please refresh the page to try again.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}