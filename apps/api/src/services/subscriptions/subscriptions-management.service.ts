/** Subscriptions - Management: checkout, portal, cancel, reactivate, create plan */

import { prisma } from '../../lib/prisma.js';
import { stripeBreaker } from '../../lib/external-services.js';
import { ensureStripeConfigured, CreateCheckoutSessionInput, CreateCustomerPortalInput } from './subscriptions.types.js';

export const SubscriptionsManagement = {
  async getOrCreateStripeCustomer(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const existing = await prisma.subscription.findFirst({
      where: { userId, stripeCustomerId: { not: null } },
    });
    if (existing?.stripeCustomerId) return existing.stripeCustomerId;

    const stripeClient = ensureStripeConfigured();
    const customer = await stripeBreaker.execute(() =>
      stripeClient.customers.create({
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
        metadata: { userId: user.id },
      }),
    );
    return customer.id;
  },

  async createCheckoutSession(input: CreateCheckoutSessionInput) {
    const { userId, planId, billingCycle, successUrl, cancelUrl } = input;
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');

    const priceId = billingCycle === 'YEARLY' ? plan.stripePriceIdYearly : plan.stripePriceId;
    if (!priceId) throw new Error('Stripe price not configured for this plan');

    const customerId = await this.getOrCreateStripeCustomer(userId);
    const stripeClient = ensureStripeConfigured();
    const session = await stripeBreaker.execute(() =>
      stripeClient.checkout.sessions.create({
        customer: customerId, mode: 'subscription', payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`, cancel_url: cancelUrl,
        metadata: { userId, planId, billingCycle },
        subscription_data: { metadata: { userId, planId } },
      }),
    );
    return { sessionId: session.id, url: session.url };
  },

  async createCustomerPortalSession(input: CreateCustomerPortalInput) {
    const { userId, returnUrl } = input;
    const subscription = await prisma.subscription.findFirst({
      where: { userId, stripeCustomerId: { not: null } },
    });
    if (!subscription?.stripeCustomerId) throw new Error('No active subscription found');

    const stripeClient = ensureStripeConfigured();
    const session = await stripeBreaker.execute(() =>
      stripeClient.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId, return_url: returnUrl,
      }),
    );
    return { url: session.url };
  },

  async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true) {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } },
    });
    if (!subscription?.stripeSubscriptionId) throw new Error('No active subscription found');

    const stripeClient = ensureStripeConfigured();
    const stripeSub = await stripeBreaker.execute(() =>
      stripeClient.subscriptions.update(
        subscription.stripeSubscriptionId!, { cancel_at_period_end: cancelAtPeriodEnd },
      ),
    );

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd,
        canceledAt: cancelAtPeriodEnd ? null : new Date(),
        status: cancelAtPeriodEnd ? subscription.status : 'CANCELED',
      },
    });
    const periodEnd = typeof stripeSub.current_period_end === 'number'
      ? new Date(stripeSub.current_period_end * 1000)
      : new Date();
    return { success: true, cancelAtPeriodEnd, currentPeriodEnd: periodEnd };
  },

  async reactivateSubscription(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, cancelAtPeriodEnd: true, status: { in: ['ACTIVE', 'TRIALING'] } },
    });
    if (!subscription?.stripeSubscriptionId) throw new Error('No subscription to reactivate');

    const stripeClient = ensureStripeConfigured();
    await stripeBreaker.execute(() =>
      stripeClient.subscriptions.update(
        subscription.stripeSubscriptionId!, { cancel_at_period_end: false },
      ),
    );
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: false, canceledAt: null },
    });
    return { success: true };
  },

  async createPlan(data: {
    name: string; description?: string; price: number; priceYearly?: number;
    features: string[]; isPopular?: boolean; sortOrder?: number;
  }) {
    const s = ensureStripeConfigured();
    const product = await stripeBreaker.execute(() =>
      s.products.create({ name: data.name, description: data.description }),
    );
    const mp = await stripeBreaker.execute(() =>
      s.prices.create({
        product: product.id, unit_amount: Math.round(data.price * 100),
        currency: 'usd', recurring: { interval: 'month' },
      }),
    );
    let yp = null;
    if (data.priceYearly) {
      yp = await stripeBreaker.execute(() =>
        s.prices.create({
          product: product.id, unit_amount: Math.round(data.priceYearly! * 100),
          currency: 'usd', recurring: { interval: 'year' },
        }),
      );
    }
    return prisma.subscriptionPlan.create({
      data: {
        name: data.name, description: data.description, price: data.price,
        priceYearly: data.priceYearly, features: data.features,
        stripeProductId: product.id, stripePriceId: mp.id,
        stripePriceIdYearly: yp?.id, isPopular: data.isPopular || false,
        sortOrder: data.sortOrder || 0,
      },
    });
  },
};
