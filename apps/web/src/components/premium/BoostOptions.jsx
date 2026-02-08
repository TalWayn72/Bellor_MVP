import React from 'react';
import { Zap, TrendingUp, Star, Eye, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const boostOptions = [
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

export const boostBenefits = [
  { icon: <Eye className="w-6 h-6" />, text: 'Get up to 10x more profile views' },
  { icon: <Heart className="w-6 h-6" />, text: 'Appear in more discovery feeds' },
  { icon: <Star className="w-6 h-6" />, text: 'Priority placement in search results' },
  { icon: <TrendingUp className="w-6 h-6" />, text: 'Increase your match potential' }
];

export default function BoostOptions({ activeBoost, onActivateBoost, isPending }) {
  return (
    <>
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
                onClick={() => onActivateBoost(boost.type)}
                disabled={!!activeBoost || isPending}
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
            {boostBenefits.map((benefit, idx) => (
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
    </>
  );
}
