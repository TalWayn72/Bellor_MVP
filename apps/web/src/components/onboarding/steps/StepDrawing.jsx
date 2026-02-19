import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import ProgressBar from '@/components/onboarding/ProgressBar';
import BackButton from '@/components/navigation/BackButton';
import { TOTAL_STEPS } from '@/components/onboarding/utils/onboardingUtils';
import { uploadService } from '@/api';
import { createPageUrl } from '@/utils';
import { useToast } from '@/components/ui/use-toast';

export default function StepDrawing({ formData, setFormData, handleNext, handleBack, isLoading, setIsLoading }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const drawingColorRef = useRef('#000000');
  const drawingToolRef = useRef('pen');
  const lineWidthRef = useRef(3);
  const [uiColor, setUiColor] = useState('#000000');
  const [uiTool, setUiTool] = useState('pen');
  const [uiLineWidth, setUiLineWidth] = useState(3);

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
    const tool = drawingToolRef.current;
    const width = lineWidthRef.current;
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : drawingColorRef.current;
    ctx.lineWidth = tool === 'eraser' ? width * 3 : width;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const saveDrawing = async () => {
    const canvas = canvasRef.current;
    setIsLoading(true);
    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], 'drawing.png', { type: 'image/png' });
      const result = await uploadService.uploadDrawing(file);
      setFormData({ ...formData, drawing_url: result.url });
    } catch {
      toast({ title: 'Error', description: 'Error saving drawing. Please try again.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
    handleNext();
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <BackButton onClick={handleBack} className="top-6 right-6" />
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
        <h1 className="text-xl font-bold text-gray-900">Bell\u00f8r</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">Draw Your Choice</h2>
          <ProgressBar currentStep={10} totalSteps={TOTAL_STEPS} />

          <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
            <div className="bg-muted rounded-2xl p-4 mb-4">
              <h4 className="font-semibold text-sm mb-2">Important to know</h4>
              <p className="text-xs text-gray-500 leading-relaxed">You can draw anything you want. Your sketch will appear on your profile. You must complete this step.</p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-border mb-4 overflow-hidden">
              <canvas ref={canvasRef} width={400} height={500} className="w-full touch-none bg-white"
                onMouseDown={(e) => { isDrawingRef.current = true; const canvas = canvasRef.current; const pos = getPos(e, canvas); const ctx = canvas.getContext('2d'); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); }}
                onMouseMove={(e) => { if (!isDrawingRef.current) return; const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e, canvasRef.current); drawStroke(ctx, pos.x, pos.y); }}
                onMouseUp={() => { isDrawingRef.current = false; }}
                onMouseLeave={() => { isDrawingRef.current = false; }}
                onTouchStart={(e) => { e.preventDefault(); isDrawingRef.current = true; const canvas = canvasRef.current; const pos = getTouchPos(e, canvas); const ctx = canvas.getContext('2d'); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); }}
                onTouchMove={(e) => { e.preventDefault(); if (!isDrawingRef.current) return; const ctx = canvasRef.current.getContext('2d'); const pos = getTouchPos(e, canvasRef.current); drawStroke(ctx, pos.x, pos.y); }}
                onTouchEnd={() => { isDrawingRef.current = false; }}
              />
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex gap-2 justify-center">
                <button onClick={() => { drawingToolRef.current = 'pen'; setUiTool('pen'); }} className={`w-12 h-12 rounded-full flex items-center justify-center ${uiTool === 'pen' ? 'bg-primary text-primary-foreground' : 'bg-muted text-gray-500'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => { drawingToolRef.current = 'eraser'; setUiTool('eraser'); }} className={`w-12 h-12 rounded-full flex items-center justify-center ${uiTool === 'eraser' ? 'bg-primary text-primary-foreground' : 'bg-muted text-gray-500'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <button onClick={() => { const canvas = canvasRef.current; if (!canvas) return; canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height); }} className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20">
                  <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex gap-2 justify-center">
                {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'].map(color => (
                  <button key={color} onClick={() => { drawingColorRef.current = color; drawingToolRef.current = 'pen'; setUiColor(color); setUiTool('pen'); }} className={`w-8 h-8 rounded-full border-2 ${uiColor === color && uiTool === 'pen' ? 'border-gray-900' : 'border-border'}`} style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="flex items-center gap-3 justify-center">
                <span className="text-xs text-gray-500">Line Width:</span>
                <input type="range" min="1" max="10" value={uiLineWidth} onChange={(e) => { const v = parseInt(e.target.value); lineWidthRef.current = v; setUiLineWidth(v); }} className="w-32" />
                <span className="text-xs text-gray-500">{uiLineWidth}px</span>
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
