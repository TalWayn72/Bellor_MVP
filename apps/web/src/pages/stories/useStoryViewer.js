import React from 'react';
import { storyService } from '@/api';

export function useStoryViewer(stories) {
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [viewerIndex, setViewerIndex] = React.useState(0);
  const [viewProgress, setViewProgress] = React.useState(0);

  const openStoryViewer = React.useCallback((index) => {
    setViewerIndex(index); setViewProgress(0); setViewerOpen(true);
    const story = stories[index];
    if (story?.id && !story.id.startsWith('demo')) storyService.viewStory(story.id).catch(() => {});
  }, [stories]);

  const goToStory = React.useCallback((direction) => {
    const nextIndex = viewerIndex + direction;
    if (nextIndex >= 0 && nextIndex < stories.length) {
      setViewerIndex(nextIndex); setViewProgress(0);
      const story = stories[nextIndex];
      if (story?.id && !story.id.startsWith('demo')) storyService.viewStory(story.id).catch(() => {});
    } else { setViewerOpen(false); }
  }, [viewerIndex, stories]);

  React.useEffect(() => {
    if (!viewerOpen) return;
    const duration = 5000; const interval = 50;
    const timer = setInterval(() => {
      setViewProgress(prev => {
        if (prev >= 100) { goToStory(1); return 0; }
        return prev + (interval / duration) * 100;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [viewerOpen, viewerIndex, goToStory]);

  return { viewerOpen, setViewerOpen, viewerIndex, viewProgress, openStoryViewer, goToStory };
}
