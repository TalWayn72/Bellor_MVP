import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, likeService } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SlidersHorizontal, MapPin, Heart, X, Star } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CardsSkeleton } from '@/components/states';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { getDemoProfiles } from '@/data/demoData';

export default function Discover() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isLoading } = useCurrentUser();
  const [filters, setFilters] = useState({
    minAge: 18,
    maxAge: 100,
    distance: 50,
    gender: 'all',
    location: '',
    interests: [],
    lookingFor: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showSuperLikeModal, setShowSuperLikeModal] = useState(false);
  const [superLikeUser, setSuperLikeUser] = useState(null);
  const [superLikeMessage, setSuperLikeMessage] = useState('');
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);

  // getDemoProfiles from centralized demoData
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

      // Check if it's a match
      if (result.isMatch) {
        alert('🎉 It\'s a match!');
      }

      setCurrentProfileIndex(currentProfileIndex + 1);
    } catch (error) {
      console.error('Error liking profile:', error);
    }
  };

  const handlePass = () => {
    setCurrentProfileIndex(currentProfileIndex + 1);
  };

  const superLikeMutation = useMutation({
    mutationFn: async ({ targetUserId, message }) => {
      // Super like is implemented as a SUPER type like
      await likeService.likeUser(targetUserId, 'SUPER');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superLikes'] });
      setShowSuperLikeModal(false);
      setSuperLikeMessage('');
      setCurrentProfileIndex(currentProfileIndex + 1);
      alert('⭐ Super Like sent!');
    },
  });

  if (isLoading) {
    return <CardsSkeleton count={4} />;
  }

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Header */}
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
          <>
            {/* Profile Card */}
            <Card className="rounded-3xl overflow-hidden shadow-lg mb-6">
              <div className="relative" style={{ aspectRatio: '3/4' }}>
                <img
                  src={currentProfile.profile_images?.[0] || `https://i.pravatar.cc/600?u=${currentProfile.id}`}
                  alt={currentProfile.nickname}
                  className="w-full h-full object-cover"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h2 className="text-3xl font-bold mb-2">
                    {currentProfile.nickname}, {currentProfile.age}
                  </h2>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{currentProfile.location}</span>
                  </div>
                  <p className="text-sm opacity-90 mb-3">{currentProfile.bio}</p>
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.interests?.map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={handlePass}
                className="w-16 h-16 rounded-full bg-card shadow-lg flex items-center justify-center hover:scale-110 transition-transform border border-border"
              >
                <X className="w-8 h-8 text-muted-foreground" />
              </button>
              <button
                onClick={() => {
                  setSuperLikeUser(currentProfile);
                  setShowSuperLikeModal(true);
                }}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-superlike to-info shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
              >
                <Star className="w-7 h-7 text-white fill-white" />
              </button>
              <button
                onClick={() => navigate(createPageUrl(`UserProfile?id=${currentProfile.id}`))}
                className="w-14 h-14 rounded-full bg-card shadow-lg flex items-center justify-center hover:scale-110 transition-transform border border-border"
              >
                <span className="text-2xl">ℹ️</span>
              </button>
              <button
                onClick={handleLike}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-love to-destructive shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
              >
                <Heart className="w-8 h-8 text-white fill-white" />
              </button>
            </div>
          </>
        ) : (
          <Card className="p-8 text-center">
            <h3 className="font-semibold text-lg text-foreground mb-2">No more profiles</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Check back later for new matches
            </p>
            <Button onClick={() => setCurrentProfileIndex(0)}>
              Start Over
            </Button>
          </Card>
        )}
      </div>

      {/* Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowFilters(false)}>
          <div className="bg-card w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-foreground mb-6">Filters</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Age Range</label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={filters.minAge}
                    onChange={(e) => setFilters({ ...filters, minAge: parseInt(e.target.value) })}
                    className="w-20 px-3 py-2 border-2 border-border rounded-lg bg-background text-foreground"
                  />
                  <span className="text-foreground">-</span>
                  <input
                    type="number"
                    value={filters.maxAge}
                    onChange={(e) => setFilters({ ...filters, maxAge: parseInt(e.target.value) })}
                    className="w-20 px-3 py-2 border-2 border-border rounded-lg bg-background text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Distance: {filters.distance} km</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={filters.distance}
                  onChange={(e) => setFilters({ ...filters, distance: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Gender</label>
                <div className="grid grid-cols-3 gap-3">
                  {['all', 'male', 'female'].map((gender) => (
                    <button
                      key={gender}
                      onClick={() => setFilters({ ...filters, gender })}
                      className={`py-3 rounded-xl border-2 transition-all text-foreground ${
                        filters.gender === gender
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Looking For</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'relationship', label: 'Relationship' },
                    { value: 'casual', label: 'Casual' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilters({ ...filters, lookingFor: option.value })}
                      className={`py-3 rounded-xl border-2 transition-all text-sm text-foreground ${
                        filters.lookingFor === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Location</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  placeholder="Enter city or area"
                  className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Interests</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['Music', 'Travel', 'Art', 'Sports', 'Reading', 'Cooking', 'Gaming', 'Photography'].map((interest) => (
                    <button
                      key={interest}
                      onClick={() => {
                        const newInterests = filters.interests.includes(interest)
                          ? filters.interests.filter(i => i !== interest)
                          : [...filters.interests, interest];
                        setFilters({ ...filters, interests: newInterests });
                      }}
                      className={`px-4 py-2 rounded-full border-2 transition-all text-sm ${
                        filters.interests.includes(interest)
                          ? 'border-primary bg-primary/5 font-medium text-foreground'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                {filters.interests.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {filters.interests.join(', ')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setFilters({
                    minAge: 18,
                    maxAge: 100,
                    distance: 50,
                    gender: 'all',
                    location: '',
                    interests: [],
                    lookingFor: 'all'
                  });
                }}
                variant="outline"
                className="flex-1"
              >
                Reset
              </Button>
              <Button
                onClick={() => setShowFilters(false)}
                className="flex-1"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
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

            <Textarea
              value={superLikeMessage}
              onChange={(e) => setSuperLikeMessage(e.target.value)}
              placeholder="Write a message (optional)..."
              className="mb-4 h-24 resize-none"
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuperLikeModal(false);
                  setSuperLikeMessage('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => superLikeMutation.mutate({
                  targetUserId: superLikeUser.id,
                  message: superLikeMessage
                })}
                disabled={superLikeMutation.isPending}
                className="flex-1 bg-gradient-to-r from-superlike to-info"
              >
                Send Super Like ⭐
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
