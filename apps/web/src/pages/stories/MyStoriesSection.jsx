import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MyStoriesSection({ myStories }) {
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-foreground mb-3">Your Story</h2>
      <Button variant="outline" onClick={() => navigate(createPageUrl('CreateStory'))}
        className="w-24 h-32 rounded-2xl border-2 border-dashed hover:bg-muted flex flex-col gap-2 p-0">
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
                  <img src={story.media_url} alt="Story" className="w-full h-full object-cover" loading="lazy" />
                )}
                {story.media_type === 'text' && (
                  <div className="w-full h-full bg-gradient-to-br from-secondary-500 to-primary-500 flex items-center justify-center p-3">
                    <p className="text-white text-xs text-center">{story.text_content}</p>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm border-0 gap-1">
                    <Eye className="w-3 h-3" /><span className="text-xs">{story.views_count}</span>
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
