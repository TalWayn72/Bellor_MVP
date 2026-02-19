import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { chatService } from '@/api';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '@/components/hooks/useCurrentUser';
import { useTheme } from '@/components/providers/ThemeProvider';
import { FeedSkeleton } from '@/components/states';
import SharedSpaceHeader from '@/components/feed/SharedSpaceHeader';
import MissionCard from '@/components/feed/MissionCard';
import TemporaryChatRequestDialog from '@/components/chat/TemporaryChatRequestDialog';
import DrawerMenu from '@/components/navigation/DrawerMenu';
import DailyTaskSelector from '@/components/feed/DailyTaskSelector';
import TutorialOverlay from '@/components/onboarding/TutorialOverlay';
import { useSharedSpaceData } from './useSharedSpaceData';
import HashtagFilter from './HashtagFilter';
import FeedSection from './FeedSection';
import BottomNavigation from './BottomNavigation';

export default function SharedSpace() {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();
  const theme = useTheme();
  const [chatRequestUser, setChatRequestUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);
  const [selectedHashtag, setSelectedHashtag] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);

  const { todayMission, allResponses, userTodayResponse } = useSharedSpaceData(currentUser);

  const [urlSearchParams, setUrlSearchParams] = useSearchParams();

  React.useEffect(() => {
    if (urlSearchParams.get('openTaskSelector') === 'true') {
      setIsTaskSelectorOpen(true);
      const timer = setTimeout(() => { setUrlSearchParams({}, { replace: true }); }, 100);
      return () => clearTimeout(timer);
    }
  }, [urlSearchParams, setUrlSearchParams]);

  useEffect(() => {
    if (currentUser) {
      const hasSeenTutorial = localStorage.getItem(`tutorial_seen_${currentUser.id}`);
      if (!hasSeenTutorial) setShowTutorial(true);
    }
  }, [currentUser]);

  let responses = allResponses;
  if (selectedHashtag) {
    responses = responses.filter(r => r.hashtags?.includes(selectedHashtag) || r.text_content?.toLowerCase().includes(selectedHashtag.toLowerCase()));
  }

  const handleSendChatRequest = async () => {
    if (!chatRequestUser) return;
    if (!chatRequestUser.id || chatRequestUser.id.startsWith('demo-')) { setChatRequestUser(null); return; }
    try { const r = await chatService.createOrGetChat(chatRequestUser.id); setChatRequestUser(null); navigate(createPageUrl('PrivateChat') + `?chatId=${r.chat.id}&userId=${chatRequestUser.id}`); } catch {}
  };

  if (isLoading) return <div className="min-h-screen bg-background"><div className="max-w-2xl mx-auto px-4 py-6"><FeedSkeleton count={3} /></div></div>;
  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <SharedSpaceHeader currentUser={currentUser} onOpenDrawer={() => setIsDrawerOpen(true)} onNavigate={navigate} />
      <div className="max-w-2xl mx-auto pb-24">
        <HashtagFilter selectedHashtag={selectedHashtag} onClear={() => setSelectedHashtag(null)} />
        <MissionCard todayMission={todayMission} userTodayResponse={userTodayResponse} onOpenTaskSelector={() => setIsTaskSelectorOpen(true)} />
        <FeedSection responses={responses} currentUser={currentUser} theme={theme} onChatRequest={(user) => setChatRequestUser(user)} onHashtagClick={(hashtag) => setSelectedHashtag(hashtag)} onOpenTaskSelector={() => setIsTaskSelectorOpen(true)} />
      </div>
      <BottomNavigation currentUser={currentUser} onNavigate={navigate} />
      <TemporaryChatRequestDialog user={chatRequestUser} isOpen={!!chatRequestUser} onClose={() => setChatRequestUser(null)} onSend={handleSendChatRequest} currentUser={currentUser} />
      <DrawerMenu isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} currentUser={currentUser} />
      <DailyTaskSelector isOpen={isTaskSelectorOpen} onClose={() => setIsTaskSelectorOpen(false)} mission={todayMission} />
      <TutorialOverlay isOpen={showTutorial} onClose={() => { setShowTutorial(false); if (currentUser) localStorage.setItem(`tutorial_seen_${currentUser.id}`, 'true'); }} />
    </div>
  );
}
