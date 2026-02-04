import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/api';
import { useSocketContext } from '@/components/providers/SocketProvider';

export default function NotificationBadge({ userId, className = '' }) {
  // Use socket context for real-time unread count
  const { unreadChatCount, isConnected } = useSocketContext();

  // Fallback to REST API if socket not connected
  const { data: apiUnreadCount = 0 } = useQuery({
    queryKey: ['unreadNotifications', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const result = await notificationService.getUnreadCount();
      return result.count || 0;
    },
    enabled: !!userId && !isConnected,
    refetchInterval: 30000,
  });

  // Use socket count if connected, otherwise use API count
  const unreadCount = isConnected ? unreadChatCount : apiUnreadCount;

  if (unreadCount === 0) return null;

  return (
    <div className={`absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center ${className}`}>
      <span className="text-xs text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
    </div>
  );
}
