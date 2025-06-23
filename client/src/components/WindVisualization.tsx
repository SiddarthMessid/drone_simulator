import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWind } from "../lib/stores/useWind";

export default function WindVisualization() {
  const { windSources } = useWind();
  const groupRef = useRef<THREE.Group>(null);

  // Create wind zone visualizations
  const windZones = useMemo(() => {
    return windSources.map(source => ({
      ...source,
      particles: Array.from({ length: 20 }, (_, i) => ({
        id: i,
        position: new THREE.Vector3(
          source.position.x + (Math.random() - 0.5) * source.radius,
          source.position.y + (Math.random() - 0.5) * source.radius * 0.5,
          source.position.z + (Math.random() - 0.5) * source.radius
        ),
        velocity: new THREE.Vector3(
          Math.cos(source.direction) * 0.1,
          0,
          Math.sin(source.direction) * 0.1
        ),
        life: Math.random()
      }))
    }));
  }, [windSources]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Animate wind particles
    windZones.forEach((zone, zoneIndex) => {
      if (!zone.enabled) return;

      zone.particles.forEach((particle, particleIndex) => {
        // Update particle position
        particle.position.add(
          particle.velocity.clone().multiplyScalar(zone.force * delta)
        );
        
        // Reset particle if it goes too far
        const distance = particle.position.distanceTo(
          new THREE.Vector3(zone.position.x, zone.position.y, zone.position.z)
        );
        
        if (distance > zone.radius) {
          particle.position.set(
            zone.position.x + (Math.random() - 0.5) * zone.radius * 0.5,
            zone.position.y + (Math.random() - 0.5) * zone.radius * 0.25,
            zone.position.z + (Math.random() - 0.5) * zone.radius * 0.5
          );
        }

        // Update particle life for opacity animation
        particle.life += delta * 0.5;
        if (particle.life > 1) particle.life = 0;
      });
    });
  });

  return (
    <group ref={groupRef}>
      {windZones.map((zone) => (
        <group key={zone.id} visible={zone.enabled}>
          {/* Wind zone boundary */}
          <mesh position={[zone.position.x, zone.position.y, zone.position.z]}>
            <cylinderGeometry args={[zone.radius, zone.radius, zone.radius * 0.5, 16]} />
            <meshBasicMaterial 
              color={zone.enabled ? "#00ff0020" : "#66666620"} 
              transparent 
              opacity={0.1}
              wireframe
            />
          </mesh>

          {/* Wind direction arrow */}
          <arrowHelper
            args={[
              new THREE.Vector3(Math.cos(zone.direction), 0, Math.sin(zone.direction)),
              new THREE.Vector3(zone.position.x, zone.position.y + zone.radius * 0.3, zone.position.z),
              zone.force * 2,
              zone.enabled ? 0x00ff00 : 0x666666,
              zone.force * 0.5,
              zone.force * 0.3
            ]}
          />

          {/* Wind particles */}
          {zone.particles.map((particle, index) => (
            <mesh key={index} position={particle.position}>
              <sphereGeometry args={[0.1, 4, 4]} />
              <meshBasicMaterial 
                color={zone.enabled ? "#00ff00" : "#666666"}
                transparent
                opacity={Math.sin(particle.life * Math.PI) * 0.7}
              />
            </mesh>
          ))}

          {/* Wind zone label */}
          <mesh position={[zone.position.x, zone.position.y + zone.radius * 0.6, zone.position.z]}>
            <planeGeometry args={[4, 1]} />
            <meshBasicMaterial 
              color="#000000" 
              transparent 
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Zone info display */}
          <group position={[zone.position.x, zone.position.y + zone.radius * 0.8, zone.position.z]}>
            <mesh>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              <meshBasicMaterial color={zone.enabled ? "#00ff00" : "#ff0000"} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}