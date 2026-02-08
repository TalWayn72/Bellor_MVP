import React from 'react';
import { likeService, responseService, chatService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import BackButton from '@/components/navigation/BackButton';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { CardsSkeleton } from '@/components/states';
import { getDemoLikes, getDemoResponses, getDemoChatUsers } from '@/data/demoData';
import { StatsGrid, ActivitySummary, PremiumCTA, buildStats } from '@/components/analytics/AnalyticsCharts';

export default function Analytics() {
  const { currentUser, isLoading } = useCurrentUser();

  const { data: likesReceived = [] } = useQuery({
    queryKey: ['likesReceived', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return getDemoLikes('romantic', currentUser?.id);
      try {
        const result = await likeService.getReceivedLikes();
        const likes = result.likes || [];
        return likes.length > 0 ? likes : getDemoLikes('romantic', currentUser?.id);
      } catch { return getDemoLikes('romantic', currentUser?.id); }
    },
    enabled: !!currentUser,
  });

  const { data: likesGiven = [] } = useQuery({
    queryKey: ['likesGiven', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      try { const result = await likeService.getSentLikes(); return result.likes || []; }
      catch { return []; }
    },
    enabled: !!currentUser,
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['userResponses', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return getDemoResponses();
      try {
        const result = await responseService.listResponses({ userId: currentUser.id });
        const resps = result.responses || [];
        return resps.length > 0 ? resps : getDemoResponses();
      } catch { return getDemoResponses(); }
    },
    enabled: !!currentUser,
  });

  const { data: chats = [] } = useQuery({
    queryKey: ['userChats', currentUser?.id],
    queryFn: async () => {
      const demoChatData = getDemoChatUsers().map(u => ({ id: u.chatId, status: 'active' }));
      if (!currentUser) return demoChatData;
      try {
        const result = await chatService.getChats();
        const dbChats = result.chats || [];
        return dbChats.length > 0 ? dbChats : demoChatData;
      } catch { return demoChatData; }
    },
    enabled: !!currentUser,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
            <div className="min-w-[24px]"></div>
            <div className="flex-1 text-center"><h1 className="text-lg font-semibold text-foreground">Your Insights</h1></div>
            <div className="min-w-[24px]"></div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-6"><CardsSkeleton count={5} columns={2} /></div>
      </div>
    );
  }

  const stats = buildStats({ likesReceived, likesGiven, chats, responses, currentUser });

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]"><div className="w-6"></div></div>
          <div className="flex-1 text-center"><h1 className="text-lg font-semibold text-foreground">Your Insights</h1></div>
          <BackButton variant="header" position="relative" fallback="/Profile" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <StatsGrid stats={stats} />
        <ActivitySummary likesReceived={likesReceived} likesGiven={likesGiven} chats={chats} currentUser={currentUser} />
        {!currentUser.is_premium && <PremiumCTA />}
      </div>
    </div>
  );
}
