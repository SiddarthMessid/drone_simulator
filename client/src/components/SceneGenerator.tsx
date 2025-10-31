import TerrainEditor from "./TerrainEditor";

export default function SceneGenerator() {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TerrainEditor />
    </div>
  );
}
