/**
 * useSocket Hook
 * React hook for WebSocket connection and real-time features
 */

import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socketService';
import { tokenStorage } from '../client/tokenStorage';

// Re-export sub-hooks for backward compatibility
export { useChatRoom } from './useChatRoom';
export { usePresence } from './usePresence';
export { useRealtimeNotifications } from './useNotifications';

/**
 * Main socket connection hook
 * Manages connection lifecycle and provides socket state
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const isAuthenticated = tokenStorage.isAuthenticated();
    if (!isAuthenticated) return;

    socketService.connect()
      .then(() => { setIsConnected(true); setError(null); })
      .catch((err) => { setError(err.message); setIsConnected(false); });

    const handleConnect = () => { setIsConnected(true); setError(null); };
    const handleDisconnect = () => { setIsConnected(false); };
    const handleError = (err) => { setError(err.message); };

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('connect_error', handleError);

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
    try { await socketService.connect(); setIsConnected(true); setError(null); }
    catch (err) { setError(err.message); }
  }, []);

  return { isConnected, error, disconnect, reconnect, socket: socketService.getSocket() };
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
