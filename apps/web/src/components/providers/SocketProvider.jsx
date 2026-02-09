/**
 * Socket Provider
 * Manages WebSocket connection at the app level
 */

import React, { createContext, useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { socketService } from '@/api/services/socketService';
import { tokenStorage } from '@/api/client/tokenStorage';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const heartbeatIntervalRef = useRef(null);

  // Connect socket when user is authenticated
  useEffect(() => {
    let isMounted = true;

    const connectSocket = async () => {
      if (!tokenStorage.isAuthenticated()) {
        if (isMounted) {
          setIsConnected(false);
        }
        return;
      }

      try {
        await socketService.connect();
        if (isMounted) {
          setIsConnected(true);
          setError(null);
        }

        // Get initial unread count
        const unreadResponse = await socketService.getUnreadCount();
        if (unreadResponse.success && isMounted) {
          setUnreadChatCount(unreadResponse.data.unreadCount);
        }
      } catch (err) {
        console.error('Socket connection error:', err);
        if (isMounted) {
          setError(err.message);
          setIsConnected(false);
        }
      }
    };

    connectSocket();

    // Setup event listeners
    const handleConnect = () => {
      if (isMounted) {
        setIsConnected(true);
        setError(null);
      }
    };

    const handleDisconnect = () => {
      if (isMounted) {
        setIsConnected(false);
      }
    };

    const handleError = (err) => {
      if (isMounted) {
        setError(err?.message || 'Connection error');
      }
    };

    // Listen for new messages to update unread count
    const handleNewMessage = (data) => {
      // Increment unread count when receiving a message
      if (isMounted) {
        setUnreadChatCount((prev) => prev + 1);
      }
    };

    const handleMessageRead = () => {
      // Decrement unread count when message is read
      if (isMounted) {
        setUnreadChatCount((prev) => Math.max(0, prev - 1));
      }
    };

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('connect_error', handleError);
    socketService.on('chat:message:new', handleNewMessage);
    socketService.on('chat:message:read', handleMessageRead);

    // Heartbeat to maintain presence - store in ref to ensure cleanup
    heartbeatIntervalRef.current = setInterval(() => {
      if (socketService.isConnected()) {
        socketService.sendHeartbeat();
      }
    }, 30000);

    return () => {
      isMounted = false;

      // Clear heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('connect_error', handleError);
      socketService.off('chat:message:new', handleNewMessage);
      socketService.off('chat:message:read', handleMessageRead);
    };
  }, []);

  // Disconnect when user logs out
  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
    setUnreadChatCount(0);
  }, []);

  // Reconnect socket
  const reconnect = useCallback(async () => {
    try {
      await socketService.connect();
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Refresh unread count
  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await socketService.getUnreadCount();
      if (response.success) {
        setUnreadChatCount(response.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to refresh unread count:', err);
    }
  }, []);

  const value = useMemo(() => ({
    isConnected,
    error,
    unreadChatCount,
    disconnect,
    reconnect,
    refreshUnreadCount,
    socketService,
  }), [isConnected, error, unreadChatCount, disconnect, reconnect, refreshUnreadCount]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}
