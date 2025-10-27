import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { Card } from './ui/card';
import * as THREE from 'three';
import { create } from 'zustand';

interface ImportedModel {
  id: string;
  name: string;
  file: File;
  url: string;
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}

interface ModelStore {
  models: ImportedModel[];
  addModel: (model: ImportedModel) => void;
  removeModel: (id: string) => void;
  updateModel: (id: string, updates: Partial<ImportedModel>) => void;
}

export const useModelStore = create<ModelStore>((set) => ({
  models: [],
  addModel: (model) =>
    set((state) => ({ models: [...state.models, model] })),
  removeModel: (id) =>
    set((state) => ({ models: state.models.filter((m) => m.id !== id) })),
  updateModel: (id, updates) =>
    set((state) => ({
      models: state.models.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
}));

export default function ModelUploader() {
  const { models, addModel, removeModel, updateModel } = useModelStore();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      if (file.name.toLowerCase().endsWith('.gltf')) {
        const url = URL.createObjectURL(file);
        const newModel: ImportedModel = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name.replace('.gltf', ''),
          file,
          url,
          position: [0, 0, 0],
          scale: [1, 1, 1],
          rotation: [0, 0, 0],
        };
        addModel(newModel);
      }
    });
  }, [addModel]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'model/gltf+json': ['.gltf'] },
  });

  const handleNameChange = (id: string, newName: string) => {
    updateModel(id, { name: newName });
  };

  const handlePositionChange = (id: string, axis: 0 | 1 | 2, value: number) => {
    const model = models.find(m => m.id === id);
    if (model) {
      const newPosition = [...model.position] as [number, number, number];
      newPosition[axis] = value;
      updateModel(id, { position: newPosition });
    }
  };

  const handleScaleChange = (id: string, axis: 0 | 1 | 2, value: number) => {
    const model = models.find(m => m.id === id);
    if (model) {
      const newScale = [...model.scale] as [number, number, number];
      newScale[axis] = value;
      updateModel(id, { scale: newScale });
    }
  };

  return (
    <div className="fixed right-4 top-4 w-80 bg-gray-900 p-4 rounded-lg shadow-lg text-white">
      <h2 className="text-lg font-bold mb-4">Model Manager</h2>
      
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed border-gray-600 p-4 rounded-lg mb-4 cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the GLTF files here...</p>
        ) : (
          <p>Drag & drop GLTF files here, or click to select files</p>
        )}
      </div>

      {/* Model List */}
      <div className="space-y-4">
        {models.map((model) => (
          <Card key={model.id} className="p-4 bg-gray-800">
            <div className="flex justify-between items-center mb-2">
              <Input
                value={model.name}
                onChange={(e) => handleNameChange(model.id, e.target.value)}
                className="w-40 bg-gray-700"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeModel(model.id)}
              >
                Remove
              </Button>
            </div>

            {/* Position Controls */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Position</p>
              <div className="grid grid-cols-3 gap-2">
                {['X', 'Y', 'Z'].map((axis, i) => (
                  <div key={`pos-${axis}`}>
                    <label className="text-xs">{axis}</label>
                    <Slider
                      value={[model.position[i]]}
                      onValueChange={(value) => handlePositionChange(model.id, i as 0 | 1 | 2, value[0])}
                      min={-10}
                      max={10}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Scale Controls */}
            <div className="space-y-2 mt-4">
              <p className="text-sm font-medium">Scale</p>
              <div className="grid grid-cols-3 gap-2">
                {['X', 'Y', 'Z'].map((axis, i) => (
                  <div key={`scale-${axis}`}>
                    <label className="text-xs">{axis}</label>
                    <Slider
                      value={[model.scale[i]]}
                      onValueChange={(value) => handleScaleChange(model.id, i as 0 | 1 | 2, value[0])}
                      min={0.1}
                      max={5}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
