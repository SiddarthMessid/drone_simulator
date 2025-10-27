import { useEffect, useState } from 'react';
import TerrainEditor from './TerrainEditor';
import { TerrainConfig } from '../lib/terrain/heightmap';

interface UILayoutProps {
  onUpdateTerrainConfig?: (config: TerrainConfig) => void;
  defaultTerrainConfig?: TerrainConfig;
}

export default function UILayout({ onUpdateTerrainConfig, defaultTerrainConfig }: UILayoutProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '300px',
      padding: '20px',
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 1000
    }}>
      <div style={{ pointerEvents: 'auto' }}>
        {defaultTerrainConfig && onUpdateTerrainConfig && (
          <TerrainEditor
            defaultConfig={defaultTerrainConfig}
            onUpdateConfig={onUpdateTerrainConfig}
          />
        )}
      </div>
    </div>
  );
}