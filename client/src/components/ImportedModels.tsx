import { useGLTF } from '@react-three/drei';
import { useModelStore } from './ModelUploader';
import * as THREE from 'three';

export default function ImportedModels() {
  const { models } = useModelStore();

  return (
    <>
      {models.map((model) => {
        const { scene } = useGLTF(model.url);
        
        return (
          <primitive
            key={model.id}
            object={scene.clone()}
            position={model.position}
            scale={model.scale}
            rotation={model.rotation}
          />
        );
      })}
    </>
  );
}