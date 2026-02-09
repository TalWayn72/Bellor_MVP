import React from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StoryUserAvatar from '@/components/stories/StoryUserAvatar';

export default function RecentStoriesGrid({ stories, onOpenViewer }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-3">Recent Stories</h2>
      <div className="grid grid-cols-3 gap-3">
        {stories.length === 0 ? (
          <Card className="col-span-3 p-12 text-center"><p className="text-sm text-muted-foreground">No stories yet</p></Card>
        ) : stories.map((story, index) => (
          <Button key={story.id} variant="ghost" onClick={() => onOpenViewer(index)}
            className="relative aspect-story rounded-2xl overflow-hidden p-0 hover:scale-105 transition-transform h-auto">
            <Card className="w-full h-full border-0 rounded-2xl overflow-hidden">
              <CardContent className="p-0 h-full">
                {story.media_type === 'image' && story.media_url && (
                  <img src={story.media_url} alt="Story" className="w-full h-full object-cover" loading="lazy" />
                )}
                {story.media_type === 'text' && (
                  <div className="w-full h-full bg-gradient-to-br from-info-500 to-success-500 flex items-center justify-center p-3">
                    <p className="text-white text-xs text-center">{story.text_content}</p>
                  </div>
                )}
                <StoryUserAvatar userId={story.user_id} />
                <div className="absolute bottom-2 left-2 right-2">
                  <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm border-0 gap-1">
                    <Eye className="w-3 h-3" /><span className="text-xs">{story.views_count}</span>
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Button>
        ))}
      </div>
    </div>
  );
}
