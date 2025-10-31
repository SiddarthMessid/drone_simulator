import { useState } from "react";
import { useEnvironment, Obstacle } from "../lib/stores/useEnvironment";
import { useEnvironmentEditor } from "../lib/stores/useEnvironmentEditor";

type TransformMode = "translate" | "rotate" | null;
type Axis = "x" | "y" | "z";

export default function EnvironmentEditorInteractive() {
  const { obstacles, addObstacle, removeObstacle, updateObstacle } =
    useEnvironment();

  const {
    selectedObstacleId,
    transformMode,
    enabledAxes,
    setSelectedObstacleId,
    setTransformMode,
    toggleAxis,
  } = useEnvironmentEditor();

  const [newObstacle, setNewObstacle] = useState({
    name: "Obstacle",
    position: { x: 0, y: 2, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    size: { x: 2, y: 4, z: 2 },
    color: "#666666",
  });

  const selectedObstacle = obstacles.find((o) => o.id === selectedObstacleId);

  const buttonStyle = {
    padding: "8px 12px",
    background: "rgba(59, 130, 246, 0.8)",
    border: "none",
    borderRadius: "4px",
    color: "white",
    fontSize: "12px",
    cursor: "pointer",
  };

  const activeButtonStyle = {
    ...buttonStyle,
    background: "rgba(34, 197, 94, 0.9)",
    boxShadow: "0 0 10px rgba(34, 197, 94, 0.5)",
  };

  const inputStyle = {
    width: "100%",
    padding: "6px 8px",
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "4px",
    color: "#e5e5e5",
    fontSize: "12px",
  };

  const addNewObstacle = () => {
    // Spawn on ground (y = size.y / 2)
    const groundY = newObstacle.size.y / 2;
    addObstacle({
      ...newObstacle,
      position: { ...newObstacle.position, y: groundY },
    });
    setNewObstacle({
      name: "Obstacle",
      position: { x: 0, y: 2, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      size: { x: 2, y: 4, z: 2 },
      color: "#666666",
    });
  };

  const updateSelectedObstacle = (
    field: string,
    axis: string,
    value: number
  ) => {
    if (!selectedObstacle) return;
    updateObstacle(selectedObstacle.id, {
      [field]: {
        ...selectedObstacle[field as keyof Obstacle],
        [axis]: value,
      },
    });
  };

  return (
    <div
      className="custom-scrollbar"
      style={{
        padding: "15px",
        color: "#e5e5e5",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {/* Transform Controls */}
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          background: "rgba(59, 130, 246, 0.1)",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          borderRadius: "8px",
        }}
      >
        <h4
          style={{
            margin: "0 0 12px 0",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          🎮 Transform Controls
        </h4>

        {/* Mode Selection */}
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "12px",
              color: "#a0a0a0",
            }}
          >
            Mode:
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() =>
                setTransformMode(
                  transformMode === "translate" ? null : "translate"
                )
              }
              style={
                transformMode === "translate" ? activeButtonStyle : buttonStyle
              }
            >
              📍 Translate
            </button>
            <button
              onClick={() =>
                setTransformMode(transformMode === "rotate" ? null : "rotate")
              }
              style={
                transformMode === "rotate" ? activeButtonStyle : buttonStyle
              }
            >
              🔄 Rotate
            </button>
          </div>
        </div>

        {/* Axis Selection */}
        {transformMode && (
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "12px",
                color: "#a0a0a0",
              }}
            >
              Axes {transformMode === "rotate" && "(one at a time)"}
              {transformMode === "translate" && "(max 2)"}:
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => toggleAxis("x")}
                style={{
                  ...buttonStyle,
                  background: enabledAxes.has("x")
                    ? "rgba(255, 0, 0, 0.8)"
                    : "rgba(100, 100, 100, 0.5)",
                  flex: 1,
                }}
              >
                X
              </button>
              <button
                onClick={() => toggleAxis("y")}
                style={{
                  ...buttonStyle,
                  background: enabledAxes.has("y")
                    ? "rgba(0, 255, 0, 0.8)"
                    : "rgba(100, 100, 100, 0.5)",
                  flex: 1,
                }}
              >
                Y
              </button>
              <button
                onClick={() => toggleAxis("z")}
                style={{
                  ...buttonStyle,
                  background: enabledAxes.has("z")
                    ? "rgba(0, 0, 255, 0.8)"
                    : "rgba(100, 100, 100, 0.5)",
                  flex: 1,
                }}
              >
                Z
              </button>
            </div>
          </div>
        )}

        {!selectedObstacle && (
          <div
            style={{
              marginTop: "12px",
              padding: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "4px",
              fontSize: "11px",
              color: "#999",
            }}
          >
            💡 Click an obstacle in the scene to select and transform it
          </div>
        )}
      </div>

      {/* Selected Obstacle Details */}
      {selectedObstacle && (
        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            background: "rgba(255, 215, 0, 0.1)",
            border: "2px solid rgba(255, 215, 0, 0.4)",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>
              ✏️ {selectedObstacle.name}
            </h4>
            <button
              onClick={() => setSelectedObstacleId(null)}
              style={{
                ...buttonStyle,
                background: "rgba(100, 100, 100, 0.5)",
                padding: "4px 8px",
                fontSize: "10px",
              }}
            >
              Deselect
            </button>
          </div>

          {/* Position */}
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "11px",
                color: "#a0a0a0",
              }}
            >
              Position:
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "4px",
              }}
            >
              <input
                type="number"
                value={selectedObstacle.position.x.toFixed(2)}
                onChange={(e) =>
                  updateSelectedObstacle(
                    "position",
                    "x",
                    Number(e.target.value)
                  )
                }
                style={{ ...inputStyle, fontSize: "10px" }}
                step="0.1"
              />
              <input
                type="number"
                value={selectedObstacle.position.y.toFixed(2)}
                onChange={(e) =>
                  updateSelectedObstacle(
                    "position",
                    "y",
                    Number(e.target.value)
                  )
                }
                style={{ ...inputStyle, fontSize: "10px" }}
                step="0.1"
              />
              <input
                type="number"
                value={selectedObstacle.position.z.toFixed(2)}
                onChange={(e) =>
                  updateSelectedObstacle(
                    "position",
                    "z",
                    Number(e.target.value)
                  )
                }
                style={{ ...inputStyle, fontSize: "10px" }}
                step="0.1"
              />
            </div>
          </div>

          {/* Rotation */}
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "11px",
                color: "#a0a0a0",
              }}
            >
              Rotation (degrees):
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "4px",
              }}
            >
              <input
                type="number"
                value={(
                  ((selectedObstacle.rotation?.x || 0) * 180) /
                  Math.PI
                ).toFixed(1)}
                onChange={(e) =>
                  updateSelectedObstacle(
                    "rotation",
                    "x",
                    (Number(e.target.value) * Math.PI) / 180
                  )
                }
                style={{ ...inputStyle, fontSize: "10px" }}
                step="5"
              />
              <input
                type="number"
                value={(
                  ((selectedObstacle.rotation?.y || 0) * 180) /
                  Math.PI
                ).toFixed(1)}
                onChange={(e) =>
                  updateSelectedObstacle(
                    "rotation",
                    "y",
                    (Number(e.target.value) * Math.PI) / 180
                  )
                }
                style={{ ...inputStyle, fontSize: "10px" }}
                step="5"
              />
              <input
                type="number"
                value={(
                  ((selectedObstacle.rotation?.z || 0) * 180) /
                  Math.PI
                ).toFixed(1)}
                onChange={(e) =>
                  updateSelectedObstacle(
                    "rotation",
                    "z",
                    (Number(e.target.value) * Math.PI) / 180
                  )
                }
                style={{ ...inputStyle, fontSize: "10px" }}
                step="5"
              />
            </div>
          </div>

          <button
            onClick={() => {
              removeObstacle(selectedObstacle.id);
              setSelectedObstacleId(null);
            }}
            style={{
              ...buttonStyle,
              width: "100%",
              background: "rgba(239, 68, 68, 0.8)",
            }}
          >
            🗑️ Delete Obstacle
          </button>
        </div>
      )}

      {/* Add New Obstacle */}
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          background: "rgba(34, 197, 94, 0.1)",
          border: "1px solid rgba(34, 197, 94, 0.3)",
          borderRadius: "8px",
        }}
      >
        <h4
          style={{
            margin: "0 0 12px 0",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          ➕ Add New Obstacle
        </h4>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "11px",
              }}
            >
              Name:
            </label>
            <input
              type="text"
              value={newObstacle.name}
              onChange={(e) =>
                setNewObstacle({ ...newObstacle, name: e.target.value })
              }
              style={inputStyle}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "11px",
              }}
            >
              Color:
            </label>
            <input
              type="color"
              value={newObstacle.color}
              onChange={(e) =>
                setNewObstacle({ ...newObstacle, color: e.target.value })
              }
              style={{ ...inputStyle, height: "30px" }}
            />
          </div>
        </div>

        {/* Size */}
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontSize: "11px",
            }}
          >
            Size (W × H × D):
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "4px",
            }}
          >
            <input
              type="number"
              value={newObstacle.size.x}
              onChange={(e) =>
                setNewObstacle({
                  ...newObstacle,
                  size: { ...newObstacle.size, x: Number(e.target.value) },
                })
              }
              style={inputStyle}
              min="0.5"
              step="0.5"
            />
            <input
              type="number"
              value={newObstacle.size.y}
              onChange={(e) =>
                setNewObstacle({
                  ...newObstacle,
                  size: { ...newObstacle.size, y: Number(e.target.value) },
                })
              }
              style={inputStyle}
              min="0.5"
              step="0.5"
            />
            <input
              type="number"
              value={newObstacle.size.z}
              onChange={(e) =>
                setNewObstacle({
                  ...newObstacle,
                  size: { ...newObstacle.size, z: Number(e.target.value) },
                })
              }
              style={inputStyle}
              min="0.5"
              step="0.5"
            />
          </div>
        </div>

        {/* Position */}
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontSize: "11px",
            }}
          >
            Position (X, Z):
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4px",
            }}
          >
            <input
              type="number"
              value={newObstacle.position.x}
              onChange={(e) =>
                setNewObstacle({
                  ...newObstacle,
                  position: {
                    ...newObstacle.position,
                    x: Number(e.target.value),
                  },
                })
              }
              style={inputStyle}
              step="1"
            />
            <input
              type="number"
              value={newObstacle.position.z}
              onChange={(e) =>
                setNewObstacle({
                  ...newObstacle,
                  position: {
                    ...newObstacle.position,
                    z: Number(e.target.value),
                  },
                })
              }
              style={inputStyle}
              step="1"
            />
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "#999",
              marginTop: "4px",
            }}
          >
            Y position auto-calculated to place on ground
          </div>
        </div>

        <button
          onClick={addNewObstacle}
          style={{ ...buttonStyle, width: "100%" }}
        >
          ➕ Add to Scene
        </button>
      </div>

      {/* Obstacle List */}
      <div>
        <h4
          style={{
            margin: "0 0 12px 0",
            fontSize: "14px",
            color: "#a0a0a0",
          }}
        >
          📦 Obstacles ({obstacles.length}):
        </h4>

        {obstacles.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#666",
              padding: "15px",
              border: "2px dashed rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
            }}
          >
            No obstacles in scene
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {obstacles.map((obstacle) => (
              <div
                key={obstacle.id}
                onClick={() => setSelectedObstacleId(obstacle.id)}
                style={{
                  padding: "8px 12px",
                  background:
                    selectedObstacleId === obstacle.id
                      ? "rgba(255, 215, 0, 0.2)"
                      : "rgba(255, 255, 255, 0.05)",
                  border:
                    selectedObstacleId === obstacle.id
                      ? "2px solid rgba(255, 215, 0, 0.6)"
                      : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "11px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (selectedObstacleId !== obstacle.id) {
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedObstacleId !== obstacle.id) {
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.05)";
                  }
                }}
              >
                <div style={{ fontWeight: "600", marginBottom: "2px" }}>
                  {obstacle.name}
                </div>
                <div style={{ color: "#999", fontSize: "10px" }}>
                  Pos: ({obstacle.position.x.toFixed(1)},{" "}
                  {obstacle.position.y.toFixed(1)},{" "}
                  {obstacle.position.z.toFixed(1)})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
