/**
 * Subscriptions Service - Barrel file
 * Re-exports all subscription operations for backward compatibility
 */

import { SubscriptionWebhooks } from './subscriptions/subscriptions-webhooks.service.js';
import { SubscriptionsQueries } from './subscriptions/subscriptions-queries.service.js';
import { SubscriptionsManagement } from './subscriptions/subscriptions-management.service.js';

// Re-export sub-modules for backward compatibility
export { SubscriptionWebhooks } from './subscriptions/subscriptions-webhooks.service.js';
export * from './subscriptions/subscriptions.types.js';

export const SubscriptionsService = {
  // Delegated webhook handlers
  handleCheckoutCompleted: SubscriptionWebhooks.handleCheckoutCompleted,
  handlePaymentSucceeded: SubscriptionWebhooks.handlePaymentSucceeded,
  handlePaymentFailed: SubscriptionWebhooks.handlePaymentFailed,
  handleSubscriptionUpdated: SubscriptionWebhooks.handleSubscriptionUpdated,
  handleSubscriptionDeleted: SubscriptionWebhooks.handleSubscriptionDeleted,

  // Query operations
  getPlans: SubscriptionsQueries.getPlans,
  getPlanById: SubscriptionsQueries.getPlanById,
  getUserSubscription: SubscriptionsQueries.getUserSubscription,
  getPaymentHistory: SubscriptionsQueries.getPaymentHistory,
  constructWebhookEvent: SubscriptionsQueries.constructWebhookEvent,

  // Management operations
  getOrCreateStripeCustomer: SubscriptionsManagement.getOrCreateStripeCustomer.bind(SubscriptionsManagement),
  createCheckoutSession: SubscriptionsManagement.createCheckoutSession.bind(SubscriptionsManagement),
  createCustomerPortalSession: SubscriptionsManagement.createCustomerPortalSession.bind(SubscriptionsManagement),
  cancelSubscription: SubscriptionsManagement.cancelSubscription.bind(SubscriptionsManagement),
  reactivateSubscription: SubscriptionsManagement.reactivateSubscription.bind(SubscriptionsManagement),
  createPlan: SubscriptionsManagement.createPlan.bind(SubscriptionsManagement),
};
