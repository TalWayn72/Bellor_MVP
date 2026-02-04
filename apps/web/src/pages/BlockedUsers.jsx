import React from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ban, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import BackButton from '@/components/navigation/BackButton';
import { ListSkeleton, EmptyState } from '@/components/states';

export default function BlockedUsers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isLoading } = useCurrentUser();

  const { data: blockedUsers = [] } = useQuery({
    queryKey: ['blockedUsers', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      try {
        const result = await userService.getBlockedUsers();
        return result.blockedUsers || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!currentUser,
  });

  const unblockMutation = useMutation({
    mutationFn: async (userId) => {
      await userService.unblockUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
    },
  });

  const handleUnblock = (blockId, userId) => {
    if (confirm('Are you sure you want to unblock this user?')) {
      unblockMutation.mutate(userId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ListSkeleton count={5} />
        </div>
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
          <EmptyState
            variant="default"
            title="No Blocked Users"
            description="When you block someone, they will appear here. Blocked users cannot see your profile or contact you."
            icon={Ban}
          />
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
                <BlockedUserItem
                  key={block.id}
                  block={block}
                  onUnblock={handleUnblock}
                  isPending={unblockMutation.isPending}
                />
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
            {[
              'Blocked users won\'t be notified',
              'They can\'t see your profile or activity',
              'Previous messages will be hidden',
              'You can unblock them at any time'
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

function BlockedUserItem({ block, onUnblock, isPending }) {
  const [user, setUser] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await userService.getUserById(block.blocked_id);
        if (result.user) {
          setUser(result.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [block.blocked_id]);

  return (
    <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <div className="relative">
          <img
            src={user?.profile_images?.[0] || `https://i.pravatar.cc/80?u=${block.blocked_id}`}
            alt="User"
            className="w-12 h-12 rounded-full object-cover border-2 border-border"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-destructive rounded-full flex items-center justify-center border-2 border-white">
            <Ban className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-foreground">
            {isLoading ? (
              <span className="inline-block w-24 h-4 bg-muted animate-pulse rounded"></span>
            ) : (
              user ? `${user.nickname || user.full_name}` : `User ${block.blocked_id.slice(0, 8)}`
            )}
          </h3>
          <p className="text-xs text-muted-foreground">
            Blocked on {new Date(block.created_date).toLocaleDateString('en-US')}
          </p>
        </div>
      </div>
      <Button
        onClick={() => onUnblock(block.id, block.blocked_id)}
        variant="outline"
        disabled={isPending}
        className="h-9 px-3 border-2 border-destructive text-destructive hover:bg-destructive hover:text-white transition-all hover:scale-105 active:scale-95"
      >
        {isPending ? (
          <div className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin"></div>
        ) : (
          <>
            <Trash2 className="w-3.5 h-3.5 ml-2" />
            <span className="text-xs font-medium">Unblock</span>
          </>
        )}
      </Button>
    </div>
  );
}
