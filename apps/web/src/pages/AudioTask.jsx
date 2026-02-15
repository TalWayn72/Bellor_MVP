import React from 'react';
import { useNavigate } from 'react-router-dom';
import { missionService, responseService, uploadService, userService } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/states';
import { createPageUrl } from '@/utils';
import { Video, FileText, Lightbulb, Mic } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import AudioRecorder from '@/components/tasks/AudioRecorder';
import { useToast } from '@/components/ui/use-toast';

export default function AudioTask() {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const { toast } = useToast();

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

  const handleShare = async (audioBlob, isPublic) => {
    if (!audioBlob || !currentUser) return;

    try {
      let mission = todayMission;
      if (!mission?.id) {
        const result = await missionService.createMission({
          title: "Share something about yourself",
          description: "Share something interesting about yourself today",
          missionType: "DAILY",
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

      const currentResponseCount = currentUser.response_count || 0;
      const currentMissionCount = currentUser.mission_completed_count || 0;
      await userService.updateProfile(currentUser.id, {
        response_count: currentResponseCount + 1,
        mission_completed_count: currentMissionCount + 1,
        last_active_date: new Date().toISOString()
      });

      navigate(createPageUrl('SharedSpace'));
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast({ title: 'Error', description: 'Error saving recording', variant: 'destructive' });
    }
  };

  if (missionLoading || !todayMission) {
    return <LoadingState variant="spinner" text="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]"><div className="w-6"></div></div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Bellor today</h1>
            <p className="text-xs text-muted-foreground">Task - Audio</p>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
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

        <AudioRecorder onShare={handleShare} />

        <div className="flex gap-8 mt-4">
          <button onClick={() => navigate(createPageUrl('VideoTask'))} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Video className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Video</span>
          </button>
          <button onClick={() => navigate(createPageUrl('WriteTask'))} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Write</span>
          </button>
          <button onClick={() => navigate(createPageUrl('IceBreakers'))} className="flex flex-col items-center gap-1">
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
