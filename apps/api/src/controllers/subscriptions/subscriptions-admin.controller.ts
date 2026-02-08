/**
 * Subscriptions Admin Controller
 * Admin handlers: create plans, Stripe webhook
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { SubscriptionsService } from '../../services/subscriptions.service.js';
import Stripe from 'stripe';

interface CreatePlanBody {
  name: string;
  description?: string;
  price: number;
  priceYearly?: number;
  features: string[];
  isPopular?: boolean;
  sortOrder?: number;
}

export const SubscriptionsAdminController = {
  /**
   * Admin: Create subscription plan
   * POST /subscriptions/plans (admin only)
   */
  async createPlan(
    request: FastifyRequest<{ Body: CreatePlanBody }>,
    reply: FastifyReply
  ) {
    const user = request.user as unknown as { id: string; isAdmin?: boolean };

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
        name, description, price, priceYearly, features, isPopular, sortOrder,
      });

      return reply.status(201).send({ plan });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
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
      const rawBody = (request as unknown as { rawBody?: string }).rawBody || (request.body as string);
      const event = SubscriptionsService.constructWebhookEvent(
        rawBody,
        signature as string
      );

      switch (event.type) {
        case 'checkout.session.completed':
          await SubscriptionsService.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'invoice.payment_succeeded':
          await SubscriptionsService.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await SubscriptionsService.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'customer.subscription.updated':
          await SubscriptionsService.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await SubscriptionsService.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        default:
          console.log(`Unhandled Stripe event type: ${event.type}`);
      }

      return reply.send({ received: true });
    } catch (error: unknown) {
      console.error('Stripe webhook error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  },
};
