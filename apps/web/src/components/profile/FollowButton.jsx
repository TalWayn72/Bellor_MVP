import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { followService } from '@/api';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck } from 'lucide-react';

export default function FollowButton({ targetUserId, currentUserId, variant = 'default' }) {
  const queryClient = useQueryClient();

  // Check if already following
  const { data: followRecord } = useQuery({
    queryKey: ['followStatus', currentUserId, targetUserId],
    queryFn: async () => {
      const result = await followService.isFollowing(targetUserId);
      return result.isFollowing ? { id: 'following' } : null;
    },
    enabled: !!currentUserId && !!targetUserId,
  });

  const isFollowing = !!followRecord;

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await followService.unfollowUser(targetUserId);
      } else {
        await followService.followUser(targetUserId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followStatus', currentUserId, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['followers', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['following', currentUserId] });
    },
  });

  if (currentUserId === targetUserId) {
    return null; // Can't follow yourself
  }

  return (
    <Button
      onClick={() => followMutation.mutate()}
      disabled={followMutation.isPending}
      variant={isFollowing ? 'outline' : variant}
      className={`flex items-center gap-2 ${
        isFollowing 
          ? 'border-2 border-gray-300' 
          : 'bg-gray-900 text-white hover:bg-gray-800'
      }`}
    >
      {isFollowing ? (
        <>
          <UserCheck className="w-4 h-4" />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span>Follow</span>
        </>
      )}
    </Button>
  );
}