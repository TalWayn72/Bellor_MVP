/**
 * Socket Reconnection & Lifecycle
 * Handles socket connection, disconnection, and heartbeat logic.
 */

/**
 * Connect socket and fetch initial unread count
 */
export async function connectSocket(socketService, tokenStorage, callbacks) {
  const { setIsConnected, setError, setUnreadChatCount } = callbacks;

  if (!tokenStorage.isAuthenticated()) {
    setIsConnected(false);
    return;
  }

  try {
    await socketService.connect();
    setIsConnected(true);
    setError(null);

    // Get initial unread count
    const unreadResponse = await socketService.getUnreadCount();
    if (unreadResponse.success) {
      setUnreadChatCount(unreadResponse.data.unreadCount);
    }
  } catch (err) {
    console.error('Socket connection error:', err);
    setError(err.message);
    setIsConnected(false);
  }
}

/**
 * Start heartbeat interval to maintain presence
 * Returns the interval ID for cleanup via stopHeartbeat()
 */
export function startHeartbeat(socketService, intervalMs = 30000) {
  return setInterval(() => {
    if (socketService.isConnected()) {
      socketService.sendHeartbeat();
    }
  }, intervalMs);
}

/**
 * Stop heartbeat interval
 */
export function stopHeartbeat(intervalId) {
  if (intervalId) {
    clearInterval(intervalId);
  }
}

/**
 * Reconnect socket after disconnection
 */
export async function reconnectSocket(socketService, setIsConnected, setError) {
  try {
    await socketService.connect();
    setIsConnected(true);
    setError(null);
  } catch (err) {
    setError(err.message);
  }
}

/**
 * Refresh unread message count from server
 */
export async function refreshUnreadCount(socketService, setUnreadChatCount) {
  try {
    const response = await socketService.getUnreadCount();
    if (response.success) {
      setUnreadChatCount(response.data.unreadCount);
    }
  } catch (err) {
    console.error('Failed to refresh unread count:', err);
  }
}
