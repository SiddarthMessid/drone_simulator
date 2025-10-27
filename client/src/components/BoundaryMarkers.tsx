import * as THREE from 'three';

interface BoundaryMarkersProps {
  environmentSize: {
    width: number;
    height: number;
  };
}

export default function BoundaryMarkers({ environmentSize }: BoundaryMarkersProps) {
  const halfWidth = environmentSize.width / 2;
  const halfHeight = environmentSize.height / 2;
  const postHeight = 2;
  const spacing = 10;

  const posts = [];
  
  // Generate boundary posts
  for (let x = -halfWidth; x <= halfWidth; x += spacing) {
    posts.push(
      <mesh key={`north-${x}`} position={[x, postHeight/2, -halfHeight]} castShadow>
        <boxGeometry args={[0.2, postHeight, 0.2]} />
        <meshPhongMaterial color="#ff0000" />
      </mesh>,
      <mesh key={`south-${x}`} position={[x, postHeight/2, halfHeight]} castShadow>
        <boxGeometry args={[0.2, postHeight, 0.2]} />
        <meshPhongMaterial color="#ff0000" />
      </mesh>
    );
  }

  for (let z = -halfHeight; z <= halfHeight; z += spacing) {
    posts.push(
      <mesh key={`west-${z}`} position={[-halfWidth, postHeight/2, z]} castShadow>
        <boxGeometry args={[0.2, postHeight, 0.2]} />
        <meshPhongMaterial color="#ff0000" />
      </mesh>,
      <mesh key={`east-${z}`} position={[halfWidth, postHeight/2, z]} castShadow>
        <boxGeometry args={[0.2, postHeight, 0.2]} />
        <meshPhongMaterial color="#ff0000" />
      </mesh>
    );
  }

  return <>{posts}</>;
}