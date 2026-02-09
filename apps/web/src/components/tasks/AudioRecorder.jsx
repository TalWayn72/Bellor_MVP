import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mic, ArrowRight, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function AudioRecorder({ onShare }) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioBlob(blob);
        setHasRecording(true);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({ title: 'Error', description: 'Unable to access microphone', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRecordAgain = () => {
    setAudioUrl(null);
    setAudioBlob(null);
    setHasRecording(false);
    chunksRef.current = [];
  };

  return (
    <div className="w-full max-w-md mb-6">
      <div className="bg-card rounded-3xl p-8 shadow-lg border border-border">
        {!hasRecording ? (
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 mb-6 relative">
              <div className={`w-full h-full rounded-full flex items-center justify-center ${
                isRecording ? 'bg-destructive animate-pulse' : 'bg-muted'
              }`}>
                <Mic className={`w-16 h-16 ${isRecording ? 'text-destructive-foreground' : 'text-muted-foreground'}`} />
              </div>
            </div>

            {isRecording && (
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">Recording...</span>
              </div>
            )}

            <Button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-full h-12 text-sm font-medium ${
                isRecording ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''
              }`}
            >
              {isRecording ? 'STOP' : 'START RECORDING'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-full mb-6">
              <audio src={audioUrl} controls className="w-full" />
            </div>

            <Card className="mb-4">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-muted-foreground" />
                    <Label htmlFor="public-switch" className="text-sm font-medium">
                      {isPublic ? 'Public' : 'Private'}
                    </Label>
                  </div>
                  <Switch id="public-switch" checked={isPublic} onCheckedChange={setIsPublic} />
                </div>
              </CardContent>
            </Card>

            <div className="w-full flex gap-3">
              <Button onClick={handleRecordAgain} variant="outline" className="flex-1 h-12 text-sm font-medium">
                RECORD AGAIN
              </Button>
              <Button onClick={() => onShare(audioBlob, isPublic)} className="flex-1 h-12 text-sm font-medium">
                SHARE
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
