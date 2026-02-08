import React from 'react';
import { Heart, MapPin, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const budgetVariants = {
  free: 'success',
  low: 'info',
  medium: 'warning',
  high: 'destructive'
};

export default function DateIdeaCard({ idea }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-48">
        <img
          src={idea.image_url || 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=500'}
          alt={idea.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
          <button className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform">
            <Heart className="w-5 h-5 text-love" />
          </button>
        </div>
        <div className="absolute bottom-3 left-3">
          <Badge variant={budgetVariants[idea.budget]}>
            {idea.budget === 'free' ? 'Free' : `${idea.budget.charAt(0).toUpperCase() + idea.budget.slice(1)} Budget`}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-bold text-lg text-foreground mb-2">{idea.title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{idea.description}</p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {idea.location_type && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="capitalize">{idea.location_type}</span>
            </div>
          )}
          {idea.duration && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{idea.duration}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
