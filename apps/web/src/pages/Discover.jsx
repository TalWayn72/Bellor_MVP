import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, likeService } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SlidersHorizontal, Star } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CardsSkeleton } from '@/components/states';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { getDemoProfiles } from '@/data/demoData';
import DiscoverCard from '@/components/discover/DiscoverCard';
import DiscoverFilters from '@/components/discover/DiscoverFilters';

export default function Discover() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isLoading } = useCurrentUser();
  const [filters, setFilters] = useState({
    minAge: 18, maxAge: 100, distance: 50, gender: 'all',
    location: '', interests: [], lookingFor: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showSuperLikeModal, setShowSuperLikeModal] = useState(false);
  const [superLikeUser, setSuperLikeUser] = useState(null);
  const [superLikeMessage, setSuperLikeMessage] = useState('');
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);

  const { data: profiles = [] } = useQuery({
    queryKey: ['discover', currentUser?.id, filters],
    queryFn: async () => {
      if (!currentUser) return getDemoProfiles();
      try {
        const result = await userService.searchUsers({ limit: 50 });
        const allUsers = result.users || [];
        const realProfiles = allUsers.filter(user => user.id !== currentUser.id && user.onboarding_completed);
        return realProfiles.length > 0 ? realProfiles : getDemoProfiles();
      } catch (error) {
        console.error('Error fetching profiles:', error);
        return getDemoProfiles();
      }
    },
    enabled: !!currentUser,
  });

  const currentProfile = profiles[currentProfileIndex];

  const handleLike = async () => {
    if (!currentProfile) return;
    try {
      const result = await likeService.likeUser(currentProfile.id, 'ROMANTIC');
      if (result.isMatch) alert('It\'s a match!');
      setCurrentProfileIndex(currentProfileIndex + 1);
    } catch (error) {
      console.error('Error liking profile:', error);
    }
  };

  const handlePass = () => setCurrentProfileIndex(currentProfileIndex + 1);

  const superLikeMutation = useMutation({
    mutationFn: async ({ targetUserId }) => {
      await likeService.likeUser(targetUserId, 'SUPER');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superLikes'] });
      setShowSuperLikeModal(false);
      setSuperLikeMessage('');
      setCurrentProfileIndex(currentProfileIndex + 1);
      alert('Super Like sent!');
    },
  });

  if (isLoading) return <CardsSkeleton count={4} />;

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <Button variant="ghost" size="icon" onClick={() => setShowFilters(true)}>
              <SlidersHorizontal className="w-6 h-6" />
            </Button>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Discover</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {currentProfile ? (
          <DiscoverCard
            profile={currentProfile}
            onLike={handleLike}
            onPass={handlePass}
            onSuperLike={() => { setSuperLikeUser(currentProfile); setShowSuperLikeModal(true); }}
          />
        ) : (
          <Card className="p-8 text-center">
            <h3 className="font-semibold text-lg text-foreground mb-2">No more profiles</h3>
            <p className="text-sm text-muted-foreground mb-6">Check back later for new matches</p>
            <Button onClick={() => setCurrentProfileIndex(0)}>Start Over</Button>
          </Card>
        )}
      </div>

      {showFilters && (
        <DiscoverFilters filters={filters} setFilters={setFilters} onClose={() => setShowFilters(false)} />
      )}

      {/* Super Like Modal */}
      {showSuperLikeModal && superLikeUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowSuperLikeModal(false)}>
          <div className="bg-card w-full rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-superlike to-primary flex items-center justify-center mx-auto mb-3">
                <Star className="w-8 h-8 text-white fill-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Send Super Like</h2>
              <p className="text-sm text-muted-foreground">Stand out and send a message with your super like to {superLikeUser.nickname}</p>
            </div>
            <Textarea value={superLikeMessage} onChange={(e) => setSuperLikeMessage(e.target.value)} placeholder="Write a message (optional)..." className="mb-4 h-24 resize-none" />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setShowSuperLikeModal(false); setSuperLikeMessage(''); }} className="flex-1">Cancel</Button>
              <Button onClick={() => superLikeMutation.mutate({ targetUserId: superLikeUser.id, message: superLikeMessage })} disabled={superLikeMutation.isPending} className="flex-1 bg-gradient-to-r from-superlike to-info">Send Super Like</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
