import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, TrendingUp, Eye, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {stats.map((stat, idx) => (
        <Card key={idx}>
          <CardContent className="p-5">
            <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ActivitySummary({ likesReceived, likesGiven, chats, currentUser }) {
  return (
    <Card className="mb-4">
      <CardContent className="p-5">
        <h3 className="font-semibold text-base text-foreground mb-4">Activity Summary</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Match Rate</span>
            <span className="text-sm font-semibold text-foreground">
              {likesGiven.length > 0
                ? Math.round((likesReceived.length / likesGiven.length) * 100)
                : 0}%
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Response Rate</span>
            <span className="text-sm font-semibold text-foreground">
              {chats.length > 0
                ? Math.round((chats.filter(c => c.last_message_at).length / chats.length) * 100)
                : 0}%
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Member Since</span>
            <span className="text-sm font-semibold text-foreground">
              {new Date(currentUser.created_date).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PremiumCTA() {
  const navigate = useNavigate();
  return (
    <Card className="bg-gradient-to-r from-primary to-match text-white">
      <CardContent className="p-6">
        <h3 className="font-bold text-lg mb-2">Unlock Premium Insights</h3>
        <p className="text-sm mb-4 opacity-90">
          See who liked you, get detailed analytics, and more
        </p>
        <Button
          onClick={() => navigate(createPageUrl('Premium'))}
          variant="secondary"
          className="bg-white text-primary hover:bg-white/90"
        >
          Upgrade Now
        </Button>
      </CardContent>
    </Card>
  );
}

export function buildStats({ likesReceived, likesGiven, chats, responses, currentUser }) {
  return [
    { icon: Heart, label: 'Likes Received', value: likesReceived.length, color: 'text-love', bg: 'bg-love/10' },
    { icon: TrendingUp, label: 'Likes Given', value: likesGiven.length, color: 'text-info', bg: 'bg-info/10' },
    { icon: MessageCircle, label: 'Active Chats', value: chats.filter(c => c.status === 'active').length, color: 'text-success', bg: 'bg-success/10' },
    { icon: Eye, label: 'Profile Views', value: currentUser.profile_views || 0, color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Users, label: 'Total Responses', value: responses.length, color: 'text-warning', bg: 'bg-warning/10' },
  ];
}
