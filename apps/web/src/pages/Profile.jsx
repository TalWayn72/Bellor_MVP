import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { responseService } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MapPin, Trash2, MoreVertical, User, Search, Briefcase, Settings } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardImage } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createPageUrl } from '@/utils';
import DailyStreakBadge from '../components/profile/DailyStreakBadge';
import ProfileCompletionCard from '../components/profile/ProfileCompletionCard';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { ProfileSkeleton, EmptyState } from '@/components/states';

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bio');
  const { currentUser, isLoading } = useCurrentUser();
  const [selectedResponse, setSelectedResponse] = useState(null);
  const queryClient = useQueryClient();

  const { data: responses = [] } = useQuery({
    queryKey: ['userResponses', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      try {
        const result = await responseService.listResponses({ userId: currentUser.id, limit: 50 });
        return result.responses || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!currentUser,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (responseId) => {
      await responseService.deleteResponse(responseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userResponses', currentUser?.id] });
      setSelectedResponse(null);
    },
  });

  // Calculate stats
  const totalResponses = responses.length;
  const totalLikes = responses.reduce((sum, r) => sum + (r.likes_count || 0), 0);
  const responsesByType = responses.reduce((acc, r) => {
    acc[r.response_type] = (acc[r.response_type] || 0) + 1;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'about', label: 'About Me' },
    { id: 'book', label: 'My Book' },
  ];

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Settings'))}>
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">{currentUser.nickname || currentUser.full_name} • {currentUser.age}</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto pb-24">
        {/* Profile Image Section */}
        <div className="relative">
          <div className="px-4 pt-4">
            <Card variant="profile" className="rounded-3xl">
              <CardImage
                src={currentUser.profile_images?.[0] || `https://i.pravatar.cc/400?u=${currentUser.id}`}
                alt="Profile"
              />
              {currentUser.is_verified && (
                <div className="absolute top-4 right-4">
                  <Badge variant="verified" size="lg" className="h-10 w-10 rounded-full p-0 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </Badge>
                </div>
              )}
            </Card>
          </div>

          {/* Tabs */}
          <div className="px-4 mt-4">
            <Card className="p-1">
              <div className="flex">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    className={`flex-1 rounded-xl ${activeTab === tab.id ? 'bg-foreground text-background' : ''}`}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Content - Phase 1: Dating */}
        <div className="px-4 mt-4">
          {activeTab === 'about' && (
            <div className="space-y-4">
              {/* Daily Streak */}
              <DailyStreakBadge userId={currentUser.id} />

              {/* Profile Completion */}
              <ProfileCompletionCard user={currentUser} />

              {/* About Me Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">About Me</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentUser.bio || "Tell us something about yourself..."}
                  </p>
                </CardContent>
              </Card>

              {/* Info Section */}
              <Card>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{currentUser.location || 'Israel'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{currentUser.gender === 'female' ? 'Female' : currentUser.gender === 'male' ? 'Male' : 'Other'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Search className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      Looking for {currentUser.looking_for === 'female' ? 'Women' : currentUser.looking_for === 'male' ? 'Men' : 'Everyone'}
                    </span>
                  </div>
                  {currentUser.occupation && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-foreground">{currentUser.occupation}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Interests */}
              {currentUser.interests && currentUser.interests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Interests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.interests.map((interest, idx) => (
                        <Badge key={idx} variant="secondary" size="lg">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              </div>
              )}

              {activeTab === 'book' && (
            <div className="space-y-4">
              {/* Stats Section */}
              <Card>
                <CardHeader>
                  <CardTitle>My Book - My Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{totalResponses}</div>
                      <div className="text-xs text-muted-foreground mt-1">Total Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-love">{totalLikes}</div>
                      <div className="text-xs text-muted-foreground mt-1">Total Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-info">{Object.keys(responsesByType).length}</div>
                      <div className="text-xs text-muted-foreground mt-1">Content Types</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">All your shares and content</p>
                </CardContent>
              </Card>

              {/* All User Responses Grid */}
              <div className="grid grid-cols-2 gap-3">
                {responses.length === 0 ? (
                  <div className="col-span-2">
                    <EmptyState
                      variant="media"
                      title="No content shared yet"
                      description="Share your first response to start building your book!"
                      actionLabel="Share Now"
                      onAction={() => navigate(createPageUrl('SharedSpace?openTaskSelector=true'))}
                    />
                  </div>
                ) : (
                  responses.map((response) => (
                    <Card key={response.id} variant="interactive" className="overflow-hidden relative group">
                      <div className="aspect-square bg-muted relative">
                        {response.response_type === 'text' && (
                          <div className="absolute inset-0 p-4 flex items-center justify-center">
                            <p className="text-xs text-foreground text-center line-clamp-4">
                              {response.text_content}
                            </p>
                          </div>
                        )}
                        {response.response_type === 'drawing' && response.content && (
                          <img
                            src={response.content}
                            alt="Drawing"
                            className="w-full h-full object-cover"
                          />
                        )}
                        {response.response_type === 'video' && response.content && (
                          <video
                            src={response.content}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {response.response_type === 'voice' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                          </div>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => setSelectedResponse(response)}
                          className="absolute top-2 right-2 w-8 h-8 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4 text-foreground" />
                        </button>
                      </div>
                      <div className="p-2 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {new Date(response.created_date).toLocaleDateString('he-IL')}
                        </p>
                        {response.likes_count > 0 && (
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-love fill-love" />
                            <span className="text-xs text-muted-foreground">{response.likes_count}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions - My Profile */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            onClick={() => navigate(createPageUrl('Settings'))}
            variant="outline"
            size="lg"
            className="flex-1 h-14 rounded-full font-medium border-2"
          >
            <Settings className="w-5 h-5 ml-2" />
            Settings
          </Button>
          <Button
            onClick={() => navigate(createPageUrl('EditProfile'))}
            size="lg"
            className="flex-1 h-14 rounded-full font-medium"
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent className="max-w-sm" aria-describedby="delete-post-description">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar size="lg" className="bg-destructive/10">
                <AvatarFallback className="bg-transparent">
                  <Trash2 className="w-6 h-6 text-destructive" />
                </AvatarFallback>
              </Avatar>
            </div>
            <DialogTitle>Delete Post?</DialogTitle>
          </DialogHeader>
          <p id="delete-post-description" className="text-sm text-muted-foreground text-center">
            This action cannot be undone. Your post will be permanently deleted.
          </p>
          <DialogFooter className="flex-row gap-3 sm:justify-center">
            <Button
              onClick={() => setSelectedResponse(null)}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteMutation.mutate(selectedResponse?.id)}
              variant="destructive"
              size="lg"
              className="flex-1"
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
