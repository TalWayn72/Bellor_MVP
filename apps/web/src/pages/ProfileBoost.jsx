import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { CardsSkeleton } from '@/components/states';
import BoostOptions from '@/components/premium/BoostOptions';
import { useToast } from '@/components/ui/use-toast';

export default function ProfileBoost() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isLoading } = useCurrentUser();
  const { toast } = useToast();
  const [activeBoost, setActiveBoost] = useState(null);

  const activateBoostMutation = useMutation({
    mutationFn: async (boostType) => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
      const boostData = {
        user_id: currentUser.id, boost_type: boostType,
        started_at: now.toISOString(), expires_at: expiresAt.toISOString(), views_gained: 0
      };
      // Boost service integration pending
      return boostData;
    },
    onSuccess: (data) => {
      setActiveBoost(data);
      queryClient.invalidateQueries({ queryKey: ['activeBoost'] });
      toast({ title: 'Success', description: 'Boost activated! Your profile will be shown to more people.' });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
            <div className="min-w-[24px]"><div className="w-6"></div></div>
            <div className="flex-1 text-center"><h1 className="text-lg font-semibold text-foreground">Profile Boost</h1></div>
            <div className="min-w-[24px]"></div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto p-4"><CardsSkeleton count={4} /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]"><div className="w-6"></div></div>
          <div className="flex-1 text-center"><h1 className="text-lg font-semibold text-foreground">Profile Boost</h1></div>
          <BackButton variant="header" position="relative" fallback="/Profile" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="bg-gradient-to-br from-primary to-match rounded-2xl p-6 text-white text-center">
          <Zap className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Boost Your Profile</h2>
          <p className="text-sm opacity-90">Get more visibility and increase your chances of finding the perfect match</p>
        </div>

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

        <BoostOptions activeBoost={activeBoost} onActivateBoost={(type) => activateBoostMutation.mutate(type)} isPending={activateBoostMutation.isPending} />

        <div className="bg-gradient-to-r from-warning to-love rounded-2xl p-6 text-white text-center">
          <h3 className="font-bold text-lg mb-2">Want More Boosts?</h3>
          <p className="text-sm opacity-90 mb-4">Upgrade to Premium for unlimited boosts</p>
          <Button onClick={() => navigate(createPageUrl('Premium'))} variant="secondary" className="bg-white text-warning hover:bg-white/90 font-bold">
            Go Premium
          </Button>
        </div>
      </div>
    </div>
  );
}
