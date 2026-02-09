import React, { useState } from 'react';
import { Crown } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { Card, CardContent } from '@/components/ui/card';
import { CardsSkeleton } from '@/components/states';
import { PlanSelector, FeaturesList } from '@/components/premium/PlanCards';
import { useToast } from '@/components/ui/use-toast';

export default function Premium() {
  const { currentUser, isLoading: userLoading } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('3months');
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (!currentUser) {
      toast({ title: 'Login required', description: 'Please log in to subscribe', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    toast({ title: 'Coming Soon', description: 'Payment integration coming soon! Stay tuned.' });
    setIsLoading(false);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
            <div className="min-w-[24px]"><div className="w-6"></div></div>
            <div className="flex-1 text-center"><h1 className="text-lg font-semibold text-foreground">Bellor Premium</h1></div>
            <div className="min-w-[24px]"></div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-8"><CardsSkeleton count={3} /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-love/5 to-match/5" dir="ltr">
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]"><div className="w-6"></div></div>
          <div className="flex-1 text-center"><h1 className="text-lg font-semibold text-foreground">Bellor Premium</h1></div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-love flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-love bg-clip-text text-transparent">
            Unlock Your Full Potential
          </h2>
          <p className="text-muted-foreground text-lg">Get access to premium features and find your perfect match faster</p>
        </div>

        <PlanSelector selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} />
        <FeaturesList onSubscribe={handleSubscribe} isLoading={isLoading} isPremium={currentUser.is_premium} />

        <Card variant="glass">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-2xl font-bold text-foreground">10K+</p><p className="text-xs text-muted-foreground">Premium Users</p></div>
              <div><p className="text-2xl font-bold text-foreground">4.8</p><p className="text-xs text-muted-foreground">App Rating</p></div>
              <div><p className="text-2xl font-bold text-foreground">95%</p><p className="text-xs text-muted-foreground">Satisfaction</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
