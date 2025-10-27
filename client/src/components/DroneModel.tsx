import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDrone } from "../lib/stores/useDrone";

interface DroneModelProps {
  color?: string;
}

export default function DroneModel({ color = "#2a2a2a" }: DroneModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const rotorRefs = useRef<THREE.Mesh[]>([]);
  const { telemetry } = useDrone();

  // Create rotor rotation based on throttle
  useFrame((state, delta) => {
    if (rotorRefs.current) {
      // Ensure minimum rotor speed and smooth acceleration/deceleration
      const minRotorSpeed = 15; // Minimum rotation speed
      const maxRotorSpeed = 60; // Maximum rotation speed
      const targetSpeed = minRotorSpeed + (Math.abs(telemetry.throttle) + 0.5) * (maxRotorSpeed - minRotorSpeed);
      
      rotorRefs.current.forEach((rotor, index) => {
        if (rotor) {
          // Alternate rotation direction for realistic physics
          const direction = index % 2 === 0 ? 1 : -1;
          rotor.rotation.y += direction * targetSpeed * delta;
        }
      });
    }
  });

  useEffect(() => {
    // Initialize rotor refs array
    rotorRefs.current = [];
  }, []);

  return (
    <group ref={groupRef}>
      {/* Main Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2, 0.3, 2]} />
        <meshPhongMaterial color={color} />
      </mesh>

      {/* Center Hub */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 8]} />
        <meshPhongMaterial color="#444444" />
      </mesh>

      {/* Arms */}
      {[
        { pos: new THREE.Vector3(1.2, 0, 0), rot: new THREE.Euler(0, 0, 0) },      // Right arm
        { pos: new THREE.Vector3(-1.2, 0, 0), rot: new THREE.Euler(0, 0, 0) },     // Left arm  
        { pos: new THREE.Vector3(0, 0, 1.2), rot: new THREE.Euler(0, Math.PI/2, 0) }, // Front arm
        { pos: new THREE.Vector3(0, 0, -1.2), rot: new THREE.Euler(0, Math.PI/2, 0) } // Back arm
      ].map((arm, index) => (
        <mesh 
          key={index}
          position={arm.pos}
          rotation={arm.rot}
          castShadow
        >
          <cylinderGeometry args={[0.08, 0.08, 1.8, 8]} />
          <meshPhongMaterial color="#333333" />
        </mesh>
      ))}

      {/* Motors and Rotors */}
      {[
        new THREE.Vector3(1.8, 0.15, 1.8),   // Front right
        new THREE.Vector3(-1.8, 0.15, 1.8),  // Front left
        new THREE.Vector3(-1.8, 0.15, -1.8), // Back left
        new THREE.Vector3(1.8, 0.15, -1.8)   // Back right
      ].map((pos, index) => (
        <group key={index} position={pos}>
          {/* Motor */}
          <mesh castShadow>
            <cylinderGeometry args={[0.15, 0.15, 0.3, 8]} />
            <meshPhongMaterial color="#1a1a1a" />
          </mesh>
          
          {/* Rotor */}
          <mesh 
            ref={(el) => {
              if (el) rotorRefs.current[index] = el;
            }}
            position={[0, 0.2, 0]}
            castShadow
          >
            <group>
              {/* Rotor Blades */}
              <mesh rotation={[0, 0, 0]}>
                <boxGeometry args={[1.2, 0.02, 0.1]} />
                <meshPhongMaterial color="#666666" />
              </mesh>
              <mesh rotation={[0, Math.PI/2, 0]}>
                <boxGeometry args={[1.2, 0.02, 0.1]} />
                <meshPhongMaterial color="#666666" />
              </mesh>
              
              {/* Rotor Hub */}
              <mesh>
                <cylinderGeometry args={[0.05, 0.05, 0.08, 8]} />
                <meshPhongMaterial color="#222222" />
              </mesh>
            </group>
          </mesh>
        </group>
      ))}

      {/* Landing Gear */}
      {[
        new THREE.Vector3(0.8, -0.4, 0.8),
        new THREE.Vector3(-0.8, -0.4, 0.8),
        new THREE.Vector3(-0.8, -0.4, -0.8),
        new THREE.Vector3(0.8, -0.4, -0.8)
      ].map((pos, index) => (
        <mesh key={index} position={pos} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
          <meshPhongMaterial color="#555555" />
        </mesh>
      ))}

      {/* LED Indicators */}
      <mesh position={[0, 0.35, 1]} castShadow>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshPhongMaterial color="#00ff00" emissive="#004400" />
      </mesh>
      <mesh position={[0, 0.35, -1]} castShadow>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshPhongMaterial color="#ff0000" emissive="#440000" />
      </mesh>
    </group>
  );
}
