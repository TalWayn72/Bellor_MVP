import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { getRecorderMimeType, getFileExtension } from './recorderUtils';
import { useRecordingTimer } from './useRecordingTimer';
import AudioRecorderUI from './AudioRecorderUI';

const MAX_DURATION_SECONDS = 25;

export default function AudioRecorder({ onShare }) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [detectedMime, setDetectedMime] = useState('audio/webm');
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const { secondsLeft, startTimer, stopTimer, getDuration } = useRecordingTimer(MAX_DURATION_SECONDS);

  // Cleanup stream + URL on unmount (e.g. user navigates away mid-recording)
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const stopRecording = useCallback(() => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, [stopTimer]);

  const startRecording = async () => {
    try {
      if (typeof MediaRecorder === 'undefined') {
        toast({ title: 'Not supported', description: 'Audio recording is not supported in this browser', variant: 'destructive' });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = getRecorderMimeType('audio');
      setDetectedMime(mimeType || 'audio/webm');

      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        stopTimer();

        if (chunksRef.current.length === 0) {
          toast({ title: 'Error', description: 'No audio data was captured. Please try again.', variant: 'destructive' });
          return;
        }

        const actualMime = mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: actualMime });
        if (blob.size === 0) {
          toast({ title: 'Error', description: 'Recording is empty. Please try again.', variant: 'destructive' });
          return;
        }

        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
        setAudioBlob(blob);
        setDetectedMime(actualMime);
        setHasRecording(true);
      };

      mediaRecorder.onerror = () => {
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        stopTimer();
        setIsRecording(false);
        toast({ title: 'Recording Error', description: 'An error occurred during recording.', variant: 'destructive' });
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      startTimer(stopRecording);
    } catch (error) {
      const msg = error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Microphone permission denied. Please allow microphone access.'
        : 'Unable to access microphone';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const handleRecordAgain = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setHasRecording(false);
    chunksRef.current = [];
  };

  const handleShare = () => {
    if (!audioBlob) return;
    const ext = getFileExtension(detectedMime);
    onShare(audioBlob, isPublic, getDuration(), detectedMime, ext);
  };

  return (
    <div className="w-full max-w-md mb-6">
      <div className="bg-card rounded-3xl p-8 shadow-lg border border-border">
        <AudioRecorderUI
          isRecording={isRecording} hasRecording={hasRecording}
          audioUrl={audioUrl} secondsLeft={secondsLeft ?? MAX_DURATION_SECONDS}
          isPublic={isPublic} setIsPublic={setIsPublic}
          onStart={startRecording} onStop={stopRecording}
          onRecordAgain={handleRecordAgain} onShare={handleShare}
        />
      </div>
    </div>
  );
}
