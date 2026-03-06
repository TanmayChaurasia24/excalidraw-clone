"use client";

import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
import rough from "roughjs";
import { v4 as uuidv4 } from "uuid";

// 1. Define the shapes and tools
export type ToolType = "SELECTION" | "RECTANGLE" | "ELLIPSE" | "PENCIL";

export interface CanvasElement {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width: number;
  height: number;
  points?: { x: number; y: number }[]; // Specifically for the PENCIL tool
  properties: { stroke: string; strokeWidth: number };
}

export default function Canvas({ roomId }: { roomId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // UI State
  const [tool, setTool] = useState<ToolType>("RECTANGLE");
  const [elements, setElements] = useState<CanvasElement[]>([]);

  // High-performance drawing refs (bypasses React state batching)
  const isDrawing = useRef(false);
  const currentElement = useRef<CanvasElement | null>(null);

  useEffect(() => {
    const fetchInitialCanvas = async () => {
      try {
        const { roomService } = await import("@/lib/api");
        const response = await roomService.fetchInitialCanvas(roomId);
        
        if (response?.success && Array.isArray(response.data)) {
          setElements(response.data);
        } else {
          console.log("failed to fetch valid structured elements from backend");
        }
      } catch (error) {
        console.log("error to fetch data elements from backend", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialCanvas().then(() => {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:9000";
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        // Handle live drawing updates from others
        if (
          message.type === "receive_canvas_update" ||
          message.type === "receive_canvas_commit"
        ) {
          setElements((prev) => {
            // Check if element exists (to update it) or add new
            const exists = prev.find((el) => el.id === message.element.id);
            if (exists) {
              return prev.map((el) =>
                el.id === message.element.id ? message.element : el,
              );
            }
            return [...prev, message.element];
          });
        }
      };

      wsRef.current = ws;
    });
    return () => {
      wsRef.current?.close();
    };
  }, [roomId]);

  // 2. The Render Engine
  useLayoutEffect(() => {
    if (isLoading) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rc = rough.canvas(canvas);

    if (ctx) {
      // Clear previous frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw all committed elements
      elements.forEach((el) => drawShape(rc, el, ctx));

      // Draw the element currently being actively dragged
      if (currentElement.current) {
        drawShape(rc, currentElement.current, ctx);
      }
    }
  }, [elements, tool, currentElement.current]);

  // 3. Shape Generator Helper
  const drawShape = (
    rc: any,
    el: CanvasElement,
    ctx: CanvasRenderingContext2D,
  ) => {
    if (el.type === "RECTANGLE") {
      rc.rectangle(el.x, el.y, el.width, el.height, el.properties);
    } else if (el.type === "ELLIPSE") {
      // Rough.js expects center coordinates for ellipses, so we calculate them
      const centerX = el.x + el.width / 2;
      const centerY = el.y + el.height / 2;
      rc.ellipse(centerX, centerY, el.width, el.height, el.properties);
    } else if (el.type === "PENCIL" && el.points && el.points.length > 0) {
      // For freehand drawing, we draw a continuous line through saved points
      const points = el.points;
      ctx.beginPath();
      ctx.moveTo(points[0]!.x, points[0]!.y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i]!.x, points[i]!.y);
      }
      ctx.strokeStyle = el.properties.stroke;
      ctx.lineWidth = el.properties.strokeWidth;
      ctx.stroke();
    }
  };

  // 4. Mouse Event Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "SELECTION") return;

    isDrawing.current = true;

    // Using nativeEvent.offsetX/Y handles cases where canvas isn't full screen
    const { offsetX, offsetY } = e.nativeEvent;

    currentElement.current = {
      id: uuidv4(),
      type: tool,
      x: offsetX,
      y: offsetY,
      width: 0,
      height: 0,
      points: tool === "PENCIL" ? [{ x: offsetX, y: offsetY }] : undefined,
      properties: { stroke: "#0f172a", strokeWidth: 2 },
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !currentElement.current) return;

    const { offsetX, offsetY } = e.nativeEvent;

    if (currentElement.current.type === "PENCIL") {
      // Append new point to the array
      currentElement.current.points?.push({ x: offsetX, y: offsetY });
    } else {
      // Calculate dynamic width and height based on origin
      currentElement.current.width = offsetX - currentElement.current.x;
      currentElement.current.height = offsetY - currentElement.current.y;
    }

    forceRedraw(); // Trigger useLayoutEffect

    // Broadcast LIVE movement via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "canvas_update",
          element: currentElement.current,
        }),
      );
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing.current || !currentElement.current) return;

    isDrawing.current = false;

    const finalShape = { ...currentElement.current };
    // Save final element to React state
    setElements((prev) => [...prev, finalShape]);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "canvas_commit",
          element: finalShape,
        }),
      );
    }

    currentElement.current = null;
  };

  // Utility to force a canvas redraw without mutating arrays
  const [, setTick] = useState(0);
  const forceRedraw = () => setTick((t) => t + 1);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Simple Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black shadow-md rounded-lg p-2 flex gap-2 z-10 border border-gray-300">
        <button
          onClick={() => setTool("SELECTION")}
          className={`px-3 py-1 rounded ${tool === "SELECTION" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-700 hover:text-blue-500"}`}
        >
          Select
        </button>
        <button
          onClick={() => setTool("RECTANGLE")}
          className={`px-3 py-1 rounded ${tool === "RECTANGLE" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-700 hover:text-blue-500"}`}
        >
          Rectangle
        </button>
        <button
          onClick={() => setTool("ELLIPSE")}
          className={`px-3 py-1 rounded ${tool === "ELLIPSE" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-700 hover:text-blue-500"}`}
        >
          Ellipse
        </button>
        <button
          onClick={() => setTool("PENCIL")}
          className={`px-3 py-1 rounded ${tool === "PENCIL" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-700 hover:text-blue-500"}`}
        >
          Pencil
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={typeof window !== "undefined" ? window.innerWidth : 1200}
        height={typeof window !== "undefined" ? window.innerHeight : 800}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        // Prevents browser from doing text-selection or touch-scrolling while drawing
        className="cursor-crosshair touch-none"
      />
    </div>
  );
}
