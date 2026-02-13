import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Copy, Check, MessageSquare } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListSkeleton, EmptyState } from '@/components/states';
import { DEMO_ICE_BREAKERS, CATEGORIES } from './IceBreakers.constants';

export default function IceBreakers() {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const { data: iceBreakers = DEMO_ICE_BREAKERS } = useQuery({
    queryKey: ['iceBreakers', selectedCategory],
    queryFn: async () => {
      return DEMO_ICE_BREAKERS;
    },
  });

  const filteredBreakers = selectedCategory === 'all'
    ? iceBreakers
    : iceBreakers.filter(b => b.category === selectedCategory);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
            <div className="min-w-[24px]"><div className="w-6"></div></div>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-foreground">Ice Breakers</h1>
            </div>
            <div className="min-w-[24px]"></div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto p-4">
          <ListSkeleton count={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <div className="w-6"></div>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Ice Breakers</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Category Filter */}
        <div className="bg-card border-b border-border p-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ice Breakers List */}
        <div className="p-4 space-y-3">
          {filteredBreakers.map((breaker) => (
            <Card key={breaker.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-foreground flex-1 leading-relaxed">
                    {breaker.text}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(breaker.text, breaker.id)}
                    className="flex-shrink-0 rounded-full"
                  >
                    {copiedId === breaker.id ? (
                      <Check className="w-5 h-5 text-success" />
                    ) : (
                      <Copy className="w-5 h-5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredBreakers.length === 0 && (
            <EmptyState
              icon={MessageSquare}
              title="No ice breakers"
              description="No ice breakers found in this category. Try selecting a different category."
            />
          )}
        </div>
      </div>
    </div>
  );
}