import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { missionService, responseService, followService, chatService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { getDemoResponses, getDemoChatUsers } from '@/data/demoData';
import { Heart, X } from 'lucide-react';
import { createPageUrl } from '@/utils';
import FeedPost from '@/components/feed/FeedPost';
import TemporaryChatRequestDialog from '@/components/chat/TemporaryChatRequestDialog';
import DrawerMenu from '@/components/navigation/DrawerMenu';
import DailyTaskSelector from '@/components/feed/DailyTaskSelector';
import TutorialOverlay from '@/components/onboarding/TutorialOverlay';
import { useCurrentUser } from '@/components/hooks/useCurrentUser';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FeedSkeleton, EmptyState } from '@/components/states';
import SharedSpaceHeader from '@/components/feed/SharedSpaceHeader';
import ChatCarousel from '@/components/feed/ChatCarousel';
import MissionCard from '@/components/feed/MissionCard';

export default function SharedSpace() {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();
  const theme = useTheme();
  const [chatRequestUser, setChatRequestUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);
  const [selectedHashtag, setSelectedHashtag] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openTaskSelector') === 'true') {
      setIsTaskSelectorOpen(true);
      setTimeout(() => { window.history.replaceState({}, '', window.location.pathname); }, 100);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      const hasSeenTutorial = localStorage.getItem(`tutorial_seen_${currentUser.id}`);
      if (!hasSeenTutorial) setShowTutorial(true);
    }
  }, [currentUser]);

  const { data: todayMission } = useQuery({
    queryKey: ['todayMission'],
    queryFn: async () => {
      try { const r = await missionService.getTodaysMission(); if (r.data) return r.data; } catch {}
      try { const today = new Date().toISOString().split('T')[0]; const r = await missionService.listMissions({ date: today, isActive: true }); if (r.data?.length > 0) return r.data[0]; } catch {}
      return null;
    },
  });

  const { data: allResponses = [] } = useQuery({
    queryKey: ['responses'],
    queryFn: async () => {
      try { const r = await responseService.listResponses({ isPublic: true, limit: 100 }); const resp = r.data || []; return resp.length > 0 ? resp : getDemoResponses(); }
      catch { return getDemoResponses(); }
    },
  });

  const { data: userTodayResponse } = useQuery({
    queryKey: ['userTodayResponse', currentUser?.id, todayMission?.id],
    queryFn: async () => {
      if (!currentUser || !todayMission) return null;
      const r = await responseService.getMyResponses({ missionId: todayMission.id });
      const resp = r.data || [];
      return resp.length > 0 ? resp[0] : null;
    },
    enabled: !!currentUser && !!todayMission,
  });

  const { data: chats = [] } = useQuery({
    queryKey: ['chats', currentUser?.id],
    queryFn: async () => { if (!currentUser) return []; const r = await chatService.getChats({ limit: 6 }); return r.chats || []; },
    enabled: !!currentUser,
  });

  const activeChatUsers = React.useMemo(() => {
    if (!currentUser || !chats.length) return getDemoChatUsers();
    return chats.slice(0, 7).map(chat => ({
      chatId: chat.id, userId: chat.otherUser?.id, name: chat.otherUser?.first_name,
      image: chat.otherUser?.profile_images?.[0], isOnline: false,
    }));
  }, [chats, currentUser]);

  let responses = allResponses;
  if (selectedHashtag) {
    responses = responses.filter(r => r.hashtags?.includes(selectedHashtag) || r.text_content?.toLowerCase().includes(selectedHashtag.toLowerCase()));
  }

  const handleSendChatRequest = async () => {
    if (!chatRequestUser) return;
    if (!chatRequestUser.id || chatRequestUser.id.startsWith('demo-')) { setChatRequestUser(null); return; }
    try { await chatService.createOrGetChat(chatRequestUser.id); setChatRequestUser(null); } catch {}
  };

  if (isLoading) return <div className="min-h-screen bg-background"><div className="max-w-2xl mx-auto px-4 py-6"><FeedSkeleton count={3} /></div></div>;
  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <SharedSpaceHeader currentUser={currentUser} onOpenDrawer={() => setIsDrawerOpen(true)} onNavigate={navigate} />

      <div className="max-w-2xl mx-auto pb-24">
        <ChatCarousel activeChatUsers={activeChatUsers} onNavigate={navigate} />

        {selectedHashtag && (
          <Card className="mx-4 mt-2">
            <CardContent className="p-2">
              <div className="flex items-center gap-2">
                <Badge variant="info" size="lg" className="gap-2">
                  <span className="font-medium">{selectedHashtag}</span>
                  <button onClick={() => setSelectedHashtag(null)} className="hover:opacity-70 transition-opacity">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <MissionCard todayMission={todayMission} userTodayResponse={userTodayResponse} onOpenTaskSelector={() => setIsTaskSelectorOpen(true)} />

        <div className="snap-y snap-mandatory overflow-y-scroll h-[calc(100vh-240px)]" style={{ scrollBehavior: 'smooth' }}>
          {responses.length === 0 ? (
            <div className="h-[calc(100vh-240px)] flex items-center justify-center px-4">
              <EmptyState variant="feed" title="No posts yet" description="Be the first to share something! Complete the daily task above." actionLabel="Share now" onAction={() => setIsTaskSelectorOpen(true)} />
            </div>
          ) : (
            responses.map((response) => (
              <div key={response.id} className="snap-start h-[calc(100vh-240px)] flex items-center px-4" style={{ paddingBottom: '11pt' }}>
                <FeedPost response={response} currentUser={currentUser} theme={theme} onChatRequest={(user) => setChatRequestUser(user)} onHashtagClick={(hashtag) => setSelectedHashtag(hashtag)} />
              </div>
            ))
          )}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-around">
          <button onClick={() => navigate(createPageUrl('SharedSpace'))} className="flex flex-col items-center gap-1 text-primary">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            <span className="text-xs">{'\u05e4\u05d9\u05d3'}</span>
          </button>
          <button onClick={() => navigate(createPageUrl('TemporaryChats'))} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <span className="text-xs">{'\u05e6\u05f3\u05d0\u05d8\u05d9\u05dd'}</span>
          </button>
          <button onClick={() => navigate(createPageUrl('Matches'))} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-love transition-colors">
            <Heart className="w-7 h-7" /><span className="text-xs">{'\u05e2\u05e0\u05d9\u05d9\u05df'}</span>
          </button>
          <button onClick={() => navigate(createPageUrl('Profile'))} className="flex flex-col items-center gap-1">
            <Avatar size="sm" className="border-2 border-border">
              <AvatarImage src={currentUser.main_profile_image_url || currentUser.profile_images?.[0] || `https://i.pravatar.cc/150?u=${currentUser.id}`} alt="Profile" />
              <AvatarFallback>{currentUser.nickname?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{'\u05e4\u05e8\u05d5\u05e4\u05d9\u05dc'}</span>
          </button>
        </div>
      </nav>

      <TemporaryChatRequestDialog user={chatRequestUser} isOpen={!!chatRequestUser} onClose={() => setChatRequestUser(null)} onSend={handleSendChatRequest} currentUser={currentUser} />
      <DrawerMenu isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} currentUser={currentUser} />
      <DailyTaskSelector isOpen={isTaskSelectorOpen} onClose={() => setIsTaskSelectorOpen(false)} mission={todayMission} />
      <TutorialOverlay isOpen={showTutorial} onClose={() => { setShowTutorial(false); if (currentUser) localStorage.setItem(`tutorial_seen_${currentUser.id}`, 'true'); }} />
    </div>
  );
}
