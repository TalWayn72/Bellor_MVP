import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { missionService, responseService, userService, notificationService } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createPageUrl } from '@/utils';
import { Video, FileText, Lightbulb, Mic, ArrowRight, Eye } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { extractHashtags } from '../components/feed/HashtagExtractor';
import { extractMentions } from '../components/feed/MentionExtractor';

export default function WriteTask() {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const [textContent, setTextContent] = useState('');
  const [selectedOption, setSelectedOption] = useState('Subtle energy');
  const [isPublic, setIsPublic] = useState(true);

  const { data: todayMission } = useQuery({
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

  const handleShare = async () => {
    if (!textContent.trim() || !currentUser) {
      alert('Please write something before sharing');
      return;
    }

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

      const hashtags = extractHashtags(textContent);
      const mentions = extractMentions(textContent);

      // Find user IDs for mentions
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

      const result = await responseService.createResponse({
        missionId: mission.id,
        responseType: 'TEXT',
        content: textContent,
        textContent: textContent,
        isPublic: isPublic
      });

      navigate(createPageUrl('SharedSpace'));
    } catch (error) {
      console.error('Error saving text:', error);
      alert('Error saving text');
    }
  };

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
            <p className="text-xs text-muted-foreground">Task - Write</p>
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
              {todayMission?.question || "Share something interesting about yourself"}
            </h2>

            {/* Options */}
            {todayMission?.options && (
            <div className="space-y-2 mb-4">
              {todayMission.options.map((option) => (
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
            )}

            <p className="text-xs text-muted-foreground text-center">
              Use #hashtags and @mentions in your post
            </p>
          </CardContent>
        </Card>

        {/* Writing Area */}
        <div className="w-full max-w-md mb-6">
          <div className="bg-card rounded-3xl p-6 shadow-lg border border-border">
            <Textarea
              placeholder="Share your thoughts..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="w-full min-h-[300px] text-base border-none focus:ring-0 resize-none"
            />

            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <Card>
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

              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {textContent.length} characters
                </span>
                <Button
                  onClick={handleShare}
                  disabled={!textContent.trim()}
                >
                  SHARE
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
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
          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs text-foreground">Write</span>
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
