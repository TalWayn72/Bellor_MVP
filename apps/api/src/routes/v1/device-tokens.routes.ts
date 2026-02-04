/**
 * Device Tokens Routes
 * API endpoints for push notification device management
 */

import { FastifyInstance } from 'fastify';
import { DeviceTokensController } from '../../controllers/device-tokens.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

export default async function deviceTokensRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('preHandler', authenticate);

  // Register device for push notifications
  app.post('/register', DeviceTokensController.registerDevice);

  // Unregister device
  app.post('/unregister', DeviceTokensController.unregisterDevice);

  // Get my registered devices
  app.get('/my', DeviceTokensController.getMyDevices);

  // Send test notification (development)
  app.post('/test', DeviceTokensController.sendTestNotification);

  // Admin: Send broadcast
  app.post('/broadcast', DeviceTokensController.sendBroadcast);

  // Admin: Cleanup inactive tokens
  app.post('/cleanup', DeviceTokensController.cleanupInactiveTokens);
}
