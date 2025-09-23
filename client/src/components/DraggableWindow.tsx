import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface DraggableWindowProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  width?: number;
  height?: number;
}

export default function DraggableWindow({
  title,
  isOpen,
  onClose,
  children,
  initialPosition = { x: 100, y: 100 },
  width = 400,
  height = 600
}: DraggableWindowProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!windowRef.current) return;
    
    const rect = windowRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Keep window within viewport bounds
      const maxX = window.innerWidth - width;
      const maxY = window.innerHeight - height;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, width, height]);

  if (!isOpen) return null;

  return (
    <div
      ref={windowRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: width,
        height: height,
        background: 'rgba(20, 20, 20, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'default',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)'
      }}
    >
      {/* Window Header */}
      <div
        style={{
          background: 'rgba(40, 40, 40, 0.9)',
          padding: '12px 16px',
          borderRadius: '8px 8px 0 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: 'grab',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
      >
        <h3 style={{ 
          color: '#e5e5e5', 
          fontSize: '14px', 
          fontWeight: '600',
          margin: 0 
        }}>
          {title}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          style={{ 
            color: '#888', 
            padding: '4px',
            minWidth: 'auto'
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Window Content */}
      <div style={{
        padding: '16px',
        height: 'calc(100% - 60px)',
        overflow: 'auto',
        color: '#e5e5e5'
      }}>
        {children}
      </div>
    </div>
  );
}