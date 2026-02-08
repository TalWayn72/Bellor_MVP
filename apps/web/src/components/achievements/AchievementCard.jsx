import React from 'react';
import { Lock, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const iconMap = {
  'pen': '✍️',
  'butterfly': '🦋',
  'star': '⭐',
  'heart': '💕',
  'fire': '🔥'
};

export function getIconEmoji(icon) {
  return iconMap[icon] || icon || '🏆';
}

export default function AchievementCard({ achievement, isUnlocked, userProgress }) {
  return (
    <Card className={isUnlocked ? '' : 'opacity-60'}>
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
}
