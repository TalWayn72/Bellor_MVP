import React from 'react';
import { Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CreationResponseGrid({ responses }) {
  if (responses.length === 0) {
    return (
      <Card className="col-span-2 rounded-2xl shadow-sm">
        <CardContent className="p-8 text-center">
          <svg className="w-16 h-16 text-muted-foreground mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-muted-foreground">No content created yet</p>
          <p className="text-xs text-muted-foreground mt-2">Choose a creation type above to start</p>
        </CardContent>
      </Card>
    );
  }

  return responses.map((response) => (
    <Card key={response.id} className="rounded-2xl overflow-hidden shadow-sm">
      <CardContent className="p-0">
        <div className="aspect-square bg-muted relative">
          {response.response_type === 'text' && (
            <div className="absolute inset-0 p-4 flex items-center justify-center">
              <p className="text-xs text-foreground text-center line-clamp-4">
                {response.text_content}
              </p>
            </div>
          )}
          {response.response_type === 'drawing' && response.content && (
            <img src={response.content} alt="Drawing" className="w-full h-full object-cover" />
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
        </div>
        <div className="p-2 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {(response.created_date || response.createdAt)
              ? new Date(response.created_date || response.createdAt).toLocaleDateString('he-IL')
              : ''}
          </p>
          {response.likes_count > 0 && (
            <Badge variant="ghost" className="gap-1 px-1">
              <Heart className="w-3 h-3 text-love fill-love" />
              <span className="text-xs">{response.likes_count}</span>
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  ));
}
