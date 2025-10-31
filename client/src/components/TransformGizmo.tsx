import { useRef, useState, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type TransformMode = "translate" | "rotate" | null;
type Axis = "x" | "y" | "z";

interface TransformGizmoProps {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  onTransform: (position: THREE.Vector3, rotation: THREE.Euler) => void;
  mode: TransformMode;
  enabledAxes: Set<Axis>;
}

export default function TransformGizmo({
  position,
  rotation,
  onTransform,
  mode,
  enabledAxes,
}: TransformGizmoProps) {
  const { camera, gl, raycaster, pointer } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeAxis, setActiveAxis] = useState<Axis | null>(null);
  const [dragStart, setDragStart] = useState<THREE.Vector3 | null>(null);
  const [initialPosition, setInitialPosition] = useState<THREE.Vector3>(
    position.clone()
  );
  const [initialRotation, setInitialRotation] = useState<THREE.Euler>(
    rotation.clone()
  );

  const planeRef = useRef<THREE.Plane>(new THREE.Plane());
  const intersectionPoint = useRef<THREE.Vector3>(new THREE.Vector3());

  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(position);
    groupRef.current.rotation.copy(rotation);
  }, [position, rotation]);

  const handlePointerDown = (axis: Axis) => (e: any) => {
    if (!enabledAxes.has(axis)) return;
    e.stopPropagation();
    setIsDragging(true);
    setActiveAxis(axis);
    setInitialPosition(position.clone());
    setInitialRotation(rotation.clone());

    // Setup drag plane based on axis and mode
    const normal = new THREE.Vector3();

    if (mode === "translate") {
      if (enabledAxes.size === 1) {
        // Single axis - plane perpendicular to camera
        const axisVector = new THREE.Vector3();
        if (axis === "x") axisVector.set(1, 0, 0);
        if (axis === "y") axisVector.set(0, 1, 0);
        if (axis === "z") axisVector.set(0, 0, 1);

        const cameraDir = new THREE.Vector3();
        camera.getWorldDirection(cameraDir);
        normal.crossVectors(axisVector, cameraDir).normalize();
        if (normal.length() < 0.1) {
          normal.copy(cameraDir).cross(new THREE.Vector3(0, 1, 0)).normalize();
        }
      } else {
        // Two axes - plane defined by those axes
        if (enabledAxes.has("x") && enabledAxes.has("y")) normal.set(0, 0, 1);
        else if (enabledAxes.has("x") && enabledAxes.has("z"))
          normal.set(0, 1, 0);
        else if (enabledAxes.has("y") && enabledAxes.has("z"))
          normal.set(1, 0, 0);
      }
    } else if (mode === "rotate") {
      // For rotation, plane perpendicular to rotation axis
      if (axis === "x") normal.set(1, 0, 0);
      if (axis === "y") normal.set(0, 1, 0);
      if (axis === "z") normal.set(0, 0, 1);
    }

    planeRef.current.setFromNormalAndCoplanarPoint(normal, position);

    // Get initial intersection point
    raycaster.setFromCamera(pointer, camera);
    const intersected = raycaster.ray.intersectPlane(
      planeRef.current,
      intersectionPoint.current
    );
    if (intersected) {
      setDragStart(intersectionPoint.current.clone());
    }
  };

  const handlePointerMove = () => {
    if (!isDragging || !activeAxis || !dragStart) return;

    raycaster.setFromCamera(pointer, camera);
    const newPoint = new THREE.Vector3();
    const intersected = raycaster.ray.intersectPlane(
      planeRef.current,
      newPoint
    );

    if (!intersected) return;

    if (mode === "translate") {
      const delta = newPoint.clone().sub(dragStart);
      const newPosition = initialPosition.clone();

      if (enabledAxes.size === 1) {
        // Single axis translation
        const axisVector = new THREE.Vector3();
        if (activeAxis === "x") axisVector.set(1, 0, 0);
        if (activeAxis === "y") axisVector.set(0, 1, 0);
        if (activeAxis === "z") axisVector.set(0, 0, 1);

        const projection = delta.dot(axisVector);
        newPosition.add(axisVector.multiplyScalar(projection));
      } else {
        // Two axes translation
        if (enabledAxes.has("x")) newPosition.x += delta.x;
        if (enabledAxes.has("y")) newPosition.y += delta.y;
        if (enabledAxes.has("z")) newPosition.z += delta.z;
      }

      onTransform(newPosition, rotation);
    } else if (mode === "rotate") {
      // Rotation around single axis
      const center = initialPosition;
      const startVec = dragStart.clone().sub(center);
      const currentVec = newPoint.clone().sub(center);

      // Project vectors onto the rotation plane
      const axisVector = new THREE.Vector3();
      if (activeAxis === "x") axisVector.set(1, 0, 0);
      if (activeAxis === "y") axisVector.set(0, 1, 0);
      if (activeAxis === "z") axisVector.set(0, 0, 1);

      // Remove component along axis to get planar vectors
      const startPlanar = startVec
        .clone()
        .sub(axisVector.clone().multiplyScalar(startVec.dot(axisVector)));
      const currentPlanar = currentVec
        .clone()
        .sub(axisVector.clone().multiplyScalar(currentVec.dot(axisVector)));

      if (startPlanar.length() < 0.01 || currentPlanar.length() < 0.01) return;

      startPlanar.normalize();
      currentPlanar.normalize();

      // Calculate signed angle
      const cross = startPlanar.clone().cross(currentPlanar);
      const dot = startPlanar.dot(currentPlanar);
      let angle = Math.atan2(cross.length(), dot);

      // Determine sign based on axis direction
      if (cross.dot(axisVector) < 0) {
        angle = -angle;
      }

      const newRotation = initialRotation.clone();
      if (activeAxis === "x") newRotation.x += angle;
      if (activeAxis === "y") newRotation.y += angle;
      if (activeAxis === "z") newRotation.z += angle;

      console.log("Rotating:", {
        axis: activeAxis,
        angle: (angle * 180) / Math.PI,
        newRotation: {
          x: (newRotation.x * 180) / Math.PI,
          y: (newRotation.y * 180) / Math.PI,
          z: (newRotation.z * 180) / Math.PI,
        },
      });

      onTransform(position, newRotation);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setActiveAxis(null);
    setDragStart(null);
  };

  useEffect(() => {
    if (isDragging) {
      gl.domElement.addEventListener("pointermove", handlePointerMove);
      gl.domElement.addEventListener("pointerup", handlePointerUp);
      return () => {
        gl.domElement.removeEventListener("pointermove", handlePointerMove);
        gl.domElement.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [isDragging, activeAxis, dragStart]);

  if (!mode) return null;

  const gizmoSize = 1.5;
  const arrowLength = 2;

  return (
    <group ref={groupRef} renderOrder={999}>
      {mode === "translate" && (
        <>
          {/* X Axis - Red */}
          {enabledAxes.has("x") && (
            <group onPointerDown={handlePointerDown("x")}>
              <arrowHelper
                args={[
                  new THREE.Vector3(1, 0, 0),
                  new THREE.Vector3(0, 0, 0),
                  arrowLength,
                  activeAxis === "x" ? 0xffff00 : 0xff0000,
                  0.3,
                  0.2,
                ]}
              />
              <mesh position={[arrowLength / 2, 0, 0]}>
                <cylinderGeometry args={[0.05, 0.05, arrowLength, 8]} />
                <meshBasicMaterial
                  color={activeAxis === "x" ? 0xffff00 : 0xff0000}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            </group>
          )}

          {/* Y Axis - Green */}
          {enabledAxes.has("y") && (
            <group onPointerDown={handlePointerDown("y")}>
              <arrowHelper
                args={[
                  new THREE.Vector3(0, 1, 0),
                  new THREE.Vector3(0, 0, 0),
                  arrowLength,
                  activeAxis === "y" ? 0xffff00 : 0x00ff00,
                  0.3,
                  0.2,
                ]}
              />
              <mesh position={[0, arrowLength / 2, 0]}>
                <cylinderGeometry args={[0.05, 0.05, arrowLength, 8]} />
                <meshBasicMaterial
                  color={activeAxis === "y" ? 0xffff00 : 0x00ff00}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            </group>
          )}

          {/* Z Axis - Blue */}
          {enabledAxes.has("z") && (
            <group onPointerDown={handlePointerDown("z")}>
              <arrowHelper
                args={[
                  new THREE.Vector3(0, 0, 1),
                  new THREE.Vector3(0, 0, 0),
                  arrowLength,
                  activeAxis === "z" ? 0xffff00 : 0x0000ff,
                  0.3,
                  0.2,
                ]}
              />
              <mesh position={[0, 0, arrowLength / 2]}>
                <cylinderGeometry args={[0.05, 0.05, arrowLength, 8]} />
                <meshBasicMaterial
                  color={activeAxis === "z" ? 0xffff00 : 0x0000ff}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            </group>
          )}
        </>
      )}

      {mode === "rotate" && (
        <>
          {/* X Rotation - Red Circle */}
          {enabledAxes.has("x") && (
            <group rotation={[0, 0, Math.PI / 2]}>
              <mesh onPointerDown={handlePointerDown("x")}>
                <torusGeometry args={[gizmoSize, 0.1, 16, 64]} />
                <meshBasicMaterial
                  color={activeAxis === "x" ? 0xffff00 : 0xff0000}
                  transparent
                  opacity={0.8}
                  depthTest={false}
                />
              </mesh>
            </group>
          )}

          {/* Y Rotation - Green Circle */}
          {enabledAxes.has("y") && (
            <group>
              <mesh onPointerDown={handlePointerDown("y")}>
                <torusGeometry args={[gizmoSize, 0.1, 16, 64]} />
                <meshBasicMaterial
                  color={activeAxis === "y" ? 0xffff00 : 0x00ff00}
                  transparent
                  opacity={0.8}
                  depthTest={false}
                />
              </mesh>
            </group>
          )}

          {/* Z Rotation - Blue Circle */}
          {enabledAxes.has("z") && (
            <group rotation={[Math.PI / 2, 0, 0]}>
              <mesh onPointerDown={handlePointerDown("z")}>
                <torusGeometry args={[gizmoSize, 0.1, 16, 64]} />
                <meshBasicMaterial
                  color={activeAxis === "z" ? 0xffff00 : 0x0000ff}
                  transparent
                  opacity={0.8}
                  depthTest={false}
                />
              </mesh>
            </group>
          )}
        </>
      )}

      {/* Center sphere */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
