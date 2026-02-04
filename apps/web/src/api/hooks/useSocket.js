/**
 * useSocket Hook
 * React hook for WebSocket connection and real-time features
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';
import { tokenStorage } from '../client/tokenStorage';

/**
 * Main socket connection hook
 * Manages connection lifecycle and provides socket state
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const isAuthenticated = tokenStorage.isAuthenticated();
    if (!isAuthenticated) {
      return;
    }

    // Connect on mount
    socketService.connect()
      .then(() => {
        setIsConnected(true);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setIsConnected(false);
      });

    // Listen for connection state changes
    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleError = (err) => {
      setError(err.message);
    };

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('connect_error', handleError);

    // Cleanup on unmount
    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('connect_error', handleError);
    };
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
  }, []);

  const reconnect = useCallback(async () => {
    try {
      await socketService.connect();
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return {
    isConnected,
    error,
    disconnect,
    reconnect,
    socket: socketService.getSocket(),
  };
}

/**
 * Chat room hook
 * Manages joining/leaving chat rooms and receiving messages
 */
export function useChatRoom(chatId) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const typingTimeoutRef = useRef({});

  // Join chat room
  useEffect(() => {
    if (!chatId) return;

    setLoading(true);
    socketService.connect()
      .then(() => socketService.joinChat(chatId))
      .then((response) => {
        if (response.success) {
          setIsJoined(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Cleanup: leave chat room
    return () => {
      socketService.leaveChat(chatId);
      setIsJoined(false);
      setMessages([]);
      setTypingUsers({});
    };
  }, [chatId]);

  // Listen for new messages
  useEffect(() => {
    if (!chatId) return;

    const handleNewMessage = (data) => {
      setMessages((prev) => [...prev, data.message]);
    };

    const handleMessageDeleted = (data) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    };

    const handleTyping = (data) => {
      if (data.chatId !== chatId) return;

      setTypingUsers((prev) => ({
        ...prev,
        [data.userId]: data.isTyping,
      }));

      // Clear typing indicator after 3 seconds
      if (data.isTyping) {
        if (typingTimeoutRef.current[data.userId]) {
          clearTimeout(typingTimeoutRef.current[data.userId]);
        }
        typingTimeoutRef.current[data.userId] = setTimeout(() => {
          setTypingUsers((prev) => ({
            ...prev,
            [data.userId]: false,
          }));
        }, 3000);
      }
    };

    const unsubMessage = socketService.on('chat:message:new', handleNewMessage);
    const unsubDeleted = socketService.on('chat:message:deleted', handleMessageDeleted);
    const unsubTyping = socketService.on('chat:typing', handleTyping);

    return () => {
      unsubMessage();
      unsubDeleted();
      unsubTyping();
      // Clear all typing timeouts
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
    };
  }, [chatId]);

  // Send message
  const sendMessage = useCallback(async (content, metadata = {}) => {
    if (!chatId) return;
    const response = await socketService.sendMessage(chatId, content, metadata);
    return response;
  }, [chatId]);

  // Send typing indicator
  const sendTyping = useCallback((isTyping) => {
    if (!chatId) return;
    socketService.sendTyping(chatId, isTyping);
  }, [chatId]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId) => {
    const response = await socketService.markMessageRead(messageId);
    return response;
  }, []);

  // Delete message
  const deleteMessage = useCallback(async (messageId) => {
    const response = await socketService.deleteMessage(messageId);
    return response;
  }, []);

  return {
    messages,
    typingUsers,
    isJoined,
    loading,
    sendMessage,
    sendTyping,
    markAsRead,
    deleteMessage,
  };
}

/**
 * Presence hook
 * Tracks online status of users
 */
export function usePresence(userIds = []) {
  const [onlineStatus, setOnlineStatus] = useState({});

  useEffect(() => {
    if (!userIds.length) return;

    // Check initial online status
    socketService.connect()
      .then(() => socketService.checkUsersOnline(userIds))
      .then((response) => {
        if (response.success) {
          setOnlineStatus(response.data.onlineUsers);
        }
      })
      .catch(console.error);

    // Listen for online/offline events
    const handleUserOnline = (data) => {
      if (userIds.includes(data.userId)) {
        setOnlineStatus((prev) => ({
          ...prev,
          [data.userId]: true,
        }));
      }
    };

    const handleUserOffline = (data) => {
      if (userIds.includes(data.userId)) {
        setOnlineStatus((prev) => ({
          ...prev,
          [data.userId]: false,
        }));
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
    return onlineStatus[userId] || false;
  }, [onlineStatus]);

  return {
    onlineStatus,
    isOnline,
  };
}

/**
 * Notifications hook
 * Real-time notification updates
 */
export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Get initial unread count
    socketService.connect()
      .then(() => socketService.getUnreadCount())
      .then((response) => {
        if (response.success) {
          setUnreadCount(response.data.unreadCount);
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

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
  };
}

/**
 * Heartbeat hook
 * Maintains presence by sending periodic heartbeats
 */
export function useHeartbeat(intervalMs = 30000) {
  useEffect(() => {
    const interval = setInterval(() => {
      if (socketService.isConnected()) {
        socketService.sendHeartbeat();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);
}
