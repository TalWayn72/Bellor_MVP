/**
 * Subscriptions Controller
 * User handlers: getPlans, subscribe, cancel, reactivate, payment history
 * Admin handlers delegated to subscriptions/subscriptions-admin.controller.ts
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { SubscriptionsService } from '../services/subscriptions.service.js';
import { SubscriptionsAdminController } from './subscriptions/subscriptions-admin.controller.js';
import {
  createCheckoutBodySchema,
  createPortalBodySchema,
  cancelSubscriptionBodySchema,
  paymentHistoryQuerySchema,
} from './subscriptions/subscriptions-schemas.js';

function zodError(reply: FastifyReply, error: z.ZodError) {
  return reply.status(400).send({ error: 'Validation failed', details: error.errors });
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

  async createCheckoutSession(request: FastifyRequest, reply: FastifyReply) {
    const result = createCheckoutBodySchema.safeParse(request.body);
    if (!result.success) return zodError(reply, result.error);

    const userId = request.user!.id;
    const { planId, billingCycle, successUrl, cancelUrl } = result.data;

    try {
      const session = await SubscriptionsService.createCheckoutSession({
        userId, planId, billingCycle, successUrl, cancelUrl,
      });
      return reply.send(session);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  },

  async createPortalSession(request: FastifyRequest, reply: FastifyReply) {
    const result = createPortalBodySchema.safeParse(request.body);
    if (!result.success) return zodError(reply, result.error);

    const userId = request.user!.id;

    try {
      const session = await SubscriptionsService.createCustomerPortalSession({
        userId, returnUrl: result.data.returnUrl,
      });
      return reply.send(session);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  },

  async cancelSubscription(request: FastifyRequest, reply: FastifyReply) {
    const result = cancelSubscriptionBodySchema.safeParse(request.body || {});
    if (!result.success) return zodError(reply, result.error);

    const userId = request.user!.id;

    try {
      const res = await SubscriptionsService.cancelSubscription(userId, result.data.cancelAtPeriodEnd);
      return reply.send(res);
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

  async getPaymentHistory(request: FastifyRequest, reply: FastifyReply) {
    const result = paymentHistoryQuerySchema.safeParse(request.query);
    if (!result.success) return zodError(reply, result.error);

    const userId = request.user!.id;
    try {
      const payments = await SubscriptionsService.getPaymentHistory(userId, result.data.limit);
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
