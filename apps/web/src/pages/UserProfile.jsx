import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userService, responseService, likeService, followService, chatService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Heart, X, MessageCircle, Star } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ProfileSkeleton } from '@/components/states';
import { createPageUrl, transformUser } from '@/utils';
import { useCurrentUser } from '@/components/hooks/useCurrentUser';
import UserProfileHeader from '@/components/profile/UserProfileHeader';
import UserProfileAbout from '@/components/profile/UserProfileAbout';
import UserProfileBook from '@/components/profile/UserProfileBook';

export default function UserProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('about');
  const { currentUser, isLoading } = useCurrentUser();
  const [isLiked, setIsLiked] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  useEffect(() => {
    const checkLiked = async () => {
      if (currentUser && userId) {
        try {
          const result = await likeService.checkLiked(userId);
          setIsLiked(result.liked);
        } catch (error) { /* Ignore */ }
      }
    };
    checkLiked();
  }, [currentUser, userId]);

  const { data: viewedUser } = useQuery({
    queryKey: ['viewedUser', userId],
    queryFn: async () => {
      if (!userId) return null;
      try {
        const result = await userService.getUserById(userId);
        const user = result?.user || result;
        return user ? transformUser(user) : null;
      } catch (error) { return null; }
    },
    enabled: !!userId,
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['userResponses', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        const result = await responseService.getUserResponses(userId, { limit: 10 });
        return result.responses || [];
      } catch (error) { return []; }
    },
    enabled: !!userId,
  });

  const { data: followersCount = 0 } = useQuery({
    queryKey: ['followersCount', userId],
    queryFn: async () => { const r = await followService.getUserFollowers(userId); return r.pagination?.total || 0; },
    enabled: !!userId,
  });

  const { data: followingCount = 0 } = useQuery({
    queryKey: ['followingCount', userId],
    queryFn: async () => { const r = await followService.getUserFollowing(userId); return r.pagination?.total || 0; },
    enabled: !!userId,
  });

  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'book', label: 'Book' },
  ];

  const handleSendMessage = async (message) => {
    try {
      const result = await chatService.createOrGetChat(userId);
      await chatService.sendMessage(result.chat.id, { content: message, type: 'text' });
      setShowMessageDialog(false);
      alert('Message sent successfully!');
    } catch (error) {
      alert('Error sending message');
    }
  };

  if (isLoading || !viewedUser) return <ProfileSkeleton />;

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]"><div className="w-6"></div></div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">{viewedUser.nickname} &bull; {viewedUser.age}</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto pb-24">
        <UserProfileHeader
          viewedUser={viewedUser} userId={userId} currentUser={currentUser}
          isLiked={isLiked} followersCount={followersCount} followingCount={followingCount}
          activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs}
        />

        <div className="px-4 mt-4">
          {activeTab === 'about' && <UserProfileAbout viewedUser={viewedUser} responses={responses} />}
          {activeTab === 'book' && <UserProfileBook viewedUser={viewedUser} responses={responses} />}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto flex gap-3 items-center">
          <Button onClick={() => navigate(createPageUrl('SharedSpace'))} variant="outline" size="icon-lg" className="rounded-full">
            <X className="w-6 h-6" />
          </Button>
          <Button onClick={async () => { try { await likeService.likeUser(userId, 'ROMANTIC'); alert('\u05d4\u05e8\u05d0\u05ea \u05e2\u05e0\u05d9\u05d9\u05df \u05e8\u05d5\u05de\u05e0\u05d8\u05d9!'); } catch (e) {} }} variant="love" size="xl" className="flex-1 gap-2">
            <Heart className="w-5 h-5" />{'\u05e2\u05e0\u05d9\u05d9\u05df \u05e8\u05d5\u05de\u05e0\u05d8\u05d9'}
          </Button>
          <Button onClick={async () => { try { await likeService.likeUser(userId, 'POSITIVE'); alert('\u05e0\u05ea\u05ea \u05e4\u05d9\u05d3\u05d1\u05e7 \u05d7\u05d9\u05d5\u05d1\u05d9!'); } catch (e) {} }} variant="premium" size="xl" className="flex-1 gap-2">
            <Star className="w-5 h-5" />{'\u05e4\u05d9\u05d3\u05d1\u05e7 \u05d7\u05d9\u05d5\u05d1\u05d9'}
          </Button>
          <Button onClick={() => setShowMessageDialog(true)} variant="outline" size="icon-lg" className="rounded-full border-info text-info hover:bg-info/10">
            <MessageCircle className="w-6 h-6" />
          </Button>
        </div>
      </div>

      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-lg" aria-describedby="message-dialog-description">
          <DialogHeader>
            <DialogTitle>Send message to {viewedUser.nickname}</DialogTitle>
            <p id="message-dialog-description" className="text-sm text-muted-foreground">Write a private message to start a conversation</p>
          </DialogHeader>
          <textarea id="messageInput" placeholder="Write your message..." className="w-full h-32 border-2 border-input rounded-xl p-3 text-sm resize-none focus:border-primary focus:ring-primary" />
          <DialogFooter className="flex-row gap-3 sm:justify-end">
            <Button onClick={() => setShowMessageDialog(false)} variant="outline" size="lg" className="flex-1 sm:flex-none">Cancel</Button>
            <Button onClick={() => { const msg = document.getElementById('messageInput').value; if (msg.trim()) handleSendMessage(msg); }} size="lg" className="flex-1 sm:flex-none">Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
