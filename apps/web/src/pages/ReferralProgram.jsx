import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Share2, Check, Copy, Users } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { CardsSkeleton } from '@/components/states';

export default function ReferralProgram() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isLoading } = useCurrentUser();
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);

  // Local state for referrals (demo mode)
  const [localReferrals, setLocalReferrals] = useState([]);

  const { data: referrals = localReferrals } = useQuery({
    queryKey: ['referrals', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      return localReferrals;
    },
    enabled: !!currentUser,
  });

  const sendReferralMutation = useMutation({
    mutationFn: async (referredEmail) => {
      // Log referral creation (Referral service can be added in future)
      const newReferral = {
        id: Date.now().toString(),
        referrer_id: currentUser.id,
        referred_email: referredEmail,
        status: 'pending',
        reward_type: 'free_month',
        created_date: new Date().toISOString()
      };
      console.log('Referral created:', newReferral);
      return newReferral;
    },
    onSuccess: (newReferral) => {
      setLocalReferrals(prev => [newReferral, ...prev]);
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      setEmail('');
      alert('Referral sent! 🎉');
    },
  });

  const referralCode = currentUser?.id?.slice(0, 8).toUpperCase() || 'BELL123';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`Join Bellør with my code: ${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendReferral = () => {
    if (!email.trim()) return;
    if (!email.includes('@')) {
      alert('Please enter a valid email');
      return;
    }
    sendReferralMutation.mutate(email);
  };

  const rewards = [
    { icon: '🎁', label: 'Free Premium Month', description: 'For each friend who joins' },
    { icon: '⭐', label: '5 Super Likes', description: 'When they complete their profile' },
    { icon: '🚀', label: 'Profile Boost', description: 'When they make their first match' },
    { icon: '🏆', label: 'Exclusive Badge', description: 'After 5 successful referrals' }
  ];

  const statusColors = {
    pending: 'bg-warning/10 text-warning',
    signed_up: 'bg-info/10 text-info',
    completed: 'bg-success/10 text-success',
    rewarded: 'bg-primary/10 text-primary'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
            <div className="min-w-[24px]"></div>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-foreground">Refer Friends</h1>
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
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Refer Friends</h1>
          </div>
          <div className="min-w-[24px]"></div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-primary to-match rounded-2xl p-6 text-white">
          <div className="text-center mb-6">
            <Gift className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Invite Friends, Get Rewards!</h2>
            <p className="text-sm opacity-90">
              Share Bellør with your friends and both of you get amazing rewards
            </p>
          </div>

          {/* Referral Code */}
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
            <p className="text-xs opacity-90 mb-2">Your Referral Code</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold tracking-wider">{referralCode}</span>
              <button
                onClick={handleCopyCode}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{referrals.length}</div>
              <div className="text-xs opacity-90">Friends Invited</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">
                {referrals.filter(r => r.status === 'rewarded').length}
              </div>
              <div className="text-xs opacity-90">Rewards Earned</div>
            </div>
          </div>
        </div>

        {/* Rewards */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-base text-foreground mb-4">Your Rewards</h3>
            <div className="grid grid-cols-2 gap-3">
              {rewards.map((reward, idx) => (
                <div key={idx} className="bg-muted rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">{reward.icon}</div>
                  <div className="font-semibold text-sm text-foreground mb-1">{reward.label}</div>
                  <div className="text-xs text-muted-foreground">{reward.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Send Invitation */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-base text-foreground mb-4">Invite by Email</h3>
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-12"
              />
              <Button
                onClick={handleSendReferral}
                disabled={!email.trim() || sendReferralMutation.isPending}
                className="h-12 px-6"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Referrals List */}
        {referrals.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <h3 className="font-bold text-base text-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Your Referrals
              </h3>
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-foreground">{referral.referred_email}</p>
                      <p className="text-xs text-muted-foreground">
                        {referral.reward_type.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                    <Badge
                      variant={referral.status === 'completed' || referral.status === 'rewarded' ? 'success' : 'secondary-soft'}
                      size="sm"
                    >
                      {referral.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}