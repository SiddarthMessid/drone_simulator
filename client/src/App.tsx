import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import React, { Suspense, useState, useEffect } from "react";
import * as THREE from "three";
import DroneSimulation from "./components/DroneSimulation";
import CodeEditor from "./components/CodeEditor";
import ControlPanel from "./components/ControlPanel";
import WindControls from "./components/WindControls";
import ImportedModels from "./components/ImportedModels";
import EnvironmentEditor from "./components/EnvironmentEditor";
import SceneGenerator from "./components/SceneGenerator";
import RetractableWindControls from "./components/RetractableWindControls";
import ErrorBoundary from "./components/ErrorBoundary";
import WebGLFallback from "./components/WebGLFallback";
import CameraControls from "./components/CameraControls";
import DroneFlockSimple from "./components/DroneFlock.simple";
import MultiDroneControllerSimple from "./components/MultiDroneController.simple";
import MissionPlanner from "./components/MissionPlanner";
import { Button } from "./components/ui/button";
import {
  Settings,
  Wind,
  BarChart3,
  Code,
  ChevronLeft,
  ChevronRight,
  Terminal,
  ChevronUp,
  Sparkles,
  Users,
  Target,
} from "lucide-react";
import DraggableWindow from "./components/DraggableWindow";
import Console from "./components/Console";
import "@fontsource/inter";

// Define control keys for the drone
export enum Controls {
  forward = "forward", // W - Pitch forward
  backward = "backward", // S - Pitch backward
  left = "left", // A - Roll left
  right = "right", // D - Roll right
  yawLeft = "yawLeft", // Left Arrow - Yaw left
  yawRight = "yawRight", // Right Arrow - Yaw right
  throttleUp = "throttleUp", // Up Arrow - Throttle up
  throttleDown = "throttleDown", // Down Arrow - Throttle down
}

const keyMap = [
  { name: Controls.forward, keys: ["KeyW"] },
  { name: Controls.backward, keys: ["KeyS"] },
  { name: Controls.left, keys: ["KeyA"] },
  { name: Controls.right, keys: ["KeyD"] },
  { name: Controls.yawLeft, keys: ["ArrowLeft"] },
  { name: Controls.yawRight, keys: ["ArrowRight"] },
  { name: Controls.throttleUp, keys: ["ArrowUp"] },
  { name: Controls.throttleDown, keys: ["ArrowDown"] },
];

// Check WebGL availability
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!context;
  } catch (e) {
    return false;
  }
}

// Conservative WebGL renderer factory with fallback
function createWebGLRenderer(
  canvas: HTMLCanvasElement | OffscreenCanvas
): THREE.WebGLRenderer {
  try {
    // Try WebGL2 first with conservative settings
    return new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      depth: true,
      stencil: false,
      powerPreference: "low-power",
      failIfMajorPerformanceCaveat: false,
      preserveDrawingBuffer: false,
    });
  } catch (error) {
    console.warn("WebGL2 failed, attempting WebGL1 fallback:", error);
    try {
      // Only attempt manual context creation for HTMLCanvasElement
      if (canvas instanceof HTMLCanvasElement) {
        // Force WebGL1 context
        const gl = canvas.getContext("webgl", {
          antialias: false,
          alpha: true,
          depth: true,
          stencil: false,
          powerPreference: "low-power",
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: false,
        });

        if (!gl) {
          throw new Error("WebGL1 context creation failed");
        }

        return new THREE.WebGLRenderer({
          canvas,
          context: gl,
          antialias: false,
          alpha: true,
          depth: true,
          stencil: false,
          powerPreference: "low-power",
        });
      } else {
        throw new Error("OffscreenCanvas WebGL1 fallback not supported");
      }
    } catch (fallbackError) {
      console.error("Both WebGL2 and WebGL1 failed:", fallbackError);
      throw fallbackError;
    }
  }
}

function App() {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(false);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
  const [isResizingBottom, setIsResizingBottom] = useState(false);
  const [environmentPanelOpen, setEnvironmentPanelOpen] = useState(false);
  const [windPanelOpen, setWindPanelOpen] = useState(false);
  const [controlPanelOpen, setControlPanelOpen] = useState(false);
  const [sceneGeneratorOpen, setSceneGeneratorOpen] = useState(false);
  const [fleetPanelOpen, setFleetPanelOpen] = useState(false);
  const [missionPanelOpen, setMissionPanelOpen] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleBottomMouseDown = (e: React.MouseEvent) => {
    setIsResizingBottom(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX;
        if (newWidth >= 300 && newWidth <= 800) {
          setLeftPanelWidth(newWidth);
        }
      }
      if (isResizingBottom) {
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight >= 150 && newHeight <= 600) {
          setBottomPanelHeight(newHeight);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setIsResizingBottom(false);
    };

    if (isResizing || isResizingBottom) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, isResizingBottom]);

  // Check WebGL availability early
  if (!isWebGLAvailable()) {
    console.warn("WebGL not available, showing fallback UI");
    return <WebGLFallback />;
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        background: "#0a0a0a",
      }}
    >
      <KeyboardControls map={keyMap}>
        {/* Main Layout Container - Column Layout */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          {/* Top Area - Horizontal Layout with Left Panel + Central Canvas */}
          <div
            style={{
              display: "flex",
              flex: 1,
              width: "100%",
              height: bottomPanelOpen
                ? `calc(100% - ${bottomPanelHeight}px)`
                : "100%",
              position: "relative",
            }}
          >
            {/* Left Panel - Code Editor (Collapsible & Resizable) */}
            {leftPanelOpen && (
              <div
                style={{
                  width: `${leftPanelWidth}px`,
                  height: "100%",
                  background: "rgba(20, 20, 20, 0.95)",
                  borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                  position: "relative",
                  zIndex: 10,
                  display: "flex",
                }}
              >
                <div style={{ flex: 1, position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      zIndex: 11,
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLeftPanelOpen(false)}
                      style={{
                        color: "#888",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                  <CodeEditor />
                </div>

                {/* Resize Handle */}
                <div
                  onMouseDown={handleMouseDown}
                  style={{
                    width: "4px",
                    height: "100%",
                    cursor: "col-resize",
                    background: isResizing ? "#0e639c" : "transparent",
                    transition: "background 0.2s",
                    position: "relative",
                    zIndex: 12,
                  }}
                  onMouseEnter={(e) => {
                    if (!isResizing)
                      e.currentTarget.style.background =
                        "rgba(14, 99, 156, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isResizing)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "3px",
                      height: "40px",
                      background: "#3e3e42",
                      borderRadius: "2px",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Central Canvas Area */}
            <div
              style={{
                flex: 1,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* 3D Canvas with Error Boundary */}
              <ErrorBoundary>
                <Canvas
                  camera={{
                    position: [0, 10, 20],
                    fov: 60,
                    near: 0.1,
                    far: 1000,
                  }}
                  shadows={true}
                  dpr={[1, 1]}
                  gl={createWebGLRenderer}
                  style={{ width: "100%", height: "100%" }}
                >
                  <Suspense fallback={null}>
                    <DroneSimulation />
                    <DroneFlockSimple />
                    <ImportedModels />
                  </Suspense>
                </Canvas>
              </ErrorBoundary>

              {/* Left Panel Toggle Button (when collapsed) */}
              {!leftPanelOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    zIndex: 20,
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLeftPanelOpen(true)}
                    style={{
                      color: "#888",
                      background: "rgba(0,0,0,0.7)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Code Editor
                  </Button>
                </div>
              )}

              {/* Right Panel Toggle Buttons */}
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  zIndex: 20,
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSceneGeneratorOpen(true)}
                  style={{
                    color: "#888",
                    background: "rgba(0,0,0,0.7)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Scene
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEnvironmentPanelOpen(true)}
                  style={{
                    color: "#888",
                    background: "rgba(0,0,0,0.7)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Environment
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWindPanelOpen(true)}
                  style={{
                    color: "#888",
                    background: "rgba(0,0,0,0.7)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Wind className="h-4 w-4 mr-2" />
                  Wind
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setControlPanelOpen(true)}
                  style={{
                    color: "#888",
                    background: "rgba(0,0,0,0.7)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Data
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFleetPanelOpen(true)}
                  style={{
                    color: "#888",
                    background: "rgba(0,0,0,0.7)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Fleet
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMissionPanelOpen(true)}
                  style={{
                    color: "#888",
                    background: "rgba(0,0,0,0.7)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Mission
                </Button>
              </div>

              {/* Console Toggle Button (when collapsed) */}
              {!bottomPanelOpen && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 20,
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBottomPanelOpen(true)}
                    style={{
                      color: "#888",
                      background: "rgba(0,0,0,0.7)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <Terminal className="h-4 w-4 mr-2" />
                    Console
                  </Button>
                </div>
              )}

              {/* Camera Controls */}
              <CameraControls />
            </div>
          </div>

          {/* Bottom Panel - Console (Resizable) */}
          {bottomPanelOpen && (
            <div
              style={{
                width: "100%",
                height: `${bottomPanelHeight}px`,
                background: "rgba(20, 20, 20, 0.95)",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                position: "relative",
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Resize Handle */}
              <div
                onMouseDown={handleBottomMouseDown}
                style={{
                  width: "100%",
                  height: "4px",
                  cursor: "row-resize",
                  background: isResizingBottom ? "#0e639c" : "transparent",
                  transition: "background 0.2s",
                  position: "relative",
                  zIndex: 12,
                }}
                onMouseEnter={(e) => {
                  if (!isResizingBottom)
                    e.currentTarget.style.background = "rgba(14, 99, 156, 0.3)";
                }}
                onMouseLeave={(e) => {
                  if (!isResizingBottom)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "40px",
                    height: "3px",
                    background: "#3e3e42",
                    borderRadius: "2px",
                    pointerEvents: "none",
                  }}
                />
              </div>

              <div
                style={{ flex: 1, position: "relative", overflow: "hidden" }}
              >
                <Console onClose={() => setBottomPanelOpen(false)} />
              </div>
            </div>
          )}

          {/* Draggable Windows */}
          <DraggableWindow
            title="Scene Generator"
            isOpen={sceneGeneratorOpen}
            onClose={() => setSceneGeneratorOpen(false)}
            initialPosition={{
              x: typeof window !== "undefined" ? window.innerWidth - 420 : 800,
              y: 50,
            }}
            width={400}
            height={650}
          >
            <SceneGenerator />
          </DraggableWindow>

          <DraggableWindow
            title="Environment Editor"
            isOpen={environmentPanelOpen}
            onClose={() => setEnvironmentPanelOpen(false)}
            initialPosition={{
              x: typeof window !== "undefined" ? window.innerWidth - 420 : 800,
              y: 100,
            }}
            width={400}
            height={500}
          >
            <EnvironmentEditor />
          </DraggableWindow>

          <DraggableWindow
            title="Wind Controls"
            isOpen={windPanelOpen}
            onClose={() => setWindPanelOpen(false)}
            initialPosition={{
              x: typeof window !== "undefined" ? window.innerWidth - 420 : 800,
              y: 150,
            }}
            width={400}
            height={400}
          >
            <WindControls />
          </DraggableWindow>

          <DraggableWindow
            title="Drone Data Panel"
            isOpen={controlPanelOpen}
            onClose={() => setControlPanelOpen(false)}
            initialPosition={{
              x: typeof window !== "undefined" ? window.innerWidth - 420 : 800,
              y: 200,
            }}
            width={400}
            height={600}
          >
            <ControlPanel />
          </DraggableWindow>

          <DraggableWindow
            title="Drone Fleet Control"
            isOpen={fleetPanelOpen}
            onClose={() => setFleetPanelOpen(false)}
            initialPosition={{
              x: typeof window !== "undefined" ? window.innerWidth - 420 : 800,
              y: 250,
            }}
            width={400}
            height={550}
          >
            <MultiDroneControllerSimple />
          </DraggableWindow>

          <DraggableWindow
            title="Mission Planner"
            isOpen={missionPanelOpen}
            onClose={() => setMissionPanelOpen(false)}
            initialPosition={{
              x: typeof window !== "undefined" ? window.innerWidth - 420 : 800,
              y: 250,
            }}
            width={400}
            height={360}
          >
            {/* Lazy load MissionPlanner to keep bundle small */}
            <React.Suspense fallback={<div>Loading...</div>}>
              {/** Import component dynamically to avoid top-level import issues */}
              <MissionPlanner />
            </React.Suspense>
          </DraggableWindow>
        </div>
      </KeyboardControls>
    </div>
  );
}

export default App;
