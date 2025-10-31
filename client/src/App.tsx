import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import React, { Suspense, useState, useEffect } from "react";
import * as THREE from "three";
import DroneSimulation from "./components/DroneSimulation";
import CodeEditor from "./components/CodeEditor";
import FileExplorer from "./components/FileExplorer";
import ControlPanel from "./components/ControlPanel";
import WindControls from "./components/WindControls";
import ImportedModels from "./components/ImportedModels";
import EnvironmentEditorInteractive from "./components/EnvironmentEditorInteractive";
import TerrainEditor from "./components/TerrainEditor";
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
  FileCode,
} from "lucide-react";
import DraggableWindow from "./components/DraggableWindow";
import Console from "./components/Console";
import PositionDisplay from "./components/PositionDisplay";
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
  const [terrainEditorOpen, setTerrainEditorOpen] = useState(false);
  const [fleetPanelOpen, setFleetPanelOpen] = useState(false);
  const [missionPanelOpen, setMissionPanelOpen] = useState(false);
  const [fileExplorerOpen, setFileExplorerOpen] = useState(true);
  const [fileExplorerWidth, setFileExplorerWidth] = useState(250);
  const [isResizingFileExplorer, setIsResizingFileExplorer] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleBottomMouseDown = (e: React.MouseEvent) => {
    setIsResizingBottom(true);
    e.preventDefault();
  };

  const handleFileExplorerMouseDown = (e: React.MouseEvent) => {
    setIsResizingFileExplorer(true);
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
      if (isResizingFileExplorer) {
        const newWidth = e.clientX;
        if (newWidth >= 150 && newWidth <= 400) {
          setFileExplorerWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setIsResizingBottom(false);
      setIsResizingFileExplorer(false);
    };

    if (isResizing || isResizingBottom || isResizingFileExplorer) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, isResizingBottom, isResizingFileExplorer]);

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
        {/* Header */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "40px",
            background: "rgba(20, 20, 20, 0.95)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            zIndex: 1000,
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Logo/Icon */}
          <div
            style={{
              width: "28px",
              height: "28px",
              background: "rgba(14, 165, 233, 0.15)",
              border: "1px solid rgba(14, 165, 233, 0.3)",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "12px",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L4 6V12C4 16.5 7.5 20.5 12 22C16.5 20.5 20 16.5 20 12V6L12 2Z"
                fill="rgba(14, 165, 233, 0.6)"
              />
              <circle cx="12" cy="10" r="2" fill="#0a0a0a" />
              <circle cx="8" cy="8" r="1.5" fill="#0a0a0a" />
              <circle cx="16" cy="8" r="1.5" fill="#0a0a0a" />
              <circle cx="8" cy="12" r="1.5" fill="#0a0a0a" />
              <circle cx="16" cy="12" r="1.5" fill="#0a0a0a" />
            </svg>
          </div>

          {/* Title */}
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "rgba(255, 255, 255, 0.9)",
                margin: 0,
                letterSpacing: "0.3px",
              }}
            >
              3D Drone Simulator
            </h1>
          </div>

          {/* Status Badge */}
          <div
            style={{
              padding: "4px 12px",
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 6px rgba(34, 197, 94, 0.5)",
                animation: "pulse 2s infinite",
              }}
            />
            <span
              style={{
                fontSize: "11px",
                fontWeight: "500",
                color: "#22c55e",
              }}
            >
              ONLINE
            </span>
          </div>
        </div>

        {/* Main Layout Container - Column Layout */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            position: "relative",
            paddingTop: "40px", // Add padding for header
          }}
        >
          {/* Top Area - Horizontal Layout with File Explorer + Code Editor + Central Canvas */}
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
            {/* File Explorer - Independent Panel */}
            {fileExplorerOpen && (
              <>
                <div
                  style={{
                    width: `${fileExplorerWidth}px`,
                    height: "100%",
                    background: "rgba(10, 10, 10, 0.98)",
                    borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                    flexShrink: 0,
                  }}
                >
                  <FileExplorer />
                </div>

                {/* File Explorer Resize Handle */}
                <div
                  onMouseDown={handleFileExplorerMouseDown}
                  style={{
                    width: "4px",
                    height: "100%",
                    cursor: "col-resize",
                    background: isResizingFileExplorer
                      ? "#0e639c"
                      : "transparent",
                    transition: "background 0.2s",
                    position: "relative",
                    zIndex: 12,
                  }}
                  onMouseEnter={(e) => {
                    if (!isResizingFileExplorer)
                      e.currentTarget.style.background =
                        "rgba(14, 99, 156, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isResizingFileExplorer)
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
              </>
            )}

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
                  onClick={() => setTerrainEditorOpen(true)}
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

              {/* Position Display - Bottom Right (inside canvas area) */}
              <PositionDisplay />
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
            title="Terrain Editor"
            isOpen={terrainEditorOpen}
            onClose={() => setTerrainEditorOpen(false)}
            initialPosition={{
              x: typeof window !== "undefined" ? window.innerWidth - 420 : 800,
              y: 50,
            }}
            width={400}
            height={500}
          >
            <TerrainEditor />
          </DraggableWindow>

          <DraggableWindow
            title="Environment Editor"
            isOpen={environmentPanelOpen}
            onClose={() => setEnvironmentPanelOpen(false)}
            initialPosition={{
              x: typeof window !== "undefined" ? window.innerWidth - 420 : 800,
              y: 50,
            }}
            width={420}
            height={650}
          >
            <EnvironmentEditorInteractive />
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
