import React from 'react';
import { useNavigate } from 'react-router-dom';
import { storyService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '@/components/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { CardsSkeleton } from '@/components/states';
import { getDemoStories } from '@/data/demoData';
import StoryViewer from '@/components/stories/StoryViewer';
import { useStoryViewer } from './useStoryViewer';
import MyStoriesSection from './MyStoriesSection';
import RecentStoriesGrid from './RecentStoriesGrid';

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
      } catch { return getDemoStories(); }
    },
  });

  const { data: myStories = [] } = useQuery({
    queryKey: ['myStories', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      try { return (await storyService.getMyStories()).stories || []; }
      catch { return []; }
    },
    enabled: !!currentUser,
  });

  const { viewerOpen, setViewerOpen, viewerIndex, viewProgress, openStoryViewer, goToStory } = useStoryViewer(stories);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6"><CardsSkeleton count={4} /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <Button variant="default" size="icon" onClick={() => navigate(createPageUrl('CreateStory'))} aria-label="Create new story" className="w-8 h-8 rounded-full">
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
        <MyStoriesSection myStories={myStories} />
        <RecentStoriesGrid stories={stories} onOpenViewer={openStoryViewer} />
      </div>

      <StoryViewer stories={stories} viewerOpen={viewerOpen} setViewerOpen={setViewerOpen}
        viewerIndex={viewerIndex} viewProgress={viewProgress} goToStory={goToStory} />
    </div>
  );
}
