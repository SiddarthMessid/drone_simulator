import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useDrone } from "../lib/stores/useDrone";
import { droneModelConfig } from "../lib/droneModelConfig";
import { GLTF } from "three-stdlib";

interface DroneModelGLTFProps {
  modelPath?: string;
  scale?: number;
  showCollisionBox?: boolean;
}

type GLTFResult = GLTF & {
  nodes: Record<string, THREE.Mesh>;
  materials: Record<string, THREE.Material>;
};

export default function DroneModelGLTF({
  modelPath = "/models/drone/drone_gltf.glb",
  scale = 1,
  showCollisionBox = false,
}: DroneModelGLTFProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { telemetry } = useDrone();
  const [propellerRefs, setPropellerRefs] = useState<THREE.Object3D[]>([]);

  // Load GLTF/GLB model - useGLTF handles textures automatically
  const { scene } = useGLTF(modelPath);
  console.log("🚁 Model loaded successfully from:", modelPath);

  // Clone the scene to avoid sharing references between instances
  const clonedScene = scene.clone(true);

  useEffect(() => {
    if (!clonedScene) return;

    // Find propeller/rotor meshes in the model
    const propellers: THREE.Object3D[] = [];
    const allObjects: string[] = [];

    clonedScene.traverse((child) => {
      const name = child.name.toLowerCase();
      allObjects.push(child.name);

      // More specific matching - only look for actual propeller/blade keywords
      // Exclude generic cylinders that are part of the body
      const isPropellerKeyword =
        name.includes("propeller") ||
        name.includes("rotor") ||
        name.includes("blade") ||
        name.includes("prop_") ||
        name.includes("fan") ||
        name.includes("helix") ||
        name.includes("spinner");

      // Avoid false positives from body parts
      const isNotBodyPart =
        !name.includes("motor") &&
        !name.includes("leg") &&
        !name.includes("body") &&
        !name.includes("battery") &&
        !name.includes("coil") &&
        !name.includes("band") &&
        !name.includes("latch") &&
        !name.includes("pad") &&
        !name.includes("wire") &&
        !name.includes("base") &&
        !name.includes("inner") &&
        !name.includes("top");

      if (isPropellerKeyword && isNotBodyPart) {
        propellers.push(child);
        console.log("✓ Found propeller:", child.name, "Type:", child.type);
      }
    });

    console.log("=== GLTF Model Analysis ===");
    console.log("Total objects in model:", allObjects.length);
    console.log(`Found ${propellers.length} propellers`);

    // If no propellers found, show some object names to help debug
    if (propellers.length === 0) {
      console.log("⚠️ No propellers detected! Here are some object names:");
      console.log(allObjects.slice(0, 50).join(", "));
    }
    console.log("===========================");

    setPropellerRefs(propellers);
  }, [clonedScene]);

  // Animate propellers based on throttle
  useFrame((state, delta) => {
    if (propellerRefs.length === 0) return;

    // Calculate rotor speed based on throttle
    const minRotorSpeed = 15;
    const maxRotorSpeed = 60;
    const targetSpeed =
      minRotorSpeed +
      (Math.abs(telemetry.throttle) + 0.5) * (maxRotorSpeed - minRotorSpeed);

    propellerRefs.forEach((propeller, index) => {
      if (propeller) {
        // Alternate rotation direction for realistic physics
        const direction = index % 2 === 0 ? 1 : -1;
        const rotationSpeed = direction * targetSpeed * delta;

        // Try rotating on Y axis (most common for drones)
        // If your propellers don't spin, try changing this to .x or .z
        propeller.rotation.y += rotationSpeed;

        // Uncomment one of these if Y-axis doesn't work:
        // propeller.rotation.x += rotationSpeed;
        // propeller.rotation.z += rotationSpeed;
      }
    });
  });

  // Apply scale to the cloned scene
  useEffect(() => {
    if (clonedScene) {
      clonedScene.scale.set(scale, scale, scale);
      console.log("🚁 GLTF Model loaded with scale:", scale);
      console.log("🚁 Model position:", clonedScene.position);
      console.log("🚁 Model visible:", clonedScene.visible);

      let meshCount = 0;
      let skinnedMeshCount = 0;

      // Make sure all children are visible and have proper materials
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
          child.visible = true;
          child.castShadow = true;
          child.receiveShadow = true;
          child.frustumCulled = false; // Prevent culling issues

          if (child instanceof THREE.SkinnedMesh) {
            skinnedMeshCount++;
          } else {
            meshCount++;
          }

          // Fix materials - ensure they're visible
          if (child.material) {
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];
            materials.forEach((mat, idx) => {
              if (
                mat instanceof THREE.MeshStandardMaterial ||
                mat instanceof THREE.MeshPhysicalMaterial
              ) {
                mat.side = THREE.DoubleSide; // Render both sides
                mat.transparent = false;
                mat.opacity = 1;

                // Force visible colors for all materials without textures
                if (!mat.map) {
                  // Check if it's a propeller part
                  const childName = child.name.toLowerCase();
                  if (
                    childName.includes("prop_") &&
                    !childName.includes("motor") &&
                    !childName.includes("bolt")
                  ) {
                    mat.color.setHex(0xff3333); // Red for propellers
                  } else if (childName.includes("motor")) {
                    mat.color.setHex(0x1a1a1a); // Very dark for motors
                  } else if (childName.includes("leg")) {
                    mat.color.setHex(0x333333); // Dark gray for legs
                  } else {
                    mat.color.setHex(0x2a2a2a); // Dark gray for body
                  }
                  mat.metalness = 0.7;
                  mat.roughness = 0.3;
                  mat.emissive.setHex(0x111111); // Slight glow to make it more visible
                }

                mat.needsUpdate = true;
              }
            });
          }
        }
      });

      console.log(
        `🚁 Found ${meshCount} meshes and ${skinnedMeshCount} skinned meshes`
      );
    }
  }, [clonedScene, scale]);

  return (
    <group ref={groupRef}>
      {/* GLTF Model */}
      <primitive object={clonedScene} castShadow receiveShadow />

      {/* Collision Box Visualizer (for debugging) */}
      {showCollisionBox && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.0, 1.0, 2.0]} />
          <meshBasicMaterial
            color="#00ff00"
            wireframe={true}
            transparent={true}
            opacity={0.5}
          />
        </mesh>
      )}
    </group>
  );
}

// Preload the model (will be updated based on config)
useGLTF.preload("/models/drone/drone_gltf.glb");
