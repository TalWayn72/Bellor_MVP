/**
 * Chat Routes - Barrel
 * Registers all chat sub-routes on the Fastify instance.
 *
 * Split into:
 * - chats-crud.routes.ts: get, create chat endpoints
 * - chats-messages.routes.ts: message operations, read receipts, deletion
 */

import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import chatsCrudRoutes from './chats-crud.routes.js';
import chatsMessagesRoutes from './chats-messages.routes.js';

export default async function chatsRoutes(app: FastifyInstance) {
  // Apply auth middleware to all chat routes
  app.addHook('preHandler', authMiddleware);

  // Register CRUD routes (GET/POST /chats, GET /chats/:chatId)
  await app.register(chatsCrudRoutes);

  // Register message routes (GET/POST/PATCH/DELETE /chats/:chatId/messages/*)
  await app.register(chatsMessagesRoutes);
}
