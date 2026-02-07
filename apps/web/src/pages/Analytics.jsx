import React from 'react';
import { useNavigate } from 'react-router-dom';
import { likeService, responseService, chatService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Eye, Heart, MessageCircle, TrendingUp, Users } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardsSkeleton } from '@/components/states';
import { getDemoLikes, getDemoResponses, getDemoChatUsers } from '@/data/demoData';

export default function Analytics() {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();

  const { data: likesReceived = [] } = useQuery({
    queryKey: ['likesReceived', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return getDemoLikes('romantic', currentUser?.id);
      try {
        const result = await likeService.getReceivedLikes();
        const likes = result.likes || [];
        return likes.length > 0 ? likes : getDemoLikes('romantic', currentUser?.id);
      } catch {
        return getDemoLikes('romantic', currentUser?.id);
      }
    },
    enabled: !!currentUser,
  });

  const { data: likesGiven = [] } = useQuery({
    queryKey: ['likesGiven', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      try {
        const result = await likeService.getSentLikes();
        return result.likes || [];
      } catch {
        return [];
      }
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
      } catch {
        return getDemoResponses();
      }
    },
    enabled: !!currentUser,
  });

  const { data: chats = [] } = useQuery({
    queryKey: ['userChats', currentUser?.id],
    queryFn: async () => {
      // Convert demo chat users to chat format for counting
      const demoChatData = getDemoChatUsers().map(u => ({ id: u.chatId, status: 'active' }));
      if (!currentUser) return demoChatData;
      try {
        const result = await chatService.getChats();
        const dbChats = result.chats || [];
        return dbChats.length > 0 ? dbChats : demoChatData;
      } catch {
        return demoChatData;
      }
    },
    enabled: !!currentUser,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
            <div className="min-w-[24px]"></div>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-foreground">Your Insights</h1>
            </div>
            <div className="min-w-[24px]"></div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <CardsSkeleton count={5} columns={2} />
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon: Heart,
      label: 'Likes Received',
      value: likesReceived.length,
      color: 'text-love',
      bg: 'bg-love/10'
    },
    {
      icon: TrendingUp,
      label: 'Likes Given',
      value: likesGiven.length,
      color: 'text-info',
      bg: 'bg-info/10'
    },
    {
      icon: MessageCircle,
      label: 'Active Chats',
      value: chats.filter(c => c.status === 'active').length,
      color: 'text-success',
      bg: 'bg-success/10'
    },
    {
      icon: Eye,
      label: 'Profile Views',
      value: currentUser.profile_views || 0,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      icon: Users,
      label: 'Total Responses',
      value: responses.length,
      color: 'text-warning',
      bg: 'bg-warning/10'
    }
  ];

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Header */}
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <div className="w-6"></div>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Your Insights</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/Profile" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((stat, idx) => (
            <Card key={idx}>
              <CardContent className="p-5">
                <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity Summary */}
        <Card className="mb-4">
          <CardContent className="p-5">
            <h3 className="font-semibold text-base text-foreground mb-4">Activity Summary</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Match Rate</span>
                <span className="text-sm font-semibold text-foreground">
                  {likesGiven.length > 0
                    ? Math.round((likesReceived.length / likesGiven.length) * 100)
                    : 0}%
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Response Rate</span>
                <span className="text-sm font-semibold text-foreground">
                  {chats.length > 0
                    ? Math.round((chats.filter(c => c.last_message_at).length / chats.length) * 100)
                    : 0}%
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Member Since</span>
                <span className="text-sm font-semibold text-foreground">
                  {new Date(currentUser.created_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Premium Upgrade CTA */}
        {!currentUser.is_premium && (
          <Card className="bg-gradient-to-r from-primary to-match text-white">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-2">Unlock Premium Insights</h3>
              <p className="text-sm mb-4 opacity-90">
                See who liked you, get detailed analytics, and more
              </p>
              <Button
                onClick={() => navigate(createPageUrl('Premium'))}
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
              >
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
