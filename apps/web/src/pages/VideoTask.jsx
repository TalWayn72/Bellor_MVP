import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { missionService, responseService, uploadService, userService } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/states';
import { createPageUrl } from '@/utils';
import { Video, FileText, Lightbulb, Mic } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import VideoRecorder from '@/components/tasks/VideoRecorder';
import { useToast } from '@/components/ui/use-toast';
import { DEFAULT_MISSION, NEW_MISSION_TEMPLATE } from './VideoTask.constants';

export default function VideoTask() {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState('Subtle energy');
  const [isPublic] = useState(true);

  const { data: todayMission, isLoading: missionLoading } = useQuery({
    queryKey: ['todayMission'],
    queryFn: async () => {
      try {
        const result = await missionService.getTodaysMission();
        return result.data || DEFAULT_MISSION;
      } catch (error) {
        return DEFAULT_MISSION;
      }
    },
  });

  const handleShare = async (videoUrl, videoIsPublic) => {
    if (!videoUrl || !currentUser) return;

    try {
      let mission = todayMission;
      if (!mission?.id) {
        const today = new Date().toISOString().split('T')[0];
        const result = await missionService.createMission({
          ...NEW_MISSION_TEMPLATE,
          date: today,
          isActive: true,
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
      toast({ title: 'Error', description: 'Error saving video', variant: 'destructive' });
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
            <p className="text-xs text-muted-foreground">Task - Video</p>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        <Card className="w-full max-w-md mb-8">
          <CardContent className="p-5">
            <h2 className="text-base font-semibold mb-4 text-foreground">{todayMission.question}</h2>
            <div className="space-y-2 mb-4">
              {todayMission?.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedOption(option)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    selectedOption === option ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  }`}
                >
                  <span className="text-sm text-foreground">{option}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">Choose your way to share</p>
          </CardContent>
        </Card>

        <VideoRecorder onShare={handleShare} />

        <div className="flex gap-8 mt-4">
          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs text-foreground">Video</span>
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
          <button onClick={() => navigate(createPageUrl('AudioTask'))} className="flex flex-col items-center gap-1">
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
