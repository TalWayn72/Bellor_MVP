import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, TrendingUp, Eye, Heart, Star } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { CardsSkeleton } from '@/components/states';

export default function ProfileBoost() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isLoading } = useCurrentUser();

  // Local state for active boost (demo mode)
  const [activeBoost, setActiveBoost] = useState(null);

  const activateBoostMutation = useMutation({
    mutationFn: async (boostType) => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

      // Log boost activation (ProfileBoost service can be added in future)
      const boostData = {
        user_id: currentUser.id,
        boost_type: boostType,
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        views_gained: 0
      };
      console.log('Boost activated:', boostData);
      return boostData;
    },
    onSuccess: (data) => {
      setActiveBoost(data);
      queryClient.invalidateQueries({ queryKey: ['activeBoost'] });
      alert('Boost activated! Your profile will be shown to more people.');
    },
  });

  const boostOptions = [
    {
      type: 'standard',
      name: 'Standard Boost',
      icon: <Zap className="w-8 h-8" />,
      duration: '30 minutes',
      multiplier: '2x',
      color: 'from-blue-500 to-cyan-500',
      price: 'Free',
      description: 'Get 2x more profile views for 30 minutes'
    },
    {
      type: 'super',
      name: 'Super Boost',
      icon: <TrendingUp className="w-8 h-8" />,
      duration: '1 hour',
      multiplier: '5x',
      color: 'from-purple-500 to-pink-500',
      price: 'Premium',
      description: 'Get 5x more views and priority placement'
    },
    {
      type: 'premium',
      name: 'Premium Boost',
      icon: <Star className="w-8 h-8" />,
      duration: '3 hours',
      multiplier: '10x',
      color: 'from-yellow-500 to-orange-500',
      price: 'Premium+',
      description: 'Maximum visibility with 10x views'
    }
  ];

  const benefits = [
    { icon: <Eye className="w-6 h-6" />, text: 'Get up to 10x more profile views' },
    { icon: <Heart className="w-6 h-6" />, text: 'Appear in more discovery feeds' },
    { icon: <Star className="w-6 h-6" />, text: 'Priority placement in search results' },
    { icon: <TrendingUp className="w-6 h-6" />, text: 'Increase your match potential' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
            <div className="min-w-[24px]"><div className="w-6"></div></div>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-foreground">Profile Boost</h1>
            </div>
            <div className="min-w-[24px]"></div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto p-4">
          <CardsSkeleton count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <div className="w-6"></div>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Profile Boost</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/Profile" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Hero */}
        <div className="bg-gradient-to-br from-primary to-match rounded-2xl p-6 text-white text-center">
          <Zap className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Boost Your Profile</h2>
          <p className="text-sm opacity-90">
            Get more visibility and increase your chances of finding the perfect match
          </p>
        </div>

        {/* Active Boost */}
        {activeBoost && (
          <Card className="border-2 border-success">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">Boost Active!</h3>
                    <p className="text-xs text-muted-foreground">
                      {activeBoost.boost_type.charAt(0).toUpperCase() + activeBoost.boost_type.slice(1)} Boost
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-success/10 rounded-xl p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">Views Gained</span>
                  <span className="font-bold text-success">+{activeBoost.views_gained}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Boost Options */}
        <div className="space-y-3">
          {boostOptions.map((boost) => (
            <Card key={boost.type} className="overflow-hidden">
              <div className={`bg-gradient-to-r ${boost.color} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {boost.icon}
                    <div>
                      <h3 className="font-bold text-lg">{boost.name}</h3>
                      <p className="text-sm opacity-90">{boost.duration}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{boost.multiplier}</div>
                    <div className="text-xs opacity-90">views</div>
                  </div>
                </div>
              </div>

              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">{boost.description}</p>
                <Button
                  onClick={() => activateBoostMutation.mutate(boost.type)}
                  disabled={!!activeBoost || activateBoostMutation.isPending}
                  size="lg"
                  className="w-full h-12"
                >
                  {boost.price === 'Free' ? 'Activate Free Boost' : `Unlock with ${boost.price}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Why Boost Your Profile?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <p className="text-sm text-muted-foreground">{benefit.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="bg-gradient-to-r from-warning to-love rounded-2xl p-6 text-white text-center">
          <h3 className="font-bold text-lg mb-2">Want More Boosts?</h3>
          <p className="text-sm opacity-90 mb-4">
            Upgrade to Premium for unlimited boosts
          </p>
          <Button
            onClick={() => navigate(createPageUrl('Premium'))}
            variant="secondary"
            className="bg-white text-warning hover:bg-white/90 font-bold"
          >
            Go Premium
          </Button>
        </div>
      </div>
    </div>
  );
}