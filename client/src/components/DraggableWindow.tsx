import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";

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
  width: initialWidth = 400,
  height: initialHeight = 600,
}: DraggableWindowProps) {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState({
    width: initialWidth,
    height: initialHeight,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>("");
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!windowRef.current) return;

    const rect = windowRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Keep window within viewport bounds
        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - size.height;

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }

      if (isResizing) {
        const newSize = { ...size };
        const newPos = { ...position };

        if (resizeDirection.includes("e")) {
          newSize.width = Math.max(300, e.clientX - position.x);
        }
        if (resizeDirection.includes("s")) {
          newSize.height = Math.max(200, e.clientY - position.y);
        }
        if (resizeDirection.includes("w")) {
          const newWidth = Math.max(300, size.width + (position.x - e.clientX));
          newPos.x = position.x - (newWidth - size.width);
          newSize.width = newWidth;
        }
        if (resizeDirection.includes("n")) {
          const newHeight = Math.max(
            200,
            size.height + (position.y - e.clientY)
          );
          newPos.y = position.y - (newHeight - size.height);
          newSize.height = newHeight;
        }

        setSize(newSize);
        setPosition(newPos);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection("");
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, size, position, resizeDirection]);

  if (!isOpen) return null;

  return (
    <div
      ref={windowRef}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        background: "rgba(20, 20, 20, 0.95)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "8px",
        zIndex: 1000,
        cursor: isDragging ? "grabbing" : "default",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Window Header */}
      <div
        style={{
          background: "rgba(40, 40, 40, 0.9)",
          padding: "12px 16px",
          borderRadius: "8px 8px 0 0",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          cursor: "grab",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          userSelect: "none",
        }}
        onMouseDown={handleMouseDown}
      >
        <h3
          style={{
            color: "#e5e5e5",
            fontSize: "14px",
            fontWeight: "600",
            margin: 0,
          }}
        >
          {title}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          style={{
            color: "#888",
            padding: "4px",
            minWidth: "auto",
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Window Content */}
      <div
        className="custom-scrollbar"
        style={{
          padding: "16px",
          height: "calc(100% - 60px)",
          overflow: "auto",
          color: "#e5e5e5",
        }}
      >
        {children}
      </div>

      {/* Resize Handles */}
      {/* Bottom-right corner */}
      <div
        onMouseDown={(e) => handleResizeStart(e, "se")}
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: "16px",
          height: "16px",
          cursor: "nwse-resize",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "0 0 8px 0",
        }}
      />
      {/* Bottom edge */}
      <div
        onMouseDown={(e) => handleResizeStart(e, "s")}
        style={{
          position: "absolute",
          left: "16px",
          right: "16px",
          bottom: 0,
          height: "4px",
          cursor: "ns-resize",
        }}
      />
      {/* Right edge */}
      <div
        onMouseDown={(e) => handleResizeStart(e, "e")}
        style={{
          position: "absolute",
          right: 0,
          top: "60px",
          bottom: "16px",
          width: "4px",
          cursor: "ew-resize",
        }}
      />
    </div>
  );
}
