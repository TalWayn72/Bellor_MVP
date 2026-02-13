import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Mic, MessageCircle, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ChatInput({
  message, onMessageChange, onSend,
  showIceBreakers, onToggleIceBreakers, iceBreakers, showIceBreakerPanel, onSelectIceBreaker,
  onSendImage, onSendVoice, isUploading,
}) {
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    return () => { mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) { onSendImage(file); e.target.value = ''; }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        onSendVoice(blob);
      };
      recorder.start();
      setIsRecording(true);
    } catch { /* mic permission denied - parent handles toast */ }
  };

  return (
    <>
      {showIceBreakerPanel && (
        <div className="bg-card border-t border-border p-4">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Ice Breakers</h3>
            <div className="space-y-2">
              {iceBreakers.slice(0, 3).map((breaker, idx) => (
                <button key={idx} onClick={() => onSelectIceBreaker(breaker.text)}
                  className="w-full text-left p-3 bg-muted hover:bg-muted/80 rounded-xl text-sm transition-colors text-foreground"
                >{breaker.text}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border-t border-border p-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onToggleIceBreakers} aria-label="Toggle ice breakers"
            className={showIceBreakers ? 'text-primary' : ''}>
            <MessageCircle className="w-5 h-5" />
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          <Button variant="ghost" size="icon" aria-label="Send image" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label={isRecording ? 'Stop recording' : 'Record voice message'}
            onClick={handleMicClick} disabled={isUploading} className={isRecording ? 'text-destructive animate-pulse' : ''}>
            {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Input placeholder="Type a message..." value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && message.trim() && !isUploading) {
                e.preventDefault();
                onSend();
              }
            }}
            className="flex-1" inputSize="default" />
          <Button onClick={onSend} disabled={!message.trim() || isUploading} size="icon" aria-label="Send message" className="rounded-full">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
