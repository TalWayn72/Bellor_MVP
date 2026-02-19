import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getRecorderMimeType, getFileExtension } from './recorderUtils';
import { useRecordingTimer } from './useRecordingTimer';

export default function VideoRecorder({ onShare }) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isPublic] = useState(true);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordedBlobRef = useRef(null);
  const mimeTypeRef = useRef('video/webm');
  const { recordingTime, startTimer, stopTimer, getDuration, formatTime } = useRecordingTimer();

  useEffect(() => {
    return () => { if (videoUrl) URL.revokeObjectURL(videoUrl); };
  }, [videoUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();

      const mimeType = getRecorderMimeType('video');
      mimeTypeRef.current = mimeType;
      const opts = mimeType && MediaRecorder.isTypeSupported(mimeType) ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, opts);
      mimeTypeRef.current = mediaRecorder.mimeType || mimeType;
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stopTimer();
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        stream.getTracks().forEach(track => track.stop());

        if (blob.size < 1000) {
          toast({ title: 'Recording too short', description: 'Please record a longer video', variant: 'destructive' });
          return;
        }

        if (videoUrl) URL.revokeObjectURL(videoUrl);
        recordedBlobRef.current = blob;
        setVideoUrl(URL.createObjectURL(blob));
        setHasRecording(true);
      };

      mediaRecorder.start(1000);
      startTimer();
      setIsRecording(true);
    } catch {
      toast({ title: 'Error', description: 'Unable to access camera', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRecordAgain = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setHasRecording(false);
    recordedBlobRef.current = null;
    chunksRef.current = [];
  };

  const handleShare = () => {
    const blob = recordedBlobRef.current;
    if (!blob) return;
    onShare(blob, isPublic, getDuration(), mimeTypeRef.current, getFileExtension(mimeTypeRef.current));
  };

  return (
    <>
      <div className="w-full max-w-md mb-6">
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-lg" style={{ aspectRatio: '9/16' }}>
          {!hasRecording ? (
            <div className="absolute inset-0 bg-gray-900">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gray-900">
              <video src={videoUrl} className="w-full h-full object-cover" controls preload="metadata" />
            </div>
          )}

          {!hasRecording && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
              {isRecording && (
                <div className="flex items-center gap-2 bg-black/60 rounded-full px-3 py-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white text-sm font-mono">{formatTime(recordingTime)}</span>
                </div>
              )}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center ${
                  isRecording ? 'bg-red-500' : 'bg-white'
                }`}
              >
                {isRecording && <div className="w-8 h-8 bg-white rounded-sm" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {hasRecording && (
        <div className="w-full max-w-md flex gap-3 mb-6">
          <Button onClick={handleRecordAgain} variant="outline" className="flex-1 h-12 text-sm font-medium">
            RECORD AGAIN
          </Button>
          <Button onClick={handleShare} className="flex-1 h-12 text-sm font-medium">
            SHARE
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </>
  );
}
