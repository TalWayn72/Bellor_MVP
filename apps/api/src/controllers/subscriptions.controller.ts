/**
 * Subscriptions Controller
 * User handlers: getPlans, subscribe, cancel, reactivate, payment history
 * Admin handlers delegated to subscriptions/subscriptions-admin.controller.ts
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { SubscriptionsService } from '../services/subscriptions.service.js';
import { BillingCycle } from '@prisma/client';
import { SubscriptionsAdminController } from './subscriptions/subscriptions-admin.controller.js';

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

export const SubscriptionsController = {
  async getPlans(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const plans = await SubscriptionsService.getPlans();
      return reply.send({ plans });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  async getPlanById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    try {
      const plan = await SubscriptionsService.getPlanById(id);
      if (!plan) return reply.status(404).send({ error: 'Plan not found' });
      return reply.send({ plan });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  async getMySubscription(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.id;
    try {
      const subscription = await SubscriptionsService.getUserSubscription(userId);
      return reply.send({ subscription });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  async createCheckoutSession(
    request: FastifyRequest<{ Body: CreateCheckoutBody }>, reply: FastifyReply
  ) {
    const userId = request.user!.id;
    const { planId, billingCycle, successUrl, cancelUrl } = request.body;

    if (!planId || !successUrl || !cancelUrl) {
      return reply.status(400).send({ error: 'Missing required fields: planId, successUrl, cancelUrl' });
    }

    try {
      const session = await SubscriptionsService.createCheckoutSession({
        userId, planId, billingCycle: billingCycle || 'MONTHLY', successUrl, cancelUrl,
      });
      return reply.send(session);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  },

  async createPortalSession(
    request: FastifyRequest<{ Body: CreatePortalBody }>, reply: FastifyReply
  ) {
    const userId = request.user!.id;
    const { returnUrl } = request.body;
    if (!returnUrl) return reply.status(400).send({ error: 'Missing returnUrl' });

    try {
      const session = await SubscriptionsService.createCustomerPortalSession({ userId, returnUrl });
      return reply.send(session);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  },

  async cancelSubscription(
    request: FastifyRequest<{ Body: CancelSubscriptionBody }>, reply: FastifyReply
  ) {
    const userId = request.user!.id;
    const { cancelAtPeriodEnd = true } = request.body || {};

    try {
      const result = await SubscriptionsService.cancelSubscription(userId, cancelAtPeriodEnd);
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  },

  async reactivateSubscription(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.id;
    try {
      const result = await SubscriptionsService.reactivateSubscription(userId);
      return reply.send(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  },

  async getPaymentHistory(
    request: FastifyRequest<{ Querystring: { limit?: number } }>, reply: FastifyReply
  ) {
    const userId = request.user!.id;
    const { limit = 10 } = request.query;
    try {
      const payments = await SubscriptionsService.getPaymentHistory(userId, Number(limit));
      return reply.send({ payments });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: message });
    }
  },

  // Delegated admin handlers
  createPlan: SubscriptionsAdminController.createPlan,
  handleStripeWebhook: SubscriptionsAdminController.handleStripeWebhook,
};
