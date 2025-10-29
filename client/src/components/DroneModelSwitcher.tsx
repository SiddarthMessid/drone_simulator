import DroneModel from "./DroneModel";
import DroneModelGLTF from "./DroneModelGLTF";
import { droneModelConfig } from "../lib/droneModelConfig";

interface DroneModelSwitcherProps {
  color?: string;
  showCollisionBox?: boolean;
}

/**
 * Wrapper component that switches between procedural and GLTF drone models
 * based on the configuration in droneModelConfig.ts
 */
export default function DroneModelSwitcher({
  color = "#2a2a2a",
  showCollisionBox = false,
}: DroneModelSwitcherProps) {
  if (droneModelConfig.type === "gltf") {
    return (
      <DroneModelGLTF
        modelPath={droneModelConfig.gltfPath}
        scale={droneModelConfig.scale}
        showCollisionBox={showCollisionBox}
      />
    );
  }

  // Default to procedural model
  return <DroneModel color={color} />;
}
