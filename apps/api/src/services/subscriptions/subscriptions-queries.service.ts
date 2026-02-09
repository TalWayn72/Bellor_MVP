/**
 * Subscriptions - Query operations
 * Plans, user subscriptions, payment history, webhook event construction
 */

import { prisma } from '../../lib/prisma.js';
import { ensureStripeConfigured } from './subscriptions.types.js';

export const SubscriptionsQueries = {
  async getPlans() {
    return prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  },

  async getPlanById(planId: string) {
    return prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  },

  async getUserSubscription(userId: string) {
    return prisma.subscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getPaymentHistory(userId: string, limit: number = 10) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { subscription: { include: { plan: true } } },
    });
  },

  constructWebhookEvent(payload: string | Buffer, signature: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error('Stripe webhook secret not configured');
    return ensureStripeConfigured().webhooks.constructEvent(payload, signature, secret);
  },
};
