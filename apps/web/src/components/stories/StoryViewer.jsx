import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import StoryUserAvatar from './StoryUserAvatar';

export default function StoryViewer({
  stories,
  viewerOpen,
  setViewerOpen,
  viewerIndex,
  viewProgress,
  goToStory,
}) {
  const currentStory = stories[viewerIndex];

  return (
    <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
      <DialogContent
        showClose={false}
        className="max-w-md w-full h-[80vh] p-0 bg-black border-0 rounded-2xl overflow-hidden"
      >
        {currentStory && (
          <div className="relative w-full h-full flex flex-col">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
              {stories.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-75"
                    style={{
                      width: i < viewerIndex ? '100%' : i === viewerIndex ? `${viewProgress}%` : '0%'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* User info */}
            <div className="absolute top-6 left-3 right-3 z-10 flex items-center justify-between">
              <StoryUserAvatar userId={currentStory.user_id} />
              <button onClick={() => setViewerOpen(false)} className="p-1.5 rounded-full bg-black/40 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Story content */}
            <div className="flex-1 flex items-center justify-center">
              {currentStory.media_type === 'image' && currentStory.media_url && (
                <img src={currentStory.media_url} alt="Story" className="w-full h-full object-contain" />
              )}
              {currentStory.media_type === 'text' && (
                <div className="w-full h-full bg-gradient-to-br from-info-500 to-success-500 flex items-center justify-center p-8">
                  <p className="text-white text-xl text-center font-medium">{currentStory.text_content}</p>
                </div>
              )}
            </div>

            {/* Caption */}
            {currentStory.caption && (
              <div className="absolute bottom-16 left-0 right-0 px-4">
                <p className="text-white text-sm bg-black/30 rounded-lg px-3 py-2 backdrop-blur-sm">
                  {currentStory.caption}
                </p>
              </div>
            )}

            {/* Navigation areas */}
            <button className="absolute left-0 top-16 bottom-16 w-1/3" onClick={() => goToStory(-1)} />
            <button className="absolute right-0 top-16 bottom-16 w-1/3" onClick={() => goToStory(1)} />

            {/* Navigation arrows */}
            {viewerIndex > 0 && (
              <button onClick={() => goToStory(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 text-white">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {viewerIndex < stories.length - 1 && (
              <button onClick={() => goToStory(1)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 text-white">
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
