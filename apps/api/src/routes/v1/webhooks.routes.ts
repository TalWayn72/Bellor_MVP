/**
 * Webhooks Routes
 * API endpoints for external service webhooks (Stripe, etc.)
 */

import { FastifyInstance } from 'fastify';
import { SubscriptionsController } from '../../controllers/subscriptions.controller.js';

export default async function webhooksRoutes(app: FastifyInstance) {
  // Stripe webhook - no authentication, uses signature verification
  app.post('/stripe', SubscriptionsController.handleStripeWebhook);
}
