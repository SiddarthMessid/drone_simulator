import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import { Suspense } from "react";
import DroneSimulation from "./components/DroneSimulation";
import CodeEditor from "./components/CodeEditor";
import ControlPanel from "./components/ControlPanel";
import WindControls from "./components/WindControls";
import EnvironmentEditor from "./components/EnvironmentEditor";
import RetractableWindControls from "./components/RetractableWindControls";
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

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#0a0a0a' }}>
      <KeyboardControls map={keyMap}>
        {/* Top Retractable Panels */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          pointerEvents: 'auto',
          display: 'flex',
          gap: '10px',
          padding: '10px'
        }}>
          <div style={{ flex: 1 }}>
            <EnvironmentEditor />
          </div>
          <div style={{ flex: 1 }}>
            <RetractableWindControls />
          </div>
        </div>

        {/* 3D Canvas */}
        <Canvas
          camera={{
            position: [0, 10, 20],
            fov: 60,
            near: 0.1,
            far: 1000
          }}
          shadows
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        >
          <Suspense fallback={null}>
            <DroneSimulation />
          </Suspense>
        </Canvas>

        {/* UI Overlays */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          zIndex: 10, 
          pointerEvents: 'none',
          width: '100%',
          height: '100%',
          display: 'flex'
        }}>
          {/* Left Panel - Code Editor */}
          <div style={{ 
            width: '400px', 
            height: '100%', 
            background: 'rgba(20, 20, 20, 0.95)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            pointerEvents: 'auto'
          }}>
            <CodeEditor />
          </div>

          {/* Right Panel - Controls and Info */}
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'flex-end',
            padding: '20px',
            gap: '20px'
          }}>
            <div style={{ 
              width: '350px', 
              background: 'rgba(20, 20, 20, 0.95)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              pointerEvents: 'auto'
            }}>
              <ControlPanel />
            </div>
          </div>
        </div>
      </KeyboardControls>
    </div>
  );
}

export default App;
