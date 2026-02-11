/**
 * useRealtimeNotifications Hook
 * Real-time notification updates
 */

import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socketService';

export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Get initial unread count
    socketService.connect()
      .then(() => socketService.getUnreadCount())
      .then((response) => {
        if (response.success && response.data) {
          setUnreadCount(response.data.unreadCount ?? 0);
        }
      })
      .catch(console.error);

    // Listen for new notifications
    const handleNewNotification = (data) => {
      setNotifications((prev) => [data.notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleNotificationRead = (data) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === data.notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const unsubNew = socketService.on('notification:new', handleNewNotification);
    const unsubRead = socketService.on('notification:read', handleNotificationRead);

    return () => {
      unsubNew();
      unsubRead();
    };
  }, []);

  const markAsRead = useCallback((notificationId) => {
    socketService.emit('notification:read', { notificationId }, () => {});
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, markAsRead, clearAll };
}
