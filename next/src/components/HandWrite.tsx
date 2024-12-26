import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const HandWrite: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [savedImage, setSavedImage] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = 'black';
        context.shadowBlur = 1;
        context.shadowColor = 'black';
      }
    }
  }, []);

  const getPointerPos = (canvas: HTMLCanvasElement, e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const drawBrushStroke = (
    ctx: CanvasRenderingContext2D,
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number },
    width: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);

    const midPoint = {
      x: startPoint.x + (endPoint.x - startPoint.x) / 2,
      y: startPoint.y + (endPoint.y - startPoint.y) / 2,
    };

    ctx.quadraticCurveTo(midPoint.x, midPoint.y, endPoint.x, endPoint.y);

    ctx.lineWidth = width;
    ctx.stroke();
    ctx.closePath();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const point = getPointerPos(canvas, e);
      setLastPoint(point);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const currentPoint = getPointerPos(canvas, e);
      const distance = Math.sqrt(
        Math.pow(currentPoint.x - lastPoint.x, 2) + Math.pow(currentPoint.y - lastPoint.y, 2)
      );
      const width = Math.min(10, 10 / (distance + 1) + 1);

      drawBrushStroke(ctx, lastPoint, currentPoint, width);
      setLastPoint(currentPoint);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const imageData = canvas.toDataURL('image/png');
      setSavedImage(imageData);

      // 画像データをバックエンドに送信
      const response = await fetch('http://localhost:8080/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });

      if (response.ok) {
        console.log('Image saved successfully');
      } else {
        console.error('Failed to save image');
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        style={{ border: '1px solid #000' }}
      />
      <Button onClick={handleSave}>俳句を投稿</Button>
      {savedImage && <img src={savedImage} alt="Saved drawing" />}
    </div>
  );
};

export default HandWrite;