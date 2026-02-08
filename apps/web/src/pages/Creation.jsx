import React from 'react';
import { useNavigate } from 'react-router-dom';
import { missionService, responseService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { FileText, Video, Mic, Pencil } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CreationResponseGrid from '@/components/creation/CreationResponseGrid';

const taskOptions = [
  { id: 'write', title: 'Write', icon: FileText, color: 'bg-blue-500', path: 'WriteTask' },
  { id: 'video', title: 'Video', icon: Video, color: 'bg-red-500', path: 'VideoTask' },
  { id: 'audio', title: 'Audio', icon: Mic, color: 'bg-green-500', path: 'AudioTask' },
  { id: 'drawing', title: 'Drawing', icon: Pencil, color: 'bg-purple-500', path: 'Onboarding?step=13' },
];

export default function Creation() {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();

  const { data: todayMission } = useQuery({
    queryKey: ['todayMission'],
    queryFn: async () => {
      try { return (await missionService.getTodaysMission()).data; }
      catch { return null; }
    },
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['userResponses', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      try { return (await responseService.listResponses({ userId: currentUser.id, limit: 50 })).responses || []; }
      catch { return []; }
    },
    enabled: !!currentUser,
  });

  const totalResponses = responses.length;
  const totalLikes = responses.reduce((sum, r) => sum + (r.likes_count || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]"><div className="w-6"></div></div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Creation</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {todayMission && (
          <Card variant="glass" className="bg-gradient-to-br from-gray-900 to-gray-800 border-0 rounded-3xl mb-6">
            <CardContent className="p-5">
              <h2 className="text-base font-bold text-white mb-2">Daily Task</h2>
              <p className="text-sm text-white/90 leading-relaxed mb-4">
                {todayMission.question || "Share something interesting about yourself today"}
              </p>
              <p className="text-xs text-white/60">Choose your way to share</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8">
          {taskOptions.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              onClick={() => navigate(createPageUrl(option.path))}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl hover:bg-muted transition-colors shadow-sm h-auto"
            >
              <div className={`w-14 h-14 rounded-full ${option.color} flex items-center justify-center`}>
                <option.icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground">{option.title}</span>
            </Button>
          ))}
        </div>

        <Card className="rounded-2xl shadow-sm mb-6">
          <CardContent className="p-5">
            <h3 className="font-semibold text-base mb-4 text-foreground">My Creations</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card className="text-center p-4 bg-muted border-0">
                <CardContent className="p-0">
                  <div className="text-2xl font-bold text-foreground">{totalResponses}</div>
                  <div className="text-xs text-muted-foreground mt-1">Total creations</div>
                </CardContent>
              </Card>
              <Card className="text-center p-4 bg-muted border-0">
                <CardContent className="p-0">
                  <div className="text-2xl font-bold text-love">{totalLikes}</div>
                  <div className="text-xs text-muted-foreground mt-1">Hearts</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <CreationResponseGrid responses={responses} />
        </div>
      </div>
    </div>
  );
}
