/**
 * Socket Event Handlers
 * Creates event handler functions for socket connection lifecycle.
 */

/**
 * Create socket event handlers bound to React state setters
 */
export function createSocketEventHandlers(setIsConnected, setError, setUnreadChatCount) {
  const handleConnect = () => {
    setIsConnected(true);
    setError(null);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  const handleError = (err) => {
    setError(err?.message || 'Connection error');
  };

  const handleNewMessage = () => {
    setUnreadChatCount((prev) => prev + 1);
  };

  const handleMessageRead = () => {
    setUnreadChatCount((prev) => Math.max(0, prev - 1));
  };

  return {
    handleConnect,
    handleDisconnect,
    handleError,
    handleNewMessage,
    handleMessageRead,
  };
}

/**
 * Register all socket event listeners
 */
export function registerSocketListeners(socketService, handlers) {
  socketService.on('connect', handlers.handleConnect);
  socketService.on('disconnect', handlers.handleDisconnect);
  socketService.on('connect_error', handlers.handleError);
  socketService.on('chat:message:new', handlers.handleNewMessage);
  socketService.on('chat:message:read', handlers.handleMessageRead);
}

/**
 * Remove all socket event listeners
 */
export function removeSocketListeners(socketService, handlers) {
  socketService.off('connect', handlers.handleConnect);
  socketService.off('disconnect', handlers.handleDisconnect);
  socketService.off('connect_error', handlers.handleError);
  socketService.off('chat:message:new', handlers.handleNewMessage);
  socketService.off('chat:message:read', handlers.handleMessageRead);
}
