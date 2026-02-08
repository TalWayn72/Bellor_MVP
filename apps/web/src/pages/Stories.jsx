import React from 'react';
import { useNavigate } from 'react-router-dom';
import { storyService, userService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardsSkeleton, EmptyState } from '@/components/states';
import { getDemoStories } from '@/data/demoData';
import { Dialog, DialogContent } from '@/components/ui/dialog';

function StoryUserAvatar({ userId }) {
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
    <div className="absolute top-3 left-3">
      <img
        src={user?.profile_images?.[0] || `https://i.pravatar.cc/50?u=${userId}`}
        alt="User"
        className="w-8 h-8 rounded-full border-2 border-white"
      />
    </div>
  );
}

export default function Stories() {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();

  const { data: stories = [] } = useQuery({
    queryKey: ['stories'],
    queryFn: async () => {
      try {
        const result = await storyService.getFeed();
        const dbStories = result.stories || [];
        return dbStories.length > 0 ? dbStories : getDemoStories();
      } catch (error) {
        return getDemoStories();
      }
    },
  });

  const { data: myStories = [] } = useQuery({
    queryKey: ['myStories', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      try {
        const result = await storyService.getMyStories();
        return result.stories || [];
      } catch (error) {
        return [];
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
    <div className="min-h-screen bg-background">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <Button
              variant="default"
              size="icon"
              onClick={() => navigate(createPageUrl('CreateStory'))}
              className="w-8 h-8 rounded-full"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Stories</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {/* My Stories */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Your Story</h2>
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl('CreateStory'))}
            className="w-24 h-32 rounded-2xl border-2 border-dashed hover:bg-muted flex flex-col gap-2 p-0"
          >
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Create Story</span>
          </Button>

          {myStories.length > 0 && (
            <div className="mt-3 flex gap-3 overflow-x-auto scrollbar-hide">
              {myStories.map((story) => (
                <Card key={story.id} className="relative flex-shrink-0 w-24 h-32 rounded-2xl overflow-hidden border-0 p-0">
                  <CardContent className="p-0 h-full">
                    {story.media_type === 'image' && story.media_url && (
                      <img src={story.media_url} alt="Story" className="w-full h-full object-cover" />
                    )}
                    {story.media_type === 'text' && (
                      <div className="w-full h-full bg-gradient-to-br from-secondary-500 to-primary-500 flex items-center justify-center p-3">
                        <p className="text-white text-xs text-center">{story.text_content}</p>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm border-0 gap-1">
                        <Eye className="w-3 h-3" />
                        <span className="text-xs">{story.views_count}</span>
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* All Stories */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Recent Stories</h2>
          <div className="grid grid-cols-3 gap-3">
            {stories.length === 0 ? (
              <Card className="col-span-3 p-12 text-center">
                <p className="text-sm text-muted-foreground">No stories yet</p>
              </Card>
            ) : (
              stories.map((story) => (
                <Button
                  key={story.id}
                  variant="ghost"
                  onClick={() => {/* TODO: Open story viewer */}}
                  className="relative aspect-story rounded-2xl overflow-hidden p-0 hover:scale-105 transition-transform h-auto"
                >
                  <Card className="w-full h-full border-0 rounded-2xl overflow-hidden">
                    <CardContent className="p-0 h-full">
                      {story.media_type === 'image' && story.media_url && (
                        <img src={story.media_url} alt="Story" className="w-full h-full object-cover" />
                      )}
                      {story.media_type === 'text' && (
                        <div className="w-full h-full bg-gradient-to-br from-info-500 to-success-500 flex items-center justify-center p-3">
                          <p className="text-white text-xs text-center">{story.text_content}</p>
                        </div>
                      )}
                      <StoryUserAvatar userId={story.user_id} />
                      <div className="absolute bottom-2 left-2 right-2">
                        <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm border-0 gap-1">
                          <Eye className="w-3 h-3" />
                          <span className="text-xs">{story.views_count}</span>
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
