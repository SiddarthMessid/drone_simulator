import { useDrone } from "../lib/stores/useDrone";
import { gamepadController } from "../lib/gamepadController";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Target, Wifi } from "lucide-react";
import { useSceneMode } from "../lib/stores/useSceneMode";

export default function ControlPanel() {
  const { telemetry, pidParams } = useDrone();
  const { mode: sceneMode } = useSceneMode();
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const [gamepadInfo, setGamepadInfo] = useState("No controller connected");

  useEffect(() => {
    const updateGamepadStatus = () => {
      setGamepadConnected(gamepadController.isConnected());
      setGamepadInfo(gamepadController.getGamepadInfo());
    };

    const interval = setInterval(updateGamepadStatus, 1000);
    updateGamepadStatus(); // Initial check

    return () => clearInterval(interval);
  }, []);

  const infoStyle = {
    padding: "8px 0",
    display: "flex",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    fontSize: "14px",
  };

  const valueStyle = {
    color: "#60a5fa",
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
  };

  return (
    <div style={{ padding: "20px", color: "#e5e5e5" }}>
      <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600" }}>
        Drone Control Panel
      </h3>

      {/* HIL Mode Notification */}
      {sceneMode === "hil" && (
        <div
          style={{
            marginBottom: "20px",
            padding: "16px",
            background: "rgba(234, 179, 8, 0.1)",
            border: "1px solid rgba(234, 179, 8, 0.3)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Wifi
            style={{
              width: "24px",
              height: "24px",
              color: "#eab308",
              animation: "pulse 2s infinite",
            }}
          />
          <div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#eab308",
                marginBottom: "4px",
              }}
            >
              HIL Test Mode Active
            </div>
            <div
              style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)" }}
            >
              CONNECT TO DRONE TO TEST
            </div>
          </div>
        </div>
      )}

      {/* Gamepad Status - Hide in HIL mode */}
      {sceneMode === "simulation" && (
        <div style={{ marginBottom: "24px" }}>
          <h4
            style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#a0a0a0" }}
          >
            🎮 Controller Status:
          </h4>
          <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
            <div
              style={{
                color: gamepadConnected ? "#10b981" : "#ef4444",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              {gamepadConnected ? "✅ Connected" : "❌ Not Connected"}
            </div>
            <div style={{ color: "#b0b0b0", fontSize: "11px" }}>
              {gamepadInfo}
            </div>
            {gamepadConnected && (
              <div
                style={{ marginTop: "8px", fontSize: "11px", color: "#d0d0d0" }}
              >
                <div>
                  <strong>A:</strong> Takeoff | <strong>B:</strong> Land |{" "}
                  <strong>X:</strong> Hover | <strong>Y:</strong> Toggle Mode
                </div>
                <div>
                  <strong>Left Stick:</strong> Pitch/Roll |{" "}
                  <strong>Right Stick:</strong> Yaw/Throttle
                </div>
                <div>
                  <strong>LB:</strong> Throttle Down | <strong>RB:</strong>{" "}
                  Throttle Up
                </div>
                <div>
                  <strong>LT:</strong> Fine Control | <strong>RT:</strong> Boost
                  Control
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keyboard Controls Guide - Hide in HIL mode */}
      {sceneMode === "simulation" && (
        <div style={{ marginBottom: "24px" }}>
          <h4
            style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#a0a0a0" }}
          >
            ⌨️ Keyboard Controls:
          </h4>
          <div
            style={{ fontSize: "12px", color: "#d0d0d0", lineHeight: "1.5" }}
          >
            <div>
              <strong>W/S:</strong> Pitch Forward/Backward
            </div>
            <div>
              <strong>A/D:</strong> Roll Left/Right
            </div>
            <div>
              <strong>←/→:</strong> Yaw Left/Right
            </div>
            <div>
              <strong>↑/↓:</strong> Throttle Up/Down
            </div>
          </div>
        </div>
      )}

      {/* Telemetry Data */}
      <div style={{ marginBottom: "24px" }}>
        <h4
          style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#a0a0a0" }}
        >
          Live Telemetry:
        </h4>

        <div style={infoStyle}>
          <span>Position (X, Y, Z):</span>
          <span style={valueStyle}>
            ({useDrone.getState().position.x.toFixed(1)},{" "}
            {useDrone.getState().position.y.toFixed(1)},{" "}
            {useDrone.getState().position.z.toFixed(1)}) m
          </span>
        </div>

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

        <div style={{ ...infoStyle, borderBottom: "none" }}>
          <span>Throttle:</span>
          <span style={valueStyle}>
            {(telemetry.throttle * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Main drone position hold - Hide in HIL mode */}
      {sceneMode === "simulation" && (
        <div style={{ marginTop: "18px" }}>
          <div
            style={{ marginBottom: "8px", color: "#a0a0a0", fontSize: "13px" }}
          >
            Flight Controls
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Button
              size="sm"
              onClick={() => {
                const s = useDrone.getState();
                s.enableAltitudeHold(!s.altitudeHoldEnabled);
              }}
              variant={
                useDrone.getState().altitudeHoldEnabled ? "default" : "outline"
              }
            >
              <Target className="w-4 h-4 mr-2" />{" "}
              {useDrone.getState().altitudeHoldEnabled
                ? "Holding"
                : "Altitude Hold"}
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                const { drone } = await import("../lib/droneController");
                await drone.brake();
              }}
              variant="destructive"
            >
              🛑 Brake
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                const { drone } = await import("../lib/droneController");
                const { useDrone } = await import("../lib/stores/useDrone");
                const THREE = await import("three");

                try {
                  console.log(`[TEST] ========== MISSION START ==========`);

                  // 1. Takeoff
                  console.log(`[TEST] Step 1: Taking off to 5m...`);
                  await drone.takeoff(5);
                  console.log(`[TEST] ✓ Takeoff complete`);

                  // 2. Fly to target (10m forward)
                  const currentPos = useDrone.getState().position;
                  const currentYaw = useDrone.getState().rotation.y;
                  const targetPos = new THREE.Vector3(
                    currentPos.x + Math.sin(currentYaw) * 10,
                    5, // Same altitude
                    currentPos.z + Math.cos(currentYaw) * 10
                  );

                  console.log(
                    `[TEST] Step 2: Flying to (${targetPos.x.toFixed(
                      1
                    )}, ${targetPos.z.toFixed(1)})...`
                  );
                  await drone.moveTo(targetPos);
                  console.log(`[TEST] ✓ Reached target`);

                  // 3. Land
                  console.log(`[TEST] Step 3: Landing...`);
                  await drone.land();
                  console.log(`[TEST] ✓ Landed`);

                  console.log(`[TEST] ========== MISSION COMPLETE ==========`);
                } catch (error) {
                  console.error(`[TEST] ❌ Mission failed:`, error);
                }
              }}
              variant="secondary"
            >
              🚁 Full Mission
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                const { drone } = await import("../lib/droneController");
                const { useMission } = await import("../lib/stores/useMission");

                try {
                  const { scanPattern } = useMission.getState();

                  if (!scanPattern || scanPattern.type !== "corridor") {
                    console.error(
                      "[CORRIDOR] No corridor scan defined! Add waypoints first."
                    );
                    return;
                  }

                  await drone.executeCorridorScan(scanPattern.waypoints, 5);
                } catch (error) {
                  console.error(`[CORRIDOR] Failed:`, error);
                }
              }}
              variant="default"
            >
              📍 Run Corridor
            </Button>
          </div>
        </div>
      )}

      {/* PID Parameters - Hide in HIL mode */}
      {sceneMode === "simulation" && (
        <div>
          <h4
            style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#a0a0a0" }}
          >
            Current PID Parameters:
          </h4>

          {Object.entries(pidParams).map(([axis, params]) => (
            <div key={axis} style={{ marginBottom: "12px" }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  marginBottom: "4px",
                  textTransform: "capitalize",
                }}
              >
                {axis}:
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#b0b0b0",
                  paddingLeft: "8px",
                }}
              >
                P: <span style={valueStyle}>{params.kp.toFixed(2)}</span> | I:{" "}
                <span style={valueStyle}>{params.ki.toFixed(2)}</span> | D:{" "}
                <span style={valueStyle}>{params.kd.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
