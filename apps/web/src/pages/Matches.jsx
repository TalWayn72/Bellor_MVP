import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, likeService, chatService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Heart, Sparkles } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CardsSkeleton, EmptyState } from '@/components/states';

function UserCard({ userId }) {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await userService.getUserById(userId);
        if (result.user) {
          setUser(result.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, [userId]);

  return (
    <img
      src={user?.profile_images?.[0] || `https://i.pravatar.cc/300?u=${userId}`}
      alt="User"
      className="w-full h-full object-cover"
    />
  );
}

function UserInfo({ userId, type }) {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await userService.getUserById(userId);
        if (result.user) {
          setUser(result.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, [userId]);

  return (
    <div>
      <h3 className="text-white font-semibold text-sm">{user?.nickname || 'User'}</h3>
      <p className="text-white/80 text-xs">
        {type === 'romantic' ? 'Showed romantic interest' : 'Gave positive feedback'}
      </p>
    </div>
  );
}

export default function Matches() {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('romantic');
  const [filterType, setFilterType] = useState('all');

  const getDemoLikes = (type) => [
    {
      id: `demo-${type}-1`,
      user_id: `demo-match-user-1-${type}`,
      liked_user_id: currentUser?.id,
      like_type: type,
      created_date: new Date().toISOString()
    }
  ];

  const { data: romanticInterest = [] } = useQuery({
    queryKey: ['romanticInterest', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      try {
        const result = await likeService.getReceivedLikes({ likeType: 'ROMANTIC' });
        const likes = result.likes || [];
        return likes.length > 0 ? likes : getDemoLikes('romantic');
      } catch (error) {
        return getDemoLikes('romantic');
      }
    },
    enabled: !!currentUser,
  });

  const { data: positiveFeedback = [] } = useQuery({
    queryKey: ['positiveFeedback', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      try {
        const result = await likeService.getReceivedLikes({ likeType: 'POSITIVE' });
        const likes = result.likes || [];
        return likes.length > 0 ? likes : getDemoLikes('positive');
      } catch (error) {
        return getDemoLikes('positive');
      }
    },
    enabled: !!currentUser,
  });

  const startChat = async (matchUserId) => {
    try {
      const result = await chatService.createOrGetChat(matchUserId);
      const chatId = result.chat.id;
      navigate(createPageUrl(`PrivateChat?id=${chatId}&userId=${matchUserId}`));
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <CardsSkeleton count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <div className="w-6"></div>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Interest</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-card border-b border-border sticky top-[57px] z-10">
            <TabsList variant="underline" className="w-full grid grid-cols-2 h-14 bg-transparent">
              <TabsTrigger value="romantic" className="data-[state=active]:text-love">
                <Heart className="w-4 h-4 mr-1" />
                Romantic ({romanticInterest.length})
              </TabsTrigger>
              <TabsTrigger value="positive" className="data-[state=active]:text-superlike">
                <Sparkles className="w-4 h-4 mr-1" />
                Positive ({positiveFeedback.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content */}
          <div className="p-4">
            <TabsContent value="romantic" className="mt-0">
              <div className="grid grid-cols-2 gap-4">
                {romanticInterest.length === 0 ? (
                  <div className="col-span-2">
                    <EmptyState
                      variant="matches"
                      title="No romantic interest yet"
                      description="People who are romantically interested in you will appear here. Keep sharing and connecting!"
                      actionLabel="Explore Feed"
                      onAction={() => navigate(createPageUrl('SharedSpace'))}
                    />
                  </div>
                ) : (
                  romanticInterest.map((like) => (
                    <Card key={like.id} variant="interactive" className="overflow-hidden">
                      <button
                        onClick={() => navigate(createPageUrl(`UserProfile?id=${like.user_id}`))}
                        className="w-full"
                      >
                        <div className="relative aspect-[3/4]">
                          <UserCard userId={like.user_id} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute top-3 right-3">
                            <div className="w-10 h-10 rounded-full bg-love flex items-center justify-center shadow-lg">
                              <Heart className="w-5 h-5 text-white fill-white" />
                            </div>
                          </div>
                          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                            <UserInfo userId={like.user_id} type="romantic" />
                            <Button
                              variant="glass"
                              size="sm"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await likeService.likeUser(like.user_id, 'ROMANTIC');
                                  alert('You sent romantic interest back!');
                                } catch (error) {
                                  console.error('Error:', error);
                                }
                              }}
                              className="text-love"
                            >
                              Reply ❤️
                            </Button>
                          </div>
                        </div>
                      </button>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="positive" className="mt-0">
              <div className="grid grid-cols-2 gap-4">
                {positiveFeedback.length === 0 ? (
                  <div className="col-span-2">
                    <EmptyState
                      variant="achievements"
                      title="No positive feedback yet"
                      description="People who gave you positive feedback will appear here. Share content to receive feedback!"
                      actionLabel="Explore Feed"
                      onAction={() => navigate(createPageUrl('SharedSpace'))}
                    />
                  </div>
                ) : (
                  positiveFeedback.map((like) => (
                    <Card key={like.id} variant="interactive" className="overflow-hidden">
                      <button
                        onClick={() => navigate(createPageUrl(`UserProfile?id=${like.user_id}`))}
                        className="w-full"
                      >
                        <div className="relative aspect-[3/4]">
                          <UserCard userId={like.user_id} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute top-3 right-3">
                            <div className="w-10 h-10 rounded-full bg-superlike flex items-center justify-center shadow-lg">
                              <Sparkles className="w-5 h-5 text-white fill-white" />
                            </div>
                          </div>
                          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                            <UserInfo userId={like.user_id} type="positive" />
                            <Button
                              variant="glass"
                              size="sm"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await likeService.likeUser(like.user_id, 'POSITIVE');
                                  alert('You sent positive feedback back!');
                                } catch (error) {
                                  console.error('Error:', error);
                                }
                              }}
                              className="text-superlike"
                            >
                              Reply ⭐
                            </Button>
                          </div>
                        </div>
                      </button>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
