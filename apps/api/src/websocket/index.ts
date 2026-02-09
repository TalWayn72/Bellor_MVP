/**
 * WebSocket Module - Barrel File
 * Re-exports all websocket functionality for backward compatibility
 */

// Auth types and middleware
export { AuthenticatedSocket, authMiddleware } from './websocket-auth.js';

// Server setup
export { setupWebSocket } from './websocket-server.js';

// Presence utilities
export {
  stopStaleSocketCleanup,
  setCleanupInterval,
  sendToUser,
  isUserOnline,
  getOnlineUsers,
  startStaleSocketCleanup,
} from './websocket-presence.js';
