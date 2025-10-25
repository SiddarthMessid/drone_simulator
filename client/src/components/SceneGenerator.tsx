import { useState } from "react";
import { SCENE_TEMPLATES, SceneType, SceneSettings } from "../lib/sceneTemplates";
import { generateScene } from "../lib/sceneGenerator";
import { useEnvironment } from "../lib/stores/useEnvironment";
import { Button } from "./ui/button";
import { Sparkles, Trash2, RefreshCw } from "lucide-react";

export default function SceneGenerator() {
  const { setEnvironmentSize, obstacles } = useEnvironment();
  
  const [selectedScene, setSelectedScene] = useState<SceneType>('park');
  const [settings, setSettings] = useState<SceneSettings>({
    density: 0.5,
    sizeVariation: 0.3,
    complexity: 0.5,
    seed: Math.floor(Math.random() * 100000)
  });
  
  const [isGenerating, setIsGenerating] = useState(false);

  const sceneTypes: SceneType[] = ['park', 'disaster', 'building_interior', 'urban', 'forest', 'warehouse'];

  const handleGenerate = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const generated = generateScene(selectedScene, settings);
      
      const { obstacles: generatedObstacles, setGroundTexture, setSkyColor } = useEnvironment.getState();
      generatedObstacles.forEach((obstacle: any) => {
        useEnvironment.getState().removeObstacle(obstacle.id);
      });
      
      generated.obstacles.forEach((obstacle) => {
        useEnvironment.getState().addObstacle(obstacle);
      });
      
      setEnvironmentSize(generated.environmentSize);
      setGroundTexture(generated.groundTexture);
      setSkyColor(generated.skyColor);
      
      setIsGenerating(false);
    }, 100);
  };

  const handleClearScene = () => {
    const { obstacles: currentObstacles } = useEnvironment.getState();
    currentObstacles.forEach((obstacle: any) => {
      useEnvironment.getState().removeObstacle(obstacle.id);
    });
  };

  const handleRandomSeed = () => {
    setSettings({
      ...settings,
      seed: Math.floor(Math.random() * 100000)
    });
  };

  const containerStyle = {
    padding: '20px',
    color: '#e5e5e5',
    height: '100%',
    overflowY: 'auto' as const,
    background: 'rgba(10, 10, 10, 0.95)'
  };

  const sectionStyle = {
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '13px',
    fontWeight: '500' as const,
    color: '#a0a0a0'
  };

  const selectStyle = {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    color: '#e5e5e5',
    fontSize: '14px',
    cursor: 'pointer'
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    color: '#e5e5e5',
    fontSize: '13px'
  };

  const sliderContainerStyle = {
    marginBottom: '16px'
  };

  const sliderInfoStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  };

  const sliderStyle = {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: 'rgba(255, 255, 255, 0.1)',
    outline: 'none',
    cursor: 'pointer'
  };

  const selectedTemplate = SCENE_TEMPLATES[selectedScene];

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '18px', 
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Sparkles size={20} color="#3b82f6" />
          Scene Generator
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: '12px', 
          color: '#888',
          lineHeight: '1.4'
        }}>
          Procedurally generate complete environments for your drone simulator
        </p>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Scene Type</label>
        <select
          value={selectedScene}
          onChange={(e) => setSelectedScene(e.target.value as SceneType)}
          style={selectStyle}
        >
          {sceneTypes.map((type) => (
            <option key={type} value={type}>
              {SCENE_TEMPLATES[type].name}
            </option>
          ))}
        </select>
        
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#a0c4ff',
          lineHeight: '1.5'
        }}>
          {selectedTemplate.description}
        </div>
      </div>

      <div style={sectionStyle}>
        <h4 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '14px', 
          fontWeight: '600',
          color: '#c0c0c0'
        }}>
          Generation Settings
        </h4>

        <div style={sliderContainerStyle}>
          <div style={sliderInfoStyle}>
            <label style={labelStyle}>Density</label>
            <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>
              {Math.round(settings.density * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.density}
            onChange={(e) => setSettings({ ...settings, density: parseFloat(e.target.value) })}
            style={sliderStyle}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '10px', 
            color: '#666',
            marginTop: '4px'
          }}>
            <span>Sparse</span>
            <span>Dense</span>
          </div>
        </div>

        <div style={sliderContainerStyle}>
          <div style={sliderInfoStyle}>
            <label style={labelStyle}>Size Variation</label>
            <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>
              {Math.round(settings.sizeVariation * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.sizeVariation}
            onChange={(e) => setSettings({ ...settings, sizeVariation: parseFloat(e.target.value) })}
            style={sliderStyle}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '10px', 
            color: '#666',
            marginTop: '4px'
          }}>
            <span>Uniform</span>
            <span>Varied</span>
          </div>
        </div>

        <div style={sliderContainerStyle}>
          <div style={sliderInfoStyle}>
            <label style={labelStyle}>Complexity</label>
            <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>
              {Math.round(settings.complexity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.complexity}
            onChange={(e) => setSettings({ ...settings, complexity: parseFloat(e.target.value) })}
            style={sliderStyle}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '10px', 
            color: '#666',
            marginTop: '4px'
          }}>
            <span>Simple</span>
            <span>Complex</span>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Random Seed</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              value={settings.seed}
              onChange={(e) => setSettings({ ...settings, seed: parseInt(e.target.value) || 0 })}
              style={{ ...inputStyle, flex: 1 }}
            />
            <Button
              onClick={handleRandomSeed}
              size="sm"
              variant="outline"
              style={{
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#3b82f6'
              }}
            >
              <RefreshCw size={16} />
            </Button>
          </div>
          <p style={{ 
            margin: '6px 0 0 0', 
            fontSize: '11px', 
            color: '#666',
            lineHeight: '1.4'
          }}>
            Use the same seed to regenerate identical scenes
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#888'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Current Obstacles:</span>
            <span style={{ color: '#3b82f6', fontWeight: '600' }}>{obstacles.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Environment Size:</span>
            <span style={{ color: '#3b82f6', fontWeight: '600' }}>
              {useEnvironment.getState().environmentSize.width}m × {useEnvironment.getState().environmentSize.height}m
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{
            width: '100%',
            padding: '12px',
            background: isGenerating ? 'rgba(100, 100, 100, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Sparkles size={18} />
          {isGenerating ? 'Generating Scene...' : 'Generate & Apply Scene'}
        </Button>

        <Button
          onClick={handleClearScene}
          variant="outline"
          style={{
            width: '100%',
            padding: '10px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Trash2 size={16} />
          Clear All Obstacles
        </Button>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '12px',
        background: 'rgba(234, 179, 8, 0.1)',
        border: '1px solid rgba(234, 179, 8, 0.3)',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#fbbf24',
        lineHeight: '1.5'
      }}>
        <strong>Tip:</strong> Adjust the seed value to get different variations of the same scene type. Higher complexity creates larger environments.
      </div>
    </div>
  );
}
