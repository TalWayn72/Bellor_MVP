import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { missionService, responseService, uploadService, userService } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/states';
import { createPageUrl } from '@/utils';
import { Mic, Video, FileText, Lightbulb, ArrowRight, Eye } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '../components/hooks/useCurrentUser';

export default function AudioTask() {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const { data: todayMission, isLoading: missionLoading } = useQuery({
    queryKey: ['todayMission'],
    queryFn: async () => {
      try {
        const result = await missionService.getTodaysMission();
        return result.data || {
          title: "If I Had a Rhythm",
          question: "If music lived inside you - what would you rhythm sound like?",
          subtitle: "Record it for me!"
        };
      } catch (error) {
        return {
          title: "If I Had a Rhythm",
          question: "If music lived inside you - what would you rhythm sound like?",
          subtitle: "Record it for me!"
        };
      }
    },
  });

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
      alert('Unable to access microphone');
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

  const handleShare = async () => {
    if (!audioBlob || !currentUser) return;

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

      const file = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
      const uploadResult = await uploadService.uploadFile(file);
      const file_url = uploadResult.url;

      await responseService.createResponse({
        missionId: mission.id,
        responseType: 'VOICE',
        content: file_url,
        isPublic: isPublic
      });

      // Update user's response_count and mission_completed_count
      const currentResponseCount = currentUser.response_count || 0;
      const currentMissionCount = currentUser.mission_completed_count || 0;
      await userService.updateProfile({
        response_count: currentResponseCount + 1,
        mission_completed_count: currentMissionCount + 1,
        last_active_date: new Date().toISOString()
      });

      navigate(createPageUrl('SharedSpace'));
    } catch (error) {
      console.error('Error uploading audio:', error);
      alert('Error saving recording');
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
            <p className="text-xs text-muted-foreground">Task - Audio</p>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        {/* Question Card */}
        <Card className="w-full max-w-md mb-8">
          <CardContent className="p-5">
            <h2 className="text-base font-semibold mb-2 text-foreground">
              {todayMission?.title || "If I Had a Rhythm"}
            </h2>
            <p className="text-sm text-muted-foreground mb-1">
              {todayMission?.question || "If music lived inside you - what would you rhythm sound like?"}
            </p>
            <p className="text-xs text-muted-foreground">
              {todayMission?.subtitle || "Record it for me!"}
            </p>
          </CardContent>
        </Card>

        {/* Recording Area */}
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
                  <audio
                    src={audioUrl}
                    controls
                    className="w-full"
                  />
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
                      <Switch
                        id="public-switch"
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="w-full flex gap-3">
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
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation Icons */}
        <div className="flex gap-8 mt-4">
          <button
            onClick={() => navigate(createPageUrl('VideoTask'))}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Video className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Video</span>
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
          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Mic className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs text-foreground">Voice</span>
          </button>
        </div>
      </div>
    </div>
  );
}
