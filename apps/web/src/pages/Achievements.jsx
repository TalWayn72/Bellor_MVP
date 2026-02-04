import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { achievementService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Lock, Star } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { CardsSkeleton } from '@/components/states';

export default function Achievements() {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('all');

  // Fetch all achievements
  const { data: allAchievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      try {
        const result = await achievementService.listAchievements();
        const achievements = result.achievements || [];
        if (achievements.length === 0) {
          return [
            { id: '1', name: 'First Response', description: 'Share your first response', icon: 'pen', type: 'creative', requirement: 1, points: 10 },
            { id: '2', name: 'Social Butterfly', description: 'Start 5 conversations', icon: 'butterfly', type: 'social', requirement: 5, points: 25 },
            { id: '3', name: 'Profile Pro', description: 'Complete your profile 100%', icon: 'star', type: 'profile', requirement: 1, points: 50 },
            { id: '4', name: 'Match Maker', description: 'Get 10 matches', icon: 'heart', type: 'social', requirement: 10, points: 30 },
            { id: '5', name: 'Daily Streaker', description: 'Complete 7 daily missions in a row', icon: 'fire', type: 'engagement', requirement: 7, points: 100 }
          ];
        }
        return achievements;
      } catch (error) {
        return [
          { id: '1', name: 'First Response', description: 'Share your first response', icon: 'pen', type: 'creative', requirement: 1, points: 10 },
          { id: '2', name: 'Social Butterfly', description: 'Start 5 conversations', icon: 'butterfly', type: 'social', requirement: 5, points: 25 },
          { id: '3', name: 'Profile Pro', description: 'Complete your profile 100%', icon: 'star', type: 'profile', requirement: 1, points: 50 },
          { id: '4', name: 'Match Maker', description: 'Get 10 matches', icon: 'heart', type: 'social', requirement: 10, points: 30 },
          { id: '5', name: 'Daily Streaker', description: 'Complete 7 daily missions in a row', icon: 'fire', type: 'engagement', requirement: 7, points: 100 }
        ];
      }
    },
  });

  // Fetch user's achievements
  const { data: userAchievements = [] } = useQuery({
    queryKey: ['userAchievements', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      try {
        const result = await achievementService.getMyAchievements();
        return result.achievements || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!currentUser,
  });

  const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id || ua.id));
  const totalPoints = userAchievements.reduce((sum, ua) => {
    const achievement = allAchievements.find(a => a.id === (ua.achievement_id || ua.id));
    return sum + (achievement?.points || ua.points || 0);
  }, 0);

  const filteredAchievements = activeTab === 'all'
    ? allAchievements
    : allAchievements.filter(a => a.type === activeTab);

  const getIconEmoji = (icon) => {
    const iconMap = {
      'pen': '✍️',
      'butterfly': '🦋',
      'star': '⭐',
      'heart': '💕',
      'fire': '🔥'
    };
    return iconMap[icon] || icon || '🏆';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <CardsSkeleton count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Header */}
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Achievements</h1>
          </div>
          <div className="min-w-[24px]"></div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Stats Card */}
        <Card className="bg-gradient-to-r from-premium to-warning rounded-3xl mb-6 text-white shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold mb-1">{totalPoints}</h2>
                <p className="text-sm opacity-90">Total Points</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Trophy className="w-8 h-8" />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="font-bold">{userAchievements.length}</span>
                <span className="opacity-90 mx-1">/</span>
                <span className="opacity-90">{allAchievements.length}</span>
                <span className="opacity-90 mx-1">Unlocked</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card className="p-1 flex gap-1 mb-6 overflow-x-auto">
          {['all', 'social', 'creative', 'profile', 'engagement'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </Card>

        {/* Achievements List */}
        <div className="space-y-3">
          {filteredAchievements.map((achievement) => {
            const isUnlocked = unlockedIds.has(achievement.id);
            const userProgress = userAchievements.find(ua => (ua.achievement_id || ua.id) === achievement.id);

            return (
              <Card
                key={achievement.id}
                className={isUnlocked ? '' : 'opacity-60'}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-premium to-warning'
                        : 'bg-muted'
                    }`}>
                      {isUnlocked ? getIconEmoji(achievement.icon) : <Lock className="w-6 h-6 text-muted-foreground" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base text-foreground">{achievement.name}</h3>
                        {isUnlocked && <Star className="w-4 h-4 text-premium fill-premium" />}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>

                      {!isUnlocked && userProgress && (
                        <div className="mb-2">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-premium to-warning"
                              style={{ width: `${(userProgress.progress / achievement.requirement) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {userProgress.progress} / {achievement.requirement}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Badge variant="secondary-soft" size="sm">
                          {achievement.points} points
                        </Badge>
                        {isUnlocked && (
                          <span className="text-xs text-success">
                            Unlocked {new Date(userProgress?.unlocked_at || Date.now()).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
