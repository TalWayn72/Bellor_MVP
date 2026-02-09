import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Share2, Users } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { CardsSkeleton } from '@/components/states';
import ReferralStats from '@/components/referral/ReferralStats';
import { useToast } from '@/components/ui/use-toast';

export default function ReferralProgram() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isLoading } = useCurrentUser();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [localReferrals, setLocalReferrals] = useState([]);
  const copiedTimerRef = React.useRef(null);

  const { data: referrals = localReferrals } = useQuery({
    queryKey: ['referrals', currentUser?.id],
    queryFn: async () => { if (!currentUser) return []; return localReferrals; },
    enabled: !!currentUser,
  });

  React.useEffect(() => {
    return () => {
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  const sendReferralMutation = useMutation({
    mutationFn: async (referredEmail) => {
      const newReferral = {
        id: Date.now().toString(), referrer_id: currentUser.id,
        referred_email: referredEmail, status: 'pending',
        reward_type: 'free_month', created_date: new Date().toISOString()
      };
      // Referral service integration pending
      return newReferral;
    },
    onSuccess: (newReferral) => {
      setLocalReferrals(prev => [newReferral, ...prev]);
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      setEmail('');
      toast({ title: 'Success', description: 'Referral sent!' });
    },
  });

  const referralCode = currentUser?.id?.slice(0, 8).toUpperCase() || 'BELL123';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`Join Bellor with my code: ${referralCode}`);
    setCopied(true);
    if (copiedTimerRef.current) {
      clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleSendReferral = () => {
    if (!email.trim()) return;
    if (!email.includes('@')) { toast({ title: 'Validation', description: 'Please enter a valid email', variant: 'destructive' }); return; }
    sendReferralMutation.mutate(email);
  };

  const rewards = [
    { icon: '🎁', label: 'Free Premium Month', description: 'For each friend who joins' },
    { icon: '⭐', label: '5 Super Likes', description: 'When they complete their profile' },
    { icon: '🚀', label: 'Profile Boost', description: 'When they make their first match' },
    { icon: '🏆', label: 'Exclusive Badge', description: 'After 5 successful referrals' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
            <div className="min-w-[24px]"></div>
            <div className="flex-1 text-center"><h1 className="text-lg font-semibold text-foreground">Refer Friends</h1></div>
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
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
          <div className="flex-1 text-center"><h1 className="text-lg font-semibold text-foreground">Refer Friends</h1></div>
          <div className="min-w-[24px]"></div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <ReferralStats referralCode={referralCode} referrals={referrals} copied={copied} onCopyCode={handleCopyCode} />

        <Card><CardContent className="p-5">
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
        </CardContent></Card>

        <Card><CardContent className="p-5">
          <h3 className="font-bold text-base text-foreground mb-4">Invite by Email</h3>
          <div className="flex gap-3">
            <Input type="email" placeholder="friend@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 h-12" />
            <Button onClick={handleSendReferral} disabled={!email.trim() || sendReferralMutation.isPending} className="h-12 px-6">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </CardContent></Card>

        {referrals.length > 0 && (
          <Card><CardContent className="p-5">
            <h3 className="font-bold text-base text-foreground mb-4 flex items-center gap-2"><Users className="w-5 h-5" />Your Referrals</h3>
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-foreground">{referral.referred_email}</p>
                    <p className="text-xs text-muted-foreground">{referral.reward_type.replace('_', ' ').toUpperCase()}</p>
                  </div>
                  <Badge variant={referral.status === 'completed' || referral.status === 'rewarded' ? 'success' : 'secondary-soft'} size="sm">
                    {referral.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}
