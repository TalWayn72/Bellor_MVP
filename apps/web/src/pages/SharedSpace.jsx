import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { missionService, responseService, followService, chatService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { getDemoResponses, getDemoChatUsers } from '@/data/demoData';
import { Menu, Bell, Heart, X } from 'lucide-react';
import { createPageUrl } from '@/utils';
import FeedPost from '../components/feed/FeedPost';
import TemporaryChatRequestDialog from '../components/chat/TemporaryChatRequestDialog';
import DrawerMenu from '../components/navigation/DrawerMenu';
import NotificationBadge from '../components/notifications/NotificationBadge';
import DailyTaskSelector from '../components/feed/DailyTaskSelector';
import TutorialOverlay from '../components/onboarding/TutorialOverlay';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { useTheme } from '../components/providers/ThemeProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback, AvatarStatus } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FeedSkeleton, EmptyState } from '@/components/states';

export default function SharedSpace() {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();
  const theme = useTheme();
  const [chatRequestUser, setChatRequestUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);
  const [selectedHashtag, setSelectedHashtag] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);

  // Check URL params to open task selector
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openTaskSelector') === 'true') {
      // Set state first
      setIsTaskSelectorOpen(true);
      // Clean URL after a short delay
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      const hasSeenTutorial = localStorage.getItem(`tutorial_seen_${currentUser.id}`);
      if (!hasSeenTutorial) {
        setShowTutorial(true);
      }
    }
  }, [currentUser]);

  const { data: todayMission } = useQuery({
    queryKey: ['todayMission'],
    queryFn: async () => {
      try {
        // Try to get today's mission from the API
        const result = await missionService.getTodaysMission();
        if (result.data) {
          return result.data;
        }
      } catch (error) {
        console.error('Error fetching today mission:', error);
      }

      // Fallback to listing missions
      try {
        const today = new Date().toISOString().split('T')[0];
        const listResult = await missionService.listMissions({ date: today, isActive: true });
        if (listResult.data && listResult.data.length > 0) {
          return listResult.data[0];
        }
      } catch (error) {
        console.error('Error listing missions:', error);
      }

      return null;
    },
  });

  const { data: followingList = [] } = useQuery({
    queryKey: ['myFollowing', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      try {
        const result = await followService.getMyFollowing();
        // Backend returns { following: [userId1, userId2, ...] } - array of IDs
        return result?.following || [];
      } catch (error) {
        console.error('Error fetching following list:', error);
        return [];
      }
    },
    enabled: !!currentUser,
  });

  const { data: allResponses = [] } = useQuery({
    queryKey: ['responses'],
    queryFn: async () => {
      try {
        const result = await responseService.listResponses({ isPublic: true, limit: 100 });
        const responses = result.data || [];
        // Return demo data if no real responses
        return responses.length > 0 ? responses : getDemoResponses();
      } catch (error) {
        console.error('Error fetching responses:', error);
        return getDemoResponses();
      }
    },
    enabled: true,
  });

  const { data: userTodayResponse } = useQuery({
    queryKey: ['userTodayResponse', currentUser?.id, todayMission?.id],
    queryFn: async () => {
      if (!currentUser || !todayMission) return null;
      const result = await responseService.getMyResponses({ missionId: todayMission.id });
      const responses = result.data || [];
      return responses.length > 0 ? responses[0] : null;
    },
    enabled: !!currentUser && !!todayMission,
  });

  const { data: chats = [] } = useQuery({
    queryKey: ['chats', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      const result = await chatService.getChats({ limit: 6 });
      return result.chats || [];
    },
    enabled: !!currentUser,
  });

  const activeChatUsers = React.useMemo(() => {
    if (!currentUser) return getDemoChatUsers();

    if (!chats.length) return getDemoChatUsers();

    return chats.slice(0, 7).map(chat => ({
      chatId: chat.id,
      userId: chat.otherUser?.id,
      name: chat.otherUser?.first_name,
      image: chat.otherUser?.profile_images?.[0],
      isOnline: false
    }));
  }, [chats, currentUser]);

  let responses = allResponses;
  if (selectedHashtag) {
    responses = responses.filter(r =>
      r.hashtags?.includes(selectedHashtag) ||
      r.text_content?.toLowerCase().includes(selectedHashtag.toLowerCase())
    );
  }

  const handleSendChatRequest = async () => {
    if (!chatRequestUser) return;

    // Don't try to create chats with demo users or invalid users
    if (!chatRequestUser.id || chatRequestUser.id.startsWith('demo-')) {
      console.log('Demo or invalid user - chat request simulated');
      setChatRequestUser(null);
      return;
    }

    try {
      await chatService.createOrGetChat(chatRequestUser.id);
      setChatRequestUser(null);
    } catch (error) {
      console.error('Error sending chat request:', error);
    }
  };

  // Removed auth check - no redirects

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <FeedSkeleton count={3} />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }



  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDrawerOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Shared Space</h1>
          </div>

          <div className="min-w-[24px]">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl('Notifications'))}
              className="relative"
            >
              <Bell className="w-5 h-5" />
              <NotificationBadge userId={currentUser?.id} />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto pb-24">
        <Card className="mx-0 rounded-none border-x-0">
          <CardContent className="px-4 py-2">
            {activeChatUsers.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                {activeChatUsers.map((user) => (
                  <button
                    key={user.chatId}
                    onClick={() => navigate(createPageUrl(`UserProfile?id=${user.userId}`))}
                    className="flex-shrink-0"
                  >
                    <div className="relative">
                      <Avatar size="lg" className="border-2 border-background hover:border-border transition-colors">
                        <AvatarImage
                          src={user.image || `https://i.pravatar.cc/150?u=${user.userId}`}
                          alt={user.name}
                        />
                        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {user.isOnline && <AvatarStatus status="online" size="lg" />}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground">התחברויות שלך יופיעו כאן</p>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedHashtag && (
          <Card className="mx-4 mt-2">
            <CardContent className="p-2">
              <div className="flex items-center gap-2">
                <Badge variant="info" size="lg" className="gap-2">
                  <span className="font-medium">{selectedHashtag}</span>
                  <button
                    onClick={() => setSelectedHashtag(null)}
                    className="hover:opacity-70 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {todayMission && (
          <Card variant="glass" className="mx-4 sticky top-16 z-10 bg-gradient-to-br from-gray-900 to-gray-800 border-0 rounded-3xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Avatar size="sm" className="bg-white/20">
                  <AvatarFallback className="bg-transparent text-white">
                    {userTodayResponse ? (
                      <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-base font-bold text-white">Daily Task</h2>
                <div className="ml-auto">
                  {userTodayResponse ? (
                    <Badge variant="success" size="sm">✓ שותף</Badge>
                  ) : (
                    <Badge variant="warning-soft" size="sm" className="gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      עד חצות
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-white/90 leading-relaxed mb-3">
                {todayMission?.question || "שתף משהו מעניין על עצמך היום"}
              </p>
              <Button
                onClick={() => setIsTaskSelectorOpen(true)}
                variant="secondary"
                size="lg"
                className="w-full bg-white text-gray-800 border border-gray-200 hover:bg-gray-100"
              >
                {userTodayResponse ? 'שתף תגובה נוספת' : 'שתף עכשיו'}
              </Button>
            </CardContent>
          </Card>
        )}

        <div
          className="snap-y snap-mandatory overflow-y-scroll h-[calc(100vh-240px)]"
          style={{ scrollBehavior: 'smooth' }}
        >
          {responses.length === 0 ? (
            <div className="h-[calc(100vh-240px)] flex items-center justify-center px-4">
              <EmptyState
                variant="feed"
                title="No posts yet"
                description="Be the first to share something! Complete the daily task above."
                actionLabel="Share now"
                onAction={() => setIsTaskSelectorOpen(true)}
              />
            </div>
          ) : (
            responses.map((response) => (
              <div
                key={response.id}
                className="snap-start h-[calc(100vh-240px)] flex items-center px-4"
                style={{ paddingBottom: '11pt' }}
              >
                <FeedPost
                  response={response}
                  currentUser={currentUser}
                  theme={theme}
                  onChatRequest={(user) => setChatRequestUser(user)}
                  onHashtagClick={(hashtag) => setSelectedHashtag(hashtag)}
                />
              </div>
            ))
          )}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-around">
          <button
            onClick={() => navigate(createPageUrl('SharedSpace'))}
            className="flex flex-col items-center gap-1 text-primary"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-xs">פיד</span>
          </button>

          <button
            onClick={() => navigate(createPageUrl('TemporaryChats'))}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs">צ׳אטים</span>
          </button>

          <button
            onClick={() => navigate(createPageUrl('Matches'))}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-love transition-colors"
          >
            <Heart className="w-7 h-7" />
            <span className="text-xs">עניין</span>
          </button>

          <button
            onClick={() => navigate(createPageUrl('Profile'))}
            className="flex flex-col items-center gap-1"
          >
            <Avatar size="sm" className="border-2 border-border">
              <AvatarImage
                src={currentUser.main_profile_image_url || currentUser.profile_images?.[0] || `https://i.pravatar.cc/150?u=${currentUser.id}`}
                alt="Profile"
              />
              <AvatarFallback>{currentUser.nickname?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">פרופיל</span>
          </button>
        </div>
      </nav>

      <TemporaryChatRequestDialog
        user={chatRequestUser}
        isOpen={!!chatRequestUser}
        onClose={() => setChatRequestUser(null)}
        onSend={handleSendChatRequest}
        currentUser={currentUser}
      />

      <DrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentUser={currentUser}
      />

      <DailyTaskSelector
        isOpen={isTaskSelectorOpen}
        onClose={() => setIsTaskSelectorOpen(false)}
        mission={todayMission}
      />

      <TutorialOverlay
        isOpen={showTutorial}
        onClose={() => {
          setShowTutorial(false);
          if (currentUser) {
            localStorage.setItem(`tutorial_seen_${currentUser.id}`, 'true');
          }
        }}
      />
    </div>
  );
}
