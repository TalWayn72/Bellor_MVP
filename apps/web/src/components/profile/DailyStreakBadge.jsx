import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Flame } from 'lucide-react';

export default function DailyStreakBadge({ userId }) {
  // Demo streak data (DailyStreak service can be added in future)
  const { data: streak } = useQuery({
    queryKey: ['dailyStreak', userId],
    queryFn: async () => {
      if (!userId) return null;
      // Return demo data
      return { current_streak: 0, longest_streak: 0, total_days: 0 };
    },
    enabled: !!userId,
  });

  if (!streak || streak.current_streak === 0) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 text-white">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
          <Flame className="w-6 h-6" />
        </div>
        <div>
          <p className="text-2xl font-bold">{streak.current_streak} Day Streak! 🔥</p>
          <p className="text-xs opacity-90">Keep it going!</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/20 flex justify-between text-xs">
        <div>
          <p className="opacity-75">Longest</p>
          <p className="font-semibold">{streak.longest_streak} days</p>
        </div>
        <div className="text-left">
          <p className="opacity-75">Total Active</p>
          <p className="font-semibold">{streak.total_days} days</p>
        </div>
      </div>
    </div>
  );
}