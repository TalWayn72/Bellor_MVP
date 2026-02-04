// API v1 Routes Index
// This file will be updated by agents to register all routes

import { FastifyInstance } from 'fastify';

export default async function v1Routes(app: FastifyInstance) {
  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }));

  // Auth routes (Agent 1)
  await app.register(import('./auth.routes.js'), { prefix: '/auth' });

  // Users routes (Agent 2)
  await app.register(import('./users.routes.js'), { prefix: '/users' });

  // Uploads routes (File storage)
  await app.register(import('./uploads.routes.js'), { prefix: '/uploads' });

  // OAuth routes (Google, etc.)
  await app.register(import('./oauth.routes.js'), { prefix: '/oauth' });

  // Missions routes
  await app.register(import('./missions.routes.js'), { prefix: '/missions' });

  // Responses routes
  await app.register(import('./responses.routes.js'), { prefix: '/responses' });

  // Stories routes (24-hour ephemeral content)
  await app.register(import('./stories.routes.js'), { prefix: '/stories' });

  // Reports routes (moderation)
  await app.register(import('./reports.routes.js'), { prefix: '/reports' });

  // Likes routes (romantic interest, positive feedback)
  await app.register(import('./likes.routes.js'), { prefix: '/likes' });

  // Follows routes (following users)
  await app.register(import('./follows.routes.js'), { prefix: '/follows' });

  // Notifications routes
  await app.register(import('./notifications.routes.js'), { prefix: '/notifications' });

  // Achievements routes
  await app.register(import('./achievements.routes.js'), { prefix: '/achievements' });

  // Admin routes (dashboard, analytics, moderation)
  await app.register(import('./admin.routes.js'), { prefix: '/admin' });

  // Subscriptions routes (premium, Stripe integration)
  await app.register(import('./subscriptions.routes.js'), { prefix: '/subscriptions' });

  // Device tokens routes (push notification registration)
  await app.register(import('./device-tokens.routes.js'), { prefix: '/device-tokens' });

  // Webhooks routes (Stripe, etc.)
  await app.register(import('./webhooks.routes.js'), { prefix: '/webhooks' });

  // Chats routes (messaging)
  await app.register(import('./chats.routes.js'), { prefix: '/chats' });
}
