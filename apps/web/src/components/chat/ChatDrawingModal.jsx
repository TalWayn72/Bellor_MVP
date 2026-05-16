import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

const COLORS = ['#111827', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b'];

export default function ChatDrawingModal({ onClose, onSend, isUploading }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const colorRef = useRef(COLORS[0]);
  const [color, setColor] = useState(COLORS[0]);

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const source = event.touches?.[0] || event;
    return {
      x: (source.clientX - rect.left) * (canvas.width / rect.width),
      y: (source.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const start = (event) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const point = getPoint(event);
    drawingRef.current = true;
    ctx.strokeStyle = colorRef.current;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (event) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const point = getPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  };

  const createFile = () => new Promise((resolve, reject) => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Unable to create drawing image'));
      else resolve(new File([blob], `chat-drawing-${Date.now()}.png`, { type: 'image/png' }));
    }, 'image/png');
  });

  const send = async () => {
    const sent = await onSend(createFile);
    if (sent) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 flex items-end sm:items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-label="Draw a message" className="w-full max-w-md bg-card border border-border rounded-xl p-4 shadow-lg">
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="w-full bg-white border border-border rounded-lg touch-none"
          onMouseDown={start}
          onMouseMove={draw}
          onMouseUp={() => { drawingRef.current = false; }}
          onMouseLeave={() => { drawingRef.current = false; }}
          onTouchStart={start}
          onTouchMove={draw}
          onTouchEnd={() => { drawingRef.current = false; }}
        />
        <div className="flex items-center justify-between gap-3 mt-4">
          <div className="flex gap-2">
            {COLORS.map((nextColor) => (
              <button
                key={nextColor}
                type="button"
                aria-label={`Use color ${nextColor}`}
                className={`h-7 w-7 rounded-full border-2 ${color === nextColor ? 'border-foreground' : 'border-border'}`}
                style={{ backgroundColor: nextColor }}
                onClick={() => { colorRef.current = nextColor; setColor(nextColor); }}
              />
            ))}
          </div>
          <Button type="button" variant="ghost" onClick={clear}>Clear</Button>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={send} disabled={isUploading} aria-label="Send drawing">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
