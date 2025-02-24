import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { apiRoot } from "../utils/foundation";

const HandWrite: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
  const [isBgImageSelected, setIsBgImageSelected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCanvasSize({
        width: window.innerWidth * 0.9,
        height: window.innerHeight * 0.8,
      });
    }
  }, []);

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

  const handlePost = async () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const imageData = canvas.toDataURL('image/png');

      // 画像データをバックエンドに送信
      const response = await fetch(apiRoot+'/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          user_id: user?.uid ?? "guest",
        }),
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

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setIsBgImageSelected(file ? true : false);
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.filter = 'blur(5px)'; // ここでぼかしフィルターを適用
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            ctx.filter = 'none'; // フィルターをリセット
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mt-5 flex flex-col items-center gap-4">
      {!isBgImageSelected ? (
        <>
          <input
            type="file"
            accept="image/*"
            onChange={handleBackgroundChange}
            style={{ display: 'none' }}
            id="backgroundInput"
          />
          <Button onClick={() => document.getElementById('backgroundInput')?.click()}>
            背景写真を選ぶ
          </Button>
        </>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            style={{
              boxShadow: '0 4px 6px rgba(0.2, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)', // 柔らかい影
              borderRadius: '8px', // 角を丸く
              backgroundColor: '#fff', // キャンバスの背景色を白に
            }}
          />
          <Button onClick={handlePost}>俳句を投稿</Button>
        </>
      )}
    </div>
  );
};

export default HandWrite;