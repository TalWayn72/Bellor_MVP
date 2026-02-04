/**
 * Subscriptions Routes
 * API endpoints for premium subscription management
 */

import { FastifyInstance } from 'fastify';
import { SubscriptionsController } from '../../controllers/subscriptions.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

export default async function subscriptionsRoutes(app: FastifyInstance) {
  // Public routes - get available plans
  app.get('/plans', SubscriptionsController.getPlans);
  app.get('/plans/:id', SubscriptionsController.getPlanById);

  // Protected routes - require authentication
  app.register(async (protectedApp) => {
    protectedApp.addHook('preHandler', authenticate);

    // Get my subscription
    protectedApp.get('/my', SubscriptionsController.getMySubscription);

    // Create checkout session
    protectedApp.post('/checkout', SubscriptionsController.createCheckoutSession);

    // Create customer portal session
    protectedApp.post('/portal', SubscriptionsController.createPortalSession);

    // Cancel subscription
    protectedApp.post('/cancel', SubscriptionsController.cancelSubscription);

    // Reactivate subscription
    protectedApp.post('/reactivate', SubscriptionsController.reactivateSubscription);

    // Get payment history
    protectedApp.get('/payments', SubscriptionsController.getPaymentHistory);

    // Admin: Create plan
    protectedApp.post('/plans', SubscriptionsController.createPlan);
  });
}
