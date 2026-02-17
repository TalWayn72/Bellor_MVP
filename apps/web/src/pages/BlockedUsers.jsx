import React from 'react';

import { userService } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ban } from 'lucide-react';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import BackButton from '@/components/navigation/BackButton';
import { ListSkeleton, EmptyState } from '@/components/states';
import BlockedUserCard from '@/components/settings/BlockedUserCard';

export default function BlockedUsers() {
  const queryClient = useQueryClient();
  const { currentUser, isLoading } = useCurrentUser();

  const { data: blockedUsers = [] } = useQuery({
    queryKey: ['blockedUsers', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      try { return (await userService.getBlockedUsers()).blockedUsers || []; }
      catch { return []; }
    },
    enabled: !!currentUser,
  });

  const unblockMutation = useMutation({
    mutationFn: async (userId) => { await userService.unblockUser(userId); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['blockedUsers'] }); },
  });

  const handleUnblock = (blockId, userId) => {
    if (confirm('Are you sure you want to unblock this user?')) {
      unblockMutation.mutate(userId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6"><ListSkeleton count={5} /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="w-9"></div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Blocked Users</h1>
            <p className="text-xs text-muted-foreground">
              {blockedUsers.length > 0 ? `${blockedUsers.length} blocked users` : 'Manage users'}
            </p>
          </div>
          <BackButton variant="header" position="relative" fallback="/SafetyCenter" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {blockedUsers.length === 0 ? (
          <EmptyState variant="default" title="No Blocked Users"
            description="When you block someone, they will appear here. Blocked users cannot see your profile or contact you."
            icon={Ban} />
        ) : (
          <>
            <div className="bg-gradient-to-br from-info/10 to-info/5 border border-info/20 rounded-2xl p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-info/20 rounded-full flex items-center justify-center">
                  <Ban className="w-4 h-4 text-info" />
                </div>
                <div>
                  <p className="text-sm font-medium text-info mb-0.5">What Blocking Does</p>
                  <p className="text-xs text-info/80">
                    Blocked users cannot see your profile, send you messages, or appear in your feed
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-sm divide-y divide-border border border-border overflow-hidden">
              {blockedUsers.map((block) => (
                <BlockedUserCard key={block.id} block={block} onUnblock={handleUnblock} isPending={unblockMutation.isPending} />
              ))}
            </div>
          </>
        )}

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h3 className="font-bold text-base mb-4 text-foreground flex items-center gap-2">
            <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-primary text-xs">i</span>
            </div>
            About Blocking
          </h3>
          <ul className="space-y-3">
            {['Blocked users won\'t be notified', 'They can\'t see your profile or activity',
              'Previous messages will be hidden', 'You can unblock them at any time'
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
