import { useDrone } from "../lib/stores/useDrone";

export default function PositionDisplay() {
  const { position, rotation, velocity } = useDrone();

  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        right: "20px",
        backgroundColor: "rgba(20, 20, 20, 0.9)",
        color: "#00ff00",
        padding: "10px 14px",
        borderRadius: "6px",
        fontFamily: "monospace",
        fontSize: "12px",
        lineHeight: "1.5",
        border: "1px solid rgba(0, 255, 0, 0.2)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
        zIndex: 100,
        minWidth: "200px",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          marginBottom: "8px",
          fontWeight: "bold",
          color: "#00ff88",
          borderBottom: "1px solid rgba(0, 255, 0, 0.2)",
          paddingBottom: "4px",
        }}
      >
        Drone Position
      </div>
      <div>X: {position.x.toFixed(2)} m</div>
      <div>Y: {position.y.toFixed(2)} m</div>
      <div>Z: {position.z.toFixed(2)} m</div>
      <div style={{ marginTop: "8px", fontSize: "11px", color: "#888" }}>
        Speed: {velocity.length().toFixed(2)} m/s
      </div>
    </div>
  );
}
