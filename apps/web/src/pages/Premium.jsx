import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/api';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Check, Crown, Zap, Star, Shield } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardsSkeleton } from '@/components/states';

export default function Premium() {
  const navigate = useNavigate();
  const { currentUser, isLoading: userLoading } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!currentUser) {
      alert('Please log in to subscribe');
      return;
    }

    setIsLoading(true);
    try {
      // Log subscription creation (Subscription service can be added in future)
      const subscriptionData = {
        user_id: currentUser.id,
        plan: 'premium',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 29.99
      };
      console.log('Subscription created:', subscriptionData);

      // Update user's is_premium status
      await userService.updateUser(currentUser.id, {
        is_premium: true,
        last_active_date: new Date().toISOString()
      });

      alert('🎉 Subscription created! Premium features activated.');
      navigate(createPageUrl('SharedSpace'));
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Error creating subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    { id: 'monthly', name: '1 Month', price: 29.99, period: '/month', popular: false },
    { id: '3months', name: '3 Months', price: 69.99, period: 'total', savings: 'Save 22%', popular: true },
    { id: 'yearly', name: '12 Months', price: 199.99, period: 'total', savings: 'Save 44%', popular: false }
  ];

  const [selectedPlan, setSelectedPlan] = useState('3months');

  const features = [
    { icon: Zap, text: 'Unlimited likes and matches' },
    { icon: Star, text: 'See who liked you before matching' },
    { icon: Shield, text: 'Advanced privacy controls' },
    { icon: Crown, text: 'Priority profile visibility' },
    { icon: Check, text: 'No ads' },
    { icon: Check, text: 'Rewind last pass' },
    { icon: Check, text: 'Unlimited temporary chats' },
    { icon: Check, text: 'Read receipts' },
  ];

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
            <div className="min-w-[24px]"><div className="w-6"></div></div>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-foreground">Bellor Premium</h1>
            </div>
            <div className="min-w-[24px]"></div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <CardsSkeleton count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-love/5 to-match/5" dir="ltr">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <div className="w-6"></div>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Bellør Premium</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-love flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-love bg-clip-text text-transparent">
            Unlock Your Full Potential
          </h2>
          <p className="text-muted-foreground text-lg">
            Get access to premium features and find your perfect match faster
          </p>
        </div>

        {/* Plans */}
        <div className="space-y-3 mb-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              variant="interactive"
              onClick={() => setSelectedPlan(plan.id)}
              className={`cursor-pointer transition-all ${
                selectedPlan === plan.id ? 'ring-2 ring-primary' : ''
              } ${plan.popular ? 'border-2 border-primary' : ''}`}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
                    {plan.popular && (
                      <Badge variant="premium">POPULAR</Badge>
                    )}
                  </div>
                  {plan.savings && <p className="text-xs text-success font-semibold">{plan.savings}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <p className="text-2xl font-bold text-foreground">${plan.price}</p>
                    <p className="text-xs text-muted-foreground">{plan.period}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === plan.id ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                  }`}>
                    {selectedPlan === plan.id && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pricing Card */}
        <Card className="shadow-xl mb-8 border-2 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle>What's Included:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Features List */}
            <div className="space-y-4 mb-8">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-foreground">{feature.text}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={handleSubscribe}
              disabled={isLoading || currentUser.is_premium}
              variant="premium"
              size="lg"
              className="w-full h-14 text-lg font-semibold rounded-full shadow-lg"
            >
              {currentUser.is_premium ? 'Already Premium ✓' :
               isLoading ? 'Processing...' :
               'Start Premium Now'}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              By subscribing, you agree to our terms and conditions
            </p>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <Card variant="glass">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">10K+</p>
                <p className="text-xs text-muted-foreground">Premium Users</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">4.8★</p>
                <p className="text-xs text-muted-foreground">App Rating</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">95%</p>
                <p className="text-xs text-muted-foreground">Satisfaction</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}