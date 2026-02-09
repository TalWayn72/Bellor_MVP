/**
 * Chat Messages Service - Barrel file
 * Re-exports all message operations for backward compatibility
 */

// Types
export type {
  GetMessagesOptions,
  SendMessageData,
  FormattedMessage,
  GetMessagesResult,
} from './chat-messages.types.js';

// Queries
export { getMessages } from './chat-messages-queries.service.js';

// Mutations
export {
  sendMessage,
  markMessageAsRead,
  deleteMessage,
} from './chat-messages-mutations.service.js';
