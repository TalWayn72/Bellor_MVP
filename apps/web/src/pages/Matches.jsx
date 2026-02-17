import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { likeService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Heart, Sparkles } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CardsSkeleton, EmptyState } from '@/components/states';
import { getDemoLikes } from '@/data/demoData';
import MatchCard from '@/components/matches/MatchCard';

export default function Matches() {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('romantic');

  const { data: romanticInterest = [] } = useQuery({
    queryKey: ['romanticInterest', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      try {
        const result = await likeService.getReceivedLikes({ likeType: 'ROMANTIC' });
        const likes = result.likes || [];
        return likes.length > 0 ? likes : getDemoLikes('romantic', currentUser?.id);
      } catch {
        return getDemoLikes('romantic', currentUser?.id);
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
        return likes.length > 0 ? likes : getDemoLikes('positive', currentUser?.id);
      } catch {
        return getDemoLikes('positive', currentUser?.id);
      }
    },
    enabled: !!currentUser,
  });

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
                    <MatchCard key={like.id} like={like} type="romantic" />
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
                    <MatchCard key={like.id} like={like} type="positive" />
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
