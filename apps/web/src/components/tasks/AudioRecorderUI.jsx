import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mic, Square, ArrowRight, Eye } from 'lucide-react';

const MAX_DURATION_SECONDS = 25;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioRecorderUI({
  isRecording, hasRecording, audioUrl, secondsLeft,
  isPublic, setIsPublic, onStart, onStop, onRecordAgain, onShare,
}) {
  if (hasRecording) {
    return (
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
          <Button onClick={onRecordAgain} variant="outline" className="flex-1 h-12 text-sm font-medium">
            RECORD AGAIN
          </Button>
          <Button onClick={onShare} className="flex-1 h-12 text-sm font-medium">
            SHARE
            <ArrowRight className="w-4 h-4 mr-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-32 h-32 mb-6 relative">
        <div className={`w-full h-full rounded-full flex items-center justify-center ${
          isRecording ? 'bg-destructive animate-pulse' : 'bg-muted'
        }`}>
          <Mic className={`w-16 h-16 ${isRecording ? 'text-destructive-foreground' : 'text-muted-foreground'}`} />
        </div>
      </div>
      {isRecording && (
        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">Recording...</span>
          </div>
          <div className="text-2xl font-mono font-bold text-foreground">{formatTime(secondsLeft)}</div>
          <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-destructive rounded-full transition-all duration-300"
              style={{ width: `${((MAX_DURATION_SECONDS - secondsLeft) / MAX_DURATION_SECONDS) * 100}%` }}
            />
          </div>
        </div>
      )}
      <Button
        onClick={isRecording ? onStop : onStart}
        className={`w-full h-12 text-sm font-medium ${
          isRecording ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''
        }`}
      >
        {isRecording ? <><Square className="w-4 h-4 ml-2 fill-current" /> STOP</> : 'START RECORDING'}
      </Button>
    </div>
  );
}
