import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import { Suspense, useState } from "react";
import * as THREE from "three";
import DroneSimulation from "./components/DroneSimulation";
import CodeEditor from "./components/CodeEditor";
import ControlPanel from "./components/ControlPanel";
import WindControls from "./components/WindControls";
import EnvironmentEditor from "./components/EnvironmentEditor";
import RetractableWindControls from "./components/RetractableWindControls";
import ErrorBoundary from "./components/ErrorBoundary";
import WebGLFallback from "./components/WebGLFallback";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./components/ui/sheet";
import { Button } from "./components/ui/button";
import { Settings, Wind, BarChart3, Code, ChevronLeft, ChevronRight } from "lucide-react";
import "@fontsource/inter";

// Define control keys for the drone
export enum Controls {
  forward = 'forward',      // W - Pitch forward
  backward = 'backward',    // S - Pitch backward
  left = 'left',           // A - Roll left
  right = 'right',         // D - Roll right
  yawLeft = 'yawLeft',     // Left Arrow - Yaw left
  yawRight = 'yawRight',   // Right Arrow - Yaw right
  throttleUp = 'throttleUp', // Up Arrow - Throttle up
  throttleDown = 'throttleDown', // Down Arrow - Throttle down
}

const keyMap = [
  { name: Controls.forward, keys: ['KeyW'] },
  { name: Controls.backward, keys: ['KeyS'] },
  { name: Controls.left, keys: ['KeyA'] },
  { name: Controls.right, keys: ['KeyD'] },
  { name: Controls.yawLeft, keys: ['ArrowLeft'] },
  { name: Controls.yawRight, keys: ['ArrowRight'] },
  { name: Controls.throttleUp, keys: ['ArrowUp'] },
  { name: Controls.throttleDown, keys: ['ArrowDown'] },
];

// Check WebGL availability
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!context;
  } catch (e) {
    return false;
  }
}

// Conservative WebGL renderer factory with fallback
function createWebGLRenderer(canvas: HTMLCanvasElement | OffscreenCanvas): THREE.WebGLRenderer {
  try {
    // Try WebGL2 first with conservative settings
    return new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      depth: true,
      stencil: false,
      powerPreference: 'low-power',
      failIfMajorPerformanceCaveat: false,
      preserveDrawingBuffer: false
    });
  } catch (error) {
    console.warn('WebGL2 failed, attempting WebGL1 fallback:', error);
    try {
      // Only attempt manual context creation for HTMLCanvasElement
      if (canvas instanceof HTMLCanvasElement) {
        // Force WebGL1 context
        const gl = canvas.getContext('webgl', {
          antialias: false,
          alpha: true,
          depth: true,
          stencil: false,
          powerPreference: 'low-power',
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: false
        });
        
        if (!gl) {
          throw new Error('WebGL1 context creation failed');
        }
        
        return new THREE.WebGLRenderer({
          canvas,
          context: gl,
          antialias: false,
          alpha: true,
          depth: true,
          stencil: false,
          powerPreference: 'low-power'
        });
      } else {
        throw new Error('OffscreenCanvas WebGL1 fallback not supported');
      }
    } catch (fallbackError) {
      console.error('Both WebGL2 and WebGL1 failed:', fallbackError);
      throw fallbackError;
    }
  }
}

function App() {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [environmentPanelOpen, setEnvironmentPanelOpen] = useState(false);
  const [windPanelOpen, setWindPanelOpen] = useState(false);
  const [controlPanelOpen, setControlPanelOpen] = useState(false);

  // Check WebGL availability early
  if (!isWebGLAvailable()) {
    console.warn('WebGL not available, showing fallback UI');
    return <WebGLFallback />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#0a0a0a' }}>
      <KeyboardControls map={keyMap}>
        {/* Main Layout Container */}
        <div style={{ 
          display: 'flex', 
          width: '100%', 
          height: '100%', 
          position: 'relative' 
        }}>
          
          {/* Left Panel - Code Editor (Collapsible) */}
          {leftPanelOpen && (
            <div style={{ 
              width: '400px', 
              height: '100%', 
              background: 'rgba(20, 20, 20, 0.95)',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative',
              zIndex: 10
            }}>
              <div style={{ 
                position: 'absolute', 
                top: '10px', 
                right: '10px', 
                zIndex: 11 
              }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLeftPanelOpen(false)}
                  style={{ 
                    color: '#888', 
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <CodeEditor />
            </div>
          )}

          {/* Central Canvas Area */}
          <div style={{ 
            flex: 1, 
            position: 'relative', 
            overflow: 'hidden' 
          }}>
            {/* 3D Canvas with Error Boundary */}
            <ErrorBoundary>
              <Canvas
                camera={{
                  position: [0, 10, 20],
                  fov: 60,
                  near: 0.1,
                  far: 1000
                }}
                shadows={true}
                dpr={[1, 1]}
                gl={createWebGLRenderer}
                style={{ width: '100%', height: '100%' }}
              >
                <Suspense fallback={null}>
                  <DroneSimulation />
                </Suspense>
              </Canvas>
            </ErrorBoundary>

            {/* Left Panel Toggle Button (when collapsed) */}
            {!leftPanelOpen && (
              <div style={{ 
                position: 'absolute', 
                top: '10px', 
                left: '10px', 
                zIndex: 20 
              }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLeftPanelOpen(true)}
                  style={{ 
                    color: '#888', 
                    background: 'rgba(0,0,0,0.7)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <Code className="h-4 w-4 mr-2" />
                  Code Editor
                </Button>
              </div>
            )}

            {/* Right Panel Toggle Buttons */}
            <div style={{ 
              position: 'absolute', 
              top: '10px', 
              right: '10px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px', 
              zIndex: 20 
            }}>
              
              {/* Environment Editor Sheet */}
              <Sheet open={environmentPanelOpen} onOpenChange={setEnvironmentPanelOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onMouseEnter={() => setEnvironmentPanelOpen(true)}
                    style={{ 
                      color: '#888', 
                      background: 'rgba(0,0,0,0.7)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Environment
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] bg-zinc-900 border-zinc-700">
                  <SheetHeader>
                    <SheetTitle className="text-white">Environment Editor</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <EnvironmentEditor />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Wind Controls Sheet */}
              <Sheet open={windPanelOpen} onOpenChange={setWindPanelOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onMouseEnter={() => setWindPanelOpen(true)}
                    style={{ 
                      color: '#888', 
                      background: 'rgba(0,0,0,0.7)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <Wind className="h-4 w-4 mr-2" />
                    Wind
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] bg-zinc-900 border-zinc-700">
                  <SheetHeader>
                    <SheetTitle className="text-white">Wind Controls</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <WindControls />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Control Panel Sheet */}
              <Sheet open={controlPanelOpen} onOpenChange={setControlPanelOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onMouseEnter={() => setControlPanelOpen(true)}
                    style={{ 
                      color: '#888', 
                      background: 'rgba(0,0,0,0.7)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Data
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] bg-zinc-900 border-zinc-700">
                  <SheetHeader>
                    <SheetTitle className="text-white">Drone Control Panel</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <ControlPanel />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </KeyboardControls>
    </div>
  );
}

export default App;
