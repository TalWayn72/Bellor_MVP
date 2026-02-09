import React from 'react';
import { X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HashtagFilter({ selectedHashtag, onClear }) {
  if (!selectedHashtag) return null;

  return (
    <Card className="mx-4 mt-2">
      <CardContent className="p-2">
        <div className="flex items-center gap-2">
          <Badge variant="info" size="lg" className="gap-2">
            <span className="font-medium">{selectedHashtag}</span>
            <button onClick={onClear} className="hover:opacity-70 transition-opacity">
              <X className="w-3.5 h-3.5" />
            </button>
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
