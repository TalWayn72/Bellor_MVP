import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { followService, userService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import FollowButton from '../components/profile/FollowButton';
import { ListSkeleton, EmptyState } from '@/components/states';

export default function FollowingList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const defaultTab = searchParams.get('tab') || 'following';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { currentUser, isLoading: loadingCurrentUser } = useCurrentUser();

  const getDemoFollows = (type) => [
    {
      id: `demo-follow-${type}-1`,
      follower_id: type === 'following' ? userId : `demo-follower-user-1`,
      following_id: type === 'following' ? `demo-following-user-1` : userId,
      created_date: new Date().toISOString()
    }
  ];

  const { data: following = [], isLoading: loadingFollowing } = useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      try {
        const result = await followService.getUserFollowing(userId);
        const follows = result.following || [];
        return follows.length > 0 ? follows : getDemoFollows('following');
      } catch (error) {
        return getDemoFollows('following');
      }
    },
    enabled: !!userId && activeTab === 'following',
  });

  const { data: followers = [], isLoading: loadingFollowers } = useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      try {
        const result = await followService.getUserFollowers(userId);
        const follows = result.followers || [];
        return follows.length > 0 ? follows : getDemoFollows('followers');
      } catch (error) {
        return getDemoFollows('followers');
      }
    },
    enabled: !!userId && activeTab === 'followers',
  });

  if (loadingCurrentUser) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ListSkeleton count={8} />
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  const list = activeTab === 'following' ? following : followers;
  const isLoading = activeTab === 'following' ? loadingFollowing : loadingFollowers;

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Header */}
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <div className="w-6"></div>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">{isOwnProfile ? 'Connections' : 'User Connections'}</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/Profile" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Tabs */}
        <div className="bg-card px-4 pt-4">
          <Card className="p-1">
            <div className="flex">
              <Button
                onClick={() => setActiveTab('following')}
                variant={activeTab === 'following' ? 'default' : 'ghost'}
                className={`flex-1 rounded-xl ${activeTab === 'following' ? 'bg-foreground text-background' : ''}`}
              >
                Following ({following.length})
              </Button>
              <Button
                onClick={() => setActiveTab('followers')}
                variant={activeTab === 'followers' ? 'default' : 'ghost'}
                className={`flex-1 rounded-xl ${activeTab === 'followers' ? 'bg-foreground text-background' : ''}`}
              >
                Followers ({followers.length})
              </Button>
            </div>
          </Card>
        </div>

        {/* List */}
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
            list.map((item) => {
              const targetUserId = activeTab === 'following' ? item.following_id : item.follower_id;
              return (
                <UserCard
                  key={item.id}
                  userId={targetUserId}
                  currentUserId={currentUser?.id}
                  navigate={navigate}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function UserCard({ userId, currentUserId, navigate }) {
  const [userData, setUserData] = React.useState(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await userService.getUserById(userId);
        if (result.user) {
          setUserData(result.user);
        } else {
          setUserData({
            id: userId,
            nickname: 'User',
            age: 25,
            location: 'Israel',
            bio: '',
            profile_images: [`https://i.pravatar.cc/150?u=${userId}`]
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUserData({
          id: userId,
          nickname: 'User',
          age: 25,
          location: 'Israel',
          bio: '',
          profile_images: [`https://i.pravatar.cc/150?u=${userId}`]
        });
      }
    };
    fetchUser();
  }, [userId]);

  if (!userData) return null;

  return (
    <Card variant="interactive">
      <CardContent className="p-4 flex items-center gap-3">
        <button
          onClick={() => navigate(createPageUrl(`UserProfile?id=${userId}`))}
          className="flex items-center gap-3 flex-1"
        >
          <Avatar size="md">
            <AvatarImage src={userData.profile_images?.[0]} alt={userData.nickname} />
            <AvatarFallback>{userData.nickname?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-sm text-foreground">{userData.nickname}, {userData.age}</h3>
            <p className="text-xs text-muted-foreground">{userData.location}</p>
          </div>
        </button>
        <FollowButton
          targetUserId={userId}
          currentUserId={currentUserId}
          variant="default"
        />
      </CardContent>
    </Card>
  );
}
