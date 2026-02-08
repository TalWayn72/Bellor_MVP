import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { followService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { ListSkeleton } from '@/components/states';
import { getDemoFollows } from '@/data/demoData';
import FollowingCard from '@/components/profile/FollowingCard';

export default function FollowingList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const defaultTab = searchParams.get('tab') || 'following';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { currentUser, isLoading: loadingCurrentUser } = useCurrentUser();

  const { data: following = [], isLoading: loadingFollowing } = useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      try {
        const result = await followService.getUserFollowing(userId);
        const userIds = result?.following || [];
        return userIds.length > 0 ? userIds : getDemoFollows(userId, 'following');
      } catch { return getDemoFollows(userId, 'following'); }
    },
    enabled: !!userId && activeTab === 'following',
  });

  const { data: followers = [], isLoading: loadingFollowers } = useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      try {
        const result = await followService.getUserFollowers(userId);
        const userIds = result?.followers || [];
        return userIds.length > 0 ? userIds : getDemoFollows(userId, 'followers');
      } catch { return getDemoFollows(userId, 'followers'); }
    },
    enabled: !!userId && activeTab === 'followers',
  });

  if (loadingCurrentUser) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6"><ListSkeleton count={8} /></div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  const list = activeTab === 'following' ? following : followers;
  const isLoading = activeTab === 'following' ? loadingFollowing : loadingFollowers;

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]"><div className="w-6"></div></div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">{isOwnProfile ? 'Connections' : 'User Connections'}</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/Profile" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        <div className="bg-card px-4 pt-4">
          <Card className="p-1">
            <div className="flex">
              <Button onClick={() => setActiveTab('following')}
                variant={activeTab === 'following' ? 'default' : 'ghost'}
                className={`flex-1 rounded-xl ${activeTab === 'following' ? 'bg-foreground text-background' : ''}`}>
                Following ({following.length})
              </Button>
              <Button onClick={() => setActiveTab('followers')}
                variant={activeTab === 'followers' ? 'default' : 'ghost'}
                className={`flex-1 rounded-xl ${activeTab === 'followers' ? 'bg-foreground text-background' : ''}`}>
                Followers ({followers.length})
              </Button>
            </div>
          </Card>
        </div>

        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : list.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {activeTab === 'following' ? 'Not following anyone yet' : 'No followers yet'}
              </p>
            </Card>
          ) : (
            list.map((targetUserId) => (
              <FollowingCard key={targetUserId} userId={targetUserId} currentUserId={currentUser?.id} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
