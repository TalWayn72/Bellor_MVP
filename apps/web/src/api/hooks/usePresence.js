/**
 * usePresence Hook
 * Tracks online status of users
 */

import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socketService';

export function usePresence(userIds = []) {
  const [onlineStatus, setOnlineStatus] = useState({});

  useEffect(() => {
    if (!userIds.length) return;

    // Check initial online status
    socketService.connect()
      .then(() => socketService.checkUsersOnline(userIds))
      .then((response) => {
        if (response.success && response.data?.onlineUsers) {
          setOnlineStatus(response.data.onlineUsers);
        }
      })
      .catch(console.error);

    // Listen for online/offline events
    const handleUserOnline = (data) => {
      if (userIds.includes(data.userId)) {
        setOnlineStatus((prev) => ({ ...prev, [data.userId]: true }));
      }
    };

    const handleUserOffline = (data) => {
      if (userIds.includes(data.userId)) {
        setOnlineStatus((prev) => ({ ...prev, [data.userId]: false }));
      }
    };

    const unsubOnline = socketService.on('user:online', handleUserOnline);
    const unsubOffline = socketService.on('user:offline', handleUserOffline);

    return () => {
      unsubOnline();
      unsubOffline();
    };
  }, [userIds.join(',')]);

  const isOnline = useCallback((userId) => {
    if (!onlineStatus || typeof onlineStatus !== 'object') return false;
    return onlineStatus[userId] || false;
  }, [onlineStatus]);

  return { onlineStatus, isOnline };
}
