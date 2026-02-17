import React, { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { CardsSkeleton, EmptyState } from '@/components/states';
import DateIdeaCard from '@/components/dates/DateIdeaCard';

const demoDateIdeas = [
  { title: 'Coffee & Conversation', description: 'Meet at a cozy local cafe for great coffee and meaningful conversation', category: 'casual', budget: 'low', location_type: 'indoor', duration: '1-2 hours', image_url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500' },
  { title: 'Sunset Picnic', description: 'Pack a basket and watch the sunset together at a scenic spot', category: 'romantic', budget: 'low', location_type: 'outdoor', duration: '2-3 hours', image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500' },
  { title: 'Cooking Class Together', description: 'Learn to make a new dish together in a fun cooking class', category: 'creative', budget: 'medium', location_type: 'indoor', duration: '2-3 hours', image_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500' },
  { title: 'Hiking Adventure', description: 'Explore nature trails and enjoy stunning views together', category: 'adventurous', budget: 'free', location_type: 'outdoor', duration: '3-4 hours', image_url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=500' },
  { title: 'Art Gallery Tour', description: 'Discover new artists and discuss your favorite pieces', category: 'creative', budget: 'low', location_type: 'indoor', duration: '2-3 hours', image_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=500' },
  { title: 'Food Truck Hopping', description: 'Try different cuisines from various food trucks around the city', category: 'foodie', budget: 'medium', location_type: 'outdoor', duration: '2-3 hours', image_url: 'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=500' },
];

const categories = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'casual', label: 'Casual', icon: '☕' },
  { id: 'romantic', label: 'Romantic', icon: '💕' },
  { id: 'adventurous', label: 'Adventure', icon: '🏔️' },
  { id: 'creative', label: 'Creative', icon: '🎨' },
  { id: 'foodie', label: 'Foodie', icon: '🍽️' },
];

export default function DateIdeas() {
  const { isLoading } = useCurrentUser();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: dateIdeas = demoDateIdeas } = useQuery({
    queryKey: ['dateIdeas', selectedCategory],
    queryFn: async () => demoDateIdeas,
  });

  const filteredIdeas = selectedCategory === 'all'
    ? dateIdeas
    : dateIdeas.filter(idea => idea.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
            <div className="min-w-[24px]"><div className="w-6"></div></div>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-foreground">Date Ideas</h1>
            </div>
            <div className="min-w-[24px]"></div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto p-4"><CardsSkeleton count={4} /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]"><div className="w-6"></div></div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Date Ideas</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Category Filter */}
        <div className="bg-card border-b border-border p-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Ideas Grid */}
        <div className="p-4 space-y-4">
          {filteredIdeas.map((idea, index) => (
            <DateIdeaCard key={index} idea={idea} />
          ))}
          {filteredIdeas.length === 0 && (
            <EmptyState
              icon={Heart}
              title="No date ideas yet"
              description="No date ideas in this category. Check back later for more inspiration!"
            />
          )}
        </div>
      </div>
    </div>
  );
}
