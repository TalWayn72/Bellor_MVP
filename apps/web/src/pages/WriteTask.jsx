import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { missionService, responseService, userService } from '@/api';
import { createPageUrl } from '@/utils';
import { Video, FileText, Lightbulb, Mic } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { extractHashtags } from '../components/feed/HashtagExtractor';
import { extractMentions } from '../components/feed/MentionExtractor';
import WritingPrompt from '@/components/tasks/WritingPrompt';
import { useToast } from '@/components/ui/use-toast';
import { DEFAULT_MISSION, NEW_MISSION_TEMPLATE } from './WriteTask.constants';

export default function WriteTask() {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const { toast } = useToast();
  const [textContent, setTextContent] = useState('');
  const [selectedOption, setSelectedOption] = useState('Subtle energy');
  const [isPublic, setIsPublic] = useState(true);

  const { data: todayMission } = useQuery({
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

  const handleShare = async () => {
    if (!textContent.trim() || !currentUser) {
      toast({ title: 'Validation', description: 'Please write something before sharing', variant: 'destructive' });
      return;
    }

    try {
      let mission = todayMission;
      if (!mission?.id) {
        const result = await missionService.createMission(NEW_MISSION_TEMPLATE);
        mission = result.data;
      }

      const hashtags = extractHashtags(textContent);
      const mentions = extractMentions(textContent);

      const mentionedUserIds = [];
      for (const mention of mentions) {
        const username = mention.substring(1).toLowerCase();
        try {
          const searchResult = await userService.searchUsers({ search: username });
          const users = searchResult.users || [];
          const user = users.find(u =>
            u.nickname?.toLowerCase() === username ||
            u.full_name?.toLowerCase() === username
          );
          if (user && user.id !== currentUser.id) {
            mentionedUserIds.push(user.id);
          }
        } catch (error) {
          console.error('Error finding user:', error);
        }
      }

      await responseService.createResponse({
        missionId: mission.id,
        responseType: 'TEXT',
        content: textContent,
        textContent: textContent,
        isPublic: isPublic
      });

      navigate(createPageUrl('SharedSpace'));
    } catch (error) {
      console.error('Error saving text:', error);
      toast({ title: 'Error', description: 'Error saving text', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]"><div className="w-6"></div></div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Bellor today</h1>
            <p className="text-xs text-muted-foreground">Task - Write</p>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        <WritingPrompt
          todayMission={todayMission}
          textContent={textContent}
          setTextContent={setTextContent}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          isPublic={isPublic}
          setIsPublic={setIsPublic}
          onShare={handleShare}
        />

        <div className="flex gap-8 mt-4">
          <button onClick={() => navigate(createPageUrl('VideoTask'))} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Video className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Video</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs text-foreground">Write</span>
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
