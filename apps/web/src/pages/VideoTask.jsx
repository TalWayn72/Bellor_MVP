import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { missionService, responseService, uploadService, userService } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/states';
import { createPageUrl } from '@/utils';
import { Video, FileText, Lightbulb, Mic, ArrowRight } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '../components/hooks/useCurrentUser';

export default function VideoTask() {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [selectedOption, setSelectedOption] = useState('Subtle energy');
  const [isPublic, setIsPublic] = useState(true);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const { data: todayMission, isLoading: missionLoading } = useQuery({
    queryKey: ['todayMission'],
    queryFn: async () => {
      try {
        const result = await missionService.getTodaysMission();
        return result.data || {
          question: "Which type of energy are you most drawn to?",
          options: ["Subtle energy", "Light, grounded, romantic, steady", "Primal nature"]
        };
      } catch (error) {
        return {
          question: "Which type of energy are you most drawn to?",
          options: ["Subtle energy", "Light, grounded, romantic, steady", "Primal nature"]
        };
      }
    },
  });

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
      alert('Unable to access camera');
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

  const handleShare = async () => {
    if (!videoUrl || !currentUser) return;

    try {
      // Create mission if doesn't exist
      let mission = todayMission;
      if (!mission?.id) {
        const today = new Date().toISOString().split('T')[0];
        const result = await missionService.createMission({
          title: "Share something about yourself",
          question: "Share something interesting about yourself today",
          category: "identity",
          date: today,
          isActive: true,
          responseTypes: ['text', 'drawing', 'voice', 'video']
        });
        mission = result.data;
      }

      const blob = await fetch(videoUrl).then(r => r.blob());
      const file = new File([blob], 'video.webm', { type: 'video/webm' });
      const uploadResult = await uploadService.uploadFile(file);
      const file_url = uploadResult.url;

      await responseService.createResponse({
        missionId: mission.id,
        responseType: 'VIDEO',
        content: file_url,
        isPublic: isPublic
      });

      // Update user's response_count and mission_completed_count
      const currentResponseCount = currentUser.response_count || 0;
      const currentMissionCount = currentUser.mission_completed_count || 0;
      await userService.updateProfile(currentUser.id, {
        response_count: currentResponseCount + 1,
        mission_completed_count: currentMissionCount + 1,
        last_active_date: new Date().toISOString()
      });

      navigate(createPageUrl('SharedSpace'));
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error saving video');
    }
  };

  if (missionLoading || !todayMission) {
    return <LoadingState variant="spinner" text="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <div className="w-6"></div>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Bellør today</h1>
            <p className="text-xs text-muted-foreground">Task - Video</p>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        {/* Question Card */}
        <Card className="w-full max-w-md mb-8">
          <CardContent className="p-5">
            <h2 className="text-base font-semibold mb-4 text-foreground">
              {todayMission.question}
            </h2>

            {/* Options */}
            <div className="space-y-2 mb-4">
              {todayMission?.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedOption(option)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    selectedOption === option
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <span className="text-sm text-foreground">{option}</span>
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Choose your way to share
            </p>
          </CardContent>
        </Card>

        {/* Video Recording Area */}
        <div className="w-full max-w-md mb-6">
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-lg" style={{ aspectRatio: '9/16' }}>
            {!hasRecording ? (
              <div className="absolute inset-0 bg-gray-900">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gray-900">
                <video
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  controls
                />
              </div>
            )}

            {/* Recording Button */}
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

        {/* Action Buttons */}
        {hasRecording && (
          <div className="w-full max-w-md flex gap-3 mb-6">
            <Button
              onClick={handleRecordAgain}
              variant="outline"
              className="flex-1 h-12 text-sm font-medium"
            >
              RECORD AGAIN
            </Button>
            <Button
              onClick={handleShare}
              className="flex-1 h-12 text-sm font-medium"
            >
              SHARE
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Bottom Navigation Icons */}
        <div className="flex gap-8 mt-4">
          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs text-foreground">Video</span>
          </button>
          <button
            onClick={() => navigate(createPageUrl('WriteTask'))}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Write</span>
          </button>
          <button
            onClick={() => navigate(createPageUrl('IceBreakers'))}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Ideas</span>
          </button>
          <button
            onClick={() => navigate(createPageUrl('AudioTask'))}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Mic className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Voice</span>
          </button>
        </div>
      </div>
    </div>
  );
}
