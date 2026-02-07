import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import ProgressBar from '@/components/onboarding/ProgressBar';
import BackButton from '@/components/navigation/BackButton';
import { TOTAL_STEPS } from '@/components/onboarding/utils/onboardingUtils';
import { uploadService } from '@/api';
import { createPageUrl } from '@/utils';

export default function StepDrawing({ formData, setFormData, handleNext, handleBack, isLoading, setIsLoading }) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingContext, setDrawingContext] = useState(null);
  const [drawingColor, setDrawingColor] = useState('#000000');
  const [drawingTool, setDrawingTool] = useState('pen');
  const [lineWidth, setLineWidth] = useState(3);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const getTouchPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
  };

  const drawStroke = (ctx, x, y) => {
    ctx.lineTo(x, y);
    ctx.strokeStyle = drawingTool === 'eraser' ? '#FFFFFF' : drawingColor;
    ctx.lineWidth = drawingTool === 'eraser' ? lineWidth * 3 : lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const saveDrawing = async () => {
    const canvas = canvasRef.current;
    setIsLoading(true);
    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], 'drawing.png', { type: 'image/png' });
      const result = await uploadService.uploadDrawing(file);
      setFormData({ ...formData, drawing_url: result.url });
    } catch (error) {
      console.error('Error saving drawing:', error);
      alert('Error saving drawing. Please try again.');
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
    handleNext();
  };

  return (
    <div className="flex-1 flex flex-col bg-card">
      <BackButton onClick={handleBack} className="top-6 right-6" />
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
        <h1 className="text-xl font-bold">Bell\u00f8r</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-8">Draw Your Choice</h2>
          <ProgressBar currentStep={10} totalSteps={TOTAL_STEPS} />

          <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
            <div className="bg-muted rounded-2xl p-4 mb-4">
              <h4 className="font-semibold text-sm mb-2">Important to know</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">You can draw anything you want. Your sketch will appear on your profile. You must complete this step.</p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-border mb-4 overflow-hidden">
              <canvas ref={canvasRef} width={400} height={500} className="w-full touch-none bg-white"
                onMouseDown={(e) => { setIsDrawing(true); const canvas = canvasRef.current; const pos = getPos(e, canvas); const ctx = canvas.getContext('2d'); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); setDrawingContext(ctx); }}
                onMouseMove={(e) => { if (!isDrawing || !drawingContext) return; const pos = getPos(e, canvasRef.current); drawStroke(drawingContext, pos.x, pos.y); }}
                onMouseUp={() => setIsDrawing(false)}
                onMouseLeave={() => setIsDrawing(false)}
                onTouchStart={(e) => { e.preventDefault(); setIsDrawing(true); const canvas = canvasRef.current; const pos = getTouchPos(e, canvas); const ctx = canvas.getContext('2d'); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); setDrawingContext(ctx); }}
                onTouchMove={(e) => { e.preventDefault(); if (!isDrawing || !drawingContext) return; const pos = getTouchPos(e, canvasRef.current); drawStroke(drawingContext, pos.x, pos.y); }}
                onTouchEnd={() => setIsDrawing(false)}
              />
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex gap-2 justify-center">
                <button onClick={() => setDrawingTool('pen')} className={`w-12 h-12 rounded-full flex items-center justify-center ${drawingTool === 'pen' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => setDrawingTool('eraser')} className={`w-12 h-12 rounded-full flex items-center justify-center ${drawingTool === 'eraser' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <button onClick={() => { const canvas = canvasRef.current; if (!canvas) return; canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height); }} className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20">
                  <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex gap-2 justify-center">
                {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'].map(color => (
                  <button key={color} onClick={() => { setDrawingColor(color); setDrawingTool('pen'); }} className={`w-8 h-8 rounded-full border-2 ${drawingColor === color && drawingTool === 'pen' ? 'border-gray-900' : 'border-border'}`} style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="flex items-center gap-3 justify-center">
                <span className="text-xs text-muted-foreground">Line Width:</span>
                <input type="range" min="1" max="10" value={lineWidth} onChange={(e) => setLineWidth(parseInt(e.target.value))} className="w-32" />
                <span className="text-xs text-muted-foreground">{lineWidth}px</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => { const skipUntil = new Date(); skipUntil.setHours(skipUntil.getHours() + 72); setFormData({ ...formData, drawing_skip_until: skipUntil.toISOString() }); navigate(createPageUrl('Onboarding') + '?step=14'); }} variant="outline" className="flex-1 h-12 text-sm border-2 border-border rounded-xl">
                <span className="text-xs">SKIP<br />for 72 hours</span>
              </Button>
              <Button onClick={saveDrawing} disabled={isLoading} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl disabled:opacity-50">
                {isLoading ? (<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>) : (<>SAVE<ArrowRight className="w-4 h-4 mr-2" /></>)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
