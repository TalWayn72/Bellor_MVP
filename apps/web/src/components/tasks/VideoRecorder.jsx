import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function VideoRecorder({ onShare }) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isPublic] = useState(true);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setHasRecording(true);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
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
    setVideoUrl(null);
    setHasRecording(false);
    chunksRef.current = [];
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
              <video src={videoUrl} className="w-full h-full object-cover" controls />
            </div>
          )}

          {!hasRecording && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center ${
                  isRecording ? 'bg-red-500' : 'bg-white'
                }`}
              >
                {isRecording && (
                  <div className="w-8 h-8 bg-white rounded-sm"></div>
                )}
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
          <Button onClick={() => onShare(videoUrl, isPublic)} className="flex-1 h-12 text-sm font-medium">
            SHARE
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </>
  );
}
