import React from 'react';
import { userService } from '@/api';
import { Ban, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BlockedUserCard({ block, onUnblock, isPending }) {
  const [user, setUser] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await userService.getUserById(block.blocked_id);
        if (result.user) setUser(result.user);
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
