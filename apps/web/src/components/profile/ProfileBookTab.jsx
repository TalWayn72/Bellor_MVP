import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/states';
import { createPageUrl } from '@/utils';

export default function ProfileBookTab({ responses, onSelectResponse }) {
  const navigate = useNavigate();

  const totalResponses = responses.length;
  const totalLikes = responses.reduce((sum, r) => sum + (r.likes_count || 0), 0);
  const responsesByType = responses.reduce((acc, r) => {
    acc[r.response_type] = (acc[r.response_type] || 0) + 1;
    return acc;
  }, {});

  return (
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
                    <p className="text-xs text-foreground text-center line-clamp-4">{response.text_content}</p>
                  </div>
                )}
                {response.response_type === 'drawing' && response.content && (
                  <img src={response.content} alt="Drawing" className="w-full h-full object-cover" loading="lazy" />
                )}
                {response.response_type === 'video' && response.content && (
                  <video src={response.content} className="w-full h-full object-cover" />
                )}
                {response.response_type === 'voice' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                )}
                <button
                  onClick={() => onSelectResponse(response)}
                  aria-label="More options for this post"
                  className="absolute top-2 right-2 w-8 h-8 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4 text-foreground" />
                </button>
              </div>
              <div className="p-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{new Date(response.created_date).toLocaleDateString('he-IL')}</p>
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
  );
}
