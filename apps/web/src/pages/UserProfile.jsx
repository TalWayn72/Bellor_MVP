import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userService, responseService, likeService, followService, chatService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Heart, X, MessageCircle, Star } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { ProfileSkeleton } from '@/components/states';
import { createPageUrl, transformUser } from '@/utils';
import { useCurrentUser } from '@/components/hooks/useCurrentUser';
import UserProfileHeader from '@/components/profile/UserProfileHeader';
import UserProfileAbout from '@/components/profile/UserProfileAbout';
import UserProfileBook from '@/components/profile/UserProfileBook';
import { useToast } from '@/components/ui/use-toast';

export default function UserProfile() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('about');
  const { currentUser, isLoading } = useCurrentUser();
  const [isLiked, setIsLiked] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);

  useEffect(() => {
    if (!userId || userId === 'undefined' || userId === 'null') navigate(createPageUrl('SharedSpace'), { replace: true });
  }, [userId, navigate]);

  useEffect(() => {
    if (!currentUser || !userId) return;
    let isMounted = true;
    likeService.checkLiked(userId).then(r => { if (isMounted) setIsLiked(r.liked); }).catch(() => {});
    return () => { isMounted = false; };
  }, [currentUser, userId]);

  const { data: viewedUser } = useQuery({
    queryKey: ['viewedUser', userId],
    queryFn: async () => {
      if (!userId) return null;
      try {
        const result = await userService.getUserById(userId);
        const user = result?.user || result;
        return user ? transformUser(user) : null;
      } catch { return null; }
    },
    enabled: !!userId && userId !== 'undefined',
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['userResponses', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        const result = await responseService.getUserResponses(userId, { limit: 10 });
        return result.responses || [];
      } catch { return []; }
    },
    enabled: !!userId && userId !== 'undefined',
  });

  const { data: followersCount = 0 } = useQuery({
    queryKey: ['followersCount', userId],
    queryFn: async () => { const r = await followService.getUserFollowers(userId); return r.pagination?.total || 0; },
    enabled: !!userId && userId !== 'undefined',
  });

  const { data: followingCount = 0 } = useQuery({
    queryKey: ['followingCount', userId],
    queryFn: async () => { const r = await followService.getUserFollowing(userId); return r.pagination?.total || 0; },
    enabled: !!userId && userId !== 'undefined',
  });

  const tabs = [{ id: 'about', label: 'About' }, { id: 'book', label: 'Book' }];

  const handleLike = async (type) => {
    try { await likeService.likeUser(userId, type); toast({ title: 'Success', description: type === 'ROMANTIC' ? '\u05d4\u05e8\u05d0\u05ea \u05e2\u05e0\u05d9\u05d9\u05df \u05e8\u05d5\u05de\u05e0\u05d8\u05d9!' : '\u05e0\u05ea\u05ea \u05e4\u05d9\u05d3\u05d1\u05e7 \u05d7\u05d9\u05d5\u05d1\u05d9!' }); } catch { /* Ignore */ }
  };

  const handleOpenChat = async () => {
    if (isSendingChat) return;
    setIsSendingChat(true);
    try { const r = await chatService.createOrGetChat(userId); navigate(createPageUrl('PrivateChat') + `?chatId=${r.chat.id}&userId=${userId}`); }
    catch { toast({ title: 'Error', description: 'Error opening chat', variant: 'destructive' }); }
    finally { setIsSendingChat(false); }
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
          <Button onClick={() => handleLike('ROMANTIC')} variant="love" size="xl" className="flex-1 gap-2">
            <Heart className="w-5 h-5" />{'\u05e2\u05e0\u05d9\u05d9\u05df \u05e8\u05d5\u05de\u05e0\u05d8\u05d9'}
          </Button>
          <Button onClick={() => handleLike('POSITIVE')} variant="premium" size="xl" className="flex-1 gap-2">
            <Star className="w-5 h-5" />{'\u05e4\u05d9\u05d3\u05d1\u05e7 \u05d7\u05d9\u05d5\u05d1\u05d9'}
          </Button>
          <Button onClick={handleOpenChat} disabled={isSendingChat} variant="outline" size="icon-lg" className="rounded-full border-info text-info hover:bg-info/10">
            <MessageCircle className="w-6 h-6" />
          </Button>
        </div>
      </div>

    </div>
  );
}
