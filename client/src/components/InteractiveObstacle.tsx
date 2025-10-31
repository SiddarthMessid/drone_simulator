import { useRef, useState } from "react";
import * as THREE from "three";
import TransformGizmo from "./TransformGizmo";
import { Obstacle } from "../lib/stores/useEnvironment";

type TransformMode = "translate" | "rotate" | null;
type Axis = "x" | "y" | "z";

interface InteractiveObstacleProps {
  obstacle: Obstacle;
  isSelected: boolean;
  onSelect: () => void;
  onTransform: (position: THREE.Vector3, rotation: THREE.Euler) => void;
  transformMode: TransformMode;
  enabledAxes: Set<Axis>;
}

export default function InteractiveObstacle({
  obstacle,
  isSelected,
  onSelect,
  onTransform,
  transformMode,
  enabledAxes,
}: InteractiveObstacleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const position = new THREE.Vector3(
    obstacle.position.x,
    obstacle.position.y,
    obstacle.position.z
  );

  const rotation = new THREE.Euler(
    obstacle.rotation?.x || 0,
    obstacle.rotation?.y || 0,
    obstacle.rotation?.z || 0
  );

  return (
    <group>
      {/* Main Obstacle Mesh */}
      <mesh
        ref={meshRef}
        position={position}
        rotation={rotation}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <boxGeometry
          args={[obstacle.size.x, obstacle.size.y, obstacle.size.z]}
        />
        <meshPhongMaterial
          color={obstacle.color}
          transparent
          opacity={isSelected ? 0.8 : 1}
        />
      </mesh>

      {/* Wireframe Box for Selected Object */}
      {isSelected && (
        <lineSegments position={position} rotation={rotation}>
          <edgesGeometry
            args={[
              new THREE.BoxGeometry(
                obstacle.size.x,
                obstacle.size.y,
                obstacle.size.z
              ),
            ]}
          />
          <lineBasicMaterial color={0xffff00} linewidth={2} />
        </lineSegments>
      )}

      {/* Hover Highlight */}
      {hovered && !isSelected && (
        <lineSegments position={position} rotation={rotation}>
          <edgesGeometry
            args={[
              new THREE.BoxGeometry(
                obstacle.size.x,
                obstacle.size.y,
                obstacle.size.z
              ),
            ]}
          />
          <lineBasicMaterial color={0xffffff} linewidth={1} />
        </lineSegments>
      )}

      {/* Transform Gizmo */}
      {isSelected && transformMode && (
        <TransformGizmo
          position={position}
          rotation={rotation}
          onTransform={onTransform}
          mode={transformMode}
          enabledAxes={enabledAxes}
        />
      )}
    </group>
  );
}
