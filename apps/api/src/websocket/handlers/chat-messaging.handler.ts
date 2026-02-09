/**
 * Chat Messaging Handler - Barrel
 * Composes all messaging sub-handlers into a single setup function
 * Split files: chat-send, chat-read, chat-typing
 */

import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../index.js';
import { createSendMessageHandler } from './chat-send.handler.js';
import { createMessageReadHandler, createUnreadCountHandler } from './chat-read.handler.js';
import { createTypingHandler, createMessageDeleteHandler } from './chat-typing.handler.js';

// Re-export sub-handler creators for direct access
export { createSendMessageHandler } from './chat-send.handler.js';
export { createMessageReadHandler, createUnreadCountHandler } from './chat-read.handler.js';
export { createTypingHandler, createMessageDeleteHandler } from './chat-typing.handler.js';

/**
 * Setup message-related chat handlers
 * Returns cleanup function to remove all listeners
 */
export function setupChatMessagingHandlers(io: Server, socket: AuthenticatedSocket): () => void {
  const handleChatMessage = createSendMessageHandler(io, socket);
  const handleMessageRead = createMessageReadHandler(io, socket);
  const handleTyping = createTypingHandler(socket);
  const handleUnreadCount = createUnreadCountHandler(socket);
  const handleMessageDelete = createMessageDeleteHandler(io, socket);

  // Register event handlers
  socket.on('chat:message', handleChatMessage);
  socket.on('chat:message:read', handleMessageRead);
  socket.on('chat:typing', handleTyping);
  socket.on('chat:unread:count', handleUnreadCount);
  socket.on('chat:message:delete', handleMessageDelete);

  // Return cleanup function to remove all listeners
  return () => {
    socket.off('chat:message', handleChatMessage);
    socket.off('chat:message:read', handleMessageRead);
    socket.off('chat:typing', handleTyping);
    socket.off('chat:unread:count', handleUnreadCount);
    socket.off('chat:message:delete', handleMessageDelete);
  };
}
