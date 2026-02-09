/**
 * Socket Provider
 * Manages WebSocket connection at the app level
 */

import React, { createContext, useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { socketService } from '@/api/services/socketService';
import { tokenStorage } from '@/api/client/tokenStorage';
import { createSocketEventHandlers, registerSocketListeners, removeSocketListeners } from './socket-events';
import { connectSocket, startHeartbeat, reconnectSocket, refreshUnreadCount } from './socket-reconnection';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const heartbeatIntervalRef = useRef(null);

  // Connect socket when user is authenticated
  useEffect(() => {
    let isMounted = true;

    // Wrap state setters with mount guard
    const guardedSetIsConnected = (val) => { if (isMounted) setIsConnected(val); };
    const guardedSetError = (val) => { if (isMounted) setError(val); };
    const guardedSetUnreadChatCount = (val) => { if (isMounted) setUnreadChatCount(val); };

    const callbacks = {
      setIsConnected: guardedSetIsConnected,
      setError: guardedSetError,
      setUnreadChatCount: guardedSetUnreadChatCount,
    };

    connectSocket(socketService, tokenStorage, callbacks);

    // Setup event listeners with mount-guarded setters
    const handlers = createSocketEventHandlers(
      guardedSetIsConnected,
      guardedSetError,
      guardedSetUnreadChatCount
    );
    registerSocketListeners(socketService, handlers);

    // Heartbeat to maintain presence - store in ref to ensure cleanup
    heartbeatIntervalRef.current = startHeartbeat(socketService);

    return () => {
      isMounted = false;

      // Clear heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      removeSocketListeners(socketService, handlers);
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
    await reconnectSocket(socketService, setIsConnected, setError);
  }, []);

  // Refresh unread count
  const refreshUnread = useCallback(async () => {
    await refreshUnreadCount(socketService, setUnreadChatCount);
  }, []);

  const value = useMemo(() => ({
    isConnected,
    error,
    unreadChatCount,
    disconnect,
    reconnect,
    refreshUnreadCount: refreshUnread,
    socketService,
  }), [isConnected, error, unreadChatCount, disconnect, reconnect, refreshUnread]);

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
