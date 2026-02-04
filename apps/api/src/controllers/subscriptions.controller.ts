/**
 * Subscriptions Controller
 * HTTP handlers for subscription/premium API
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { SubscriptionsService } from '../services/subscriptions.service.js';
import { BillingCycle } from '@prisma/client';

interface CreateCheckoutBody {
  planId: string;
  billingCycle: BillingCycle;
  successUrl: string;
  cancelUrl: string;
}

interface CreatePortalBody {
  returnUrl: string;
}

interface CancelSubscriptionBody {
  cancelAtPeriodEnd?: boolean;
}

interface CreatePlanBody {
  name: string;
  description?: string;
  price: number;
  priceYearly?: number;
  features: string[];
  isPopular?: boolean;
  sortOrder?: number;
}

export const SubscriptionsController = {
  /**
   * Get available subscription plans
   * GET /subscriptions/plans
   */
  async getPlans(
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const plans = await SubscriptionsService.getPlans();
      return reply.send({ plans });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  },

  /**
   * Get plan by ID
   * GET /subscriptions/plans/:id
   */
  async getPlanById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    try {
      const plan = await SubscriptionsService.getPlanById(id);

      if (!plan) {
        return reply.status(404).send({ error: 'Plan not found' });
      }

      return reply.send({ plan });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  },

  /**
   * Get current user's subscription
   * GET /subscriptions/my
   */
  async getMySubscription(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const userId = (request.user as any).id;

    try {
      const subscription = await SubscriptionsService.getUserSubscription(userId);
      return reply.send({ subscription });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  },

  /**
   * Create Stripe checkout session
   * POST /subscriptions/checkout
   */
  async createCheckoutSession(
    request: FastifyRequest<{ Body: CreateCheckoutBody }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any).id;
    const { planId, billingCycle, successUrl, cancelUrl } = request.body;

    if (!planId || !successUrl || !cancelUrl) {
      return reply.status(400).send({
        error: 'Missing required fields: planId, successUrl, cancelUrl',
      });
    }

    try {
      const session = await SubscriptionsService.createCheckoutSession({
        userId,
        planId,
        billingCycle: billingCycle || 'MONTHLY',
        successUrl,
        cancelUrl,
      });

      return reply.send(session);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  },

  /**
   * Create Stripe customer portal session
   * POST /subscriptions/portal
   */
  async createPortalSession(
    request: FastifyRequest<{ Body: CreatePortalBody }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any).id;
    const { returnUrl } = request.body;

    if (!returnUrl) {
      return reply.status(400).send({ error: 'Missing returnUrl' });
    }

    try {
      const session = await SubscriptionsService.createCustomerPortalSession({
        userId,
        returnUrl,
      });

      return reply.send(session);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  },

  /**
   * Cancel subscription
   * POST /subscriptions/cancel
   */
  async cancelSubscription(
    request: FastifyRequest<{ Body: CancelSubscriptionBody }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any).id;
    const { cancelAtPeriodEnd = true } = request.body || {};

    try {
      const result = await SubscriptionsService.cancelSubscription(
        userId,
        cancelAtPeriodEnd
      );
      return reply.send(result);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  },

  /**
   * Reactivate subscription
   * POST /subscriptions/reactivate
   */
  async reactivateSubscription(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const userId = (request.user as any).id;

    try {
      const result = await SubscriptionsService.reactivateSubscription(userId);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  },

  /**
   * Get payment history
   * GET /subscriptions/payments
   */
  async getPaymentHistory(
    request: FastifyRequest<{ Querystring: { limit?: number } }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any).id;
    const { limit = 10 } = request.query;

    try {
      const payments = await SubscriptionsService.getPaymentHistory(
        userId,
        Number(limit)
      );
      return reply.send({ payments });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  },

  /**
   * Admin: Create subscription plan
   * POST /subscriptions/plans (admin only)
   */
  async createPlan(
    request: FastifyRequest<{ Body: CreatePlanBody }>,
    reply: FastifyReply
  ) {
    const user = request.user as any;

    if (!user.isAdmin) {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    const { name, description, price, priceYearly, features, isPopular, sortOrder } =
      request.body;

    if (!name || !price || !features) {
      return reply.status(400).send({
        error: 'Missing required fields: name, price, features',
      });
    }

    try {
      const plan = await SubscriptionsService.createPlan({
        name,
        description,
        price,
        priceYearly,
        features,
        isPopular,
        sortOrder,
      });

      return reply.status(201).send({ plan });
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  },

  /**
   * Handle Stripe webhook
   * POST /webhooks/stripe
   */
  async handleStripeWebhook(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const signature = request.headers['stripe-signature'];

    if (!signature) {
      return reply.status(400).send({ error: 'Missing stripe-signature header' });
    }

    try {
      // Get raw body for signature verification
      const rawBody = (request as any).rawBody || request.body;
      const event = SubscriptionsService.constructWebhookEvent(
        rawBody,
        signature as string
      );

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed':
          await SubscriptionsService.handleCheckoutCompleted(
            event.data.object as any
          );
          break;

        case 'invoice.payment_succeeded':
          await SubscriptionsService.handlePaymentSucceeded(
            event.data.object as any
          );
          break;

        case 'invoice.payment_failed':
          await SubscriptionsService.handlePaymentFailed(
            event.data.object as any
          );
          break;

        case 'customer.subscription.updated':
          await SubscriptionsService.handleSubscriptionUpdated(
            event.data.object as any
          );
          break;

        case 'customer.subscription.deleted':
          await SubscriptionsService.handleSubscriptionDeleted(
            event.data.object as any
          );
          break;

        default:
          console.log(`Unhandled Stripe event type: ${event.type}`);
      }

      return reply.send({ received: true });
    } catch (error: any) {
      console.error('Stripe webhook error:', error);
      return reply.status(400).send({ error: error.message });
    }
  },
};
