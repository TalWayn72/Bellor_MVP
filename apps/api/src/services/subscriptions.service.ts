/** Subscriptions Service - Handles Stripe integration for premium subscriptions */
import { prisma } from '../lib/prisma.js';
import { ensureStripeConfigured, CreateCheckoutSessionInput, CreateCustomerPortalInput } from './subscriptions/subscriptions.types.js';
import { SubscriptionWebhooks } from './subscriptions/subscriptions-webhooks.service.js';

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

  async getPlans() {
    return prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
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

  async getOrCreateStripeCustomer(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const existing = await prisma.subscription.findFirst({
      where: { userId, stripeCustomerId: { not: null } },
    });
    if (existing?.stripeCustomerId) return existing.stripeCustomerId;

    const stripeClient = ensureStripeConfigured();
    const customer = await stripeClient.customers.create({
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
      metadata: { userId: user.id },
    });
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
    const session = await stripeClient.checkout.sessions.create({
      customer: customerId, mode: 'subscription', payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`, cancel_url: cancelUrl,
      metadata: { userId, planId, billingCycle },
      subscription_data: { metadata: { userId, planId } },
    });
    return { sessionId: session.id, url: session.url };
  },

  async createCustomerPortalSession(input: CreateCustomerPortalInput) {
    const { userId, returnUrl } = input;
    const subscription = await prisma.subscription.findFirst({
      where: { userId, stripeCustomerId: { not: null } },
    });
    if (!subscription?.stripeCustomerId) throw new Error('No active subscription found');

    const stripeClient = ensureStripeConfigured();
    const session = await stripeClient.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId, return_url: returnUrl,
    });
    return { url: session.url };
  },

  async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true) {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } },
    });
    if (!subscription?.stripeSubscriptionId) throw new Error('No active subscription found');

    const stripeClient = ensureStripeConfigured();
    const stripeSub = await stripeClient.subscriptions.update(
      subscription.stripeSubscriptionId, { cancel_at_period_end: cancelAtPeriodEnd }
    ) as any;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd,
        canceledAt: cancelAtPeriodEnd ? null : new Date(),
        status: cancelAtPeriodEnd ? subscription.status : 'CANCELED',
      },
    });
    return { success: true, cancelAtPeriodEnd, currentPeriodEnd: new Date(stripeSub.current_period_end * 1000) };
  },

  async reactivateSubscription(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, cancelAtPeriodEnd: true, status: { in: ['ACTIVE', 'TRIALING'] } },
    });
    if (!subscription?.stripeSubscriptionId) throw new Error('No subscription to reactivate');

    const stripeClient = ensureStripeConfigured();
    await stripeClient.subscriptions.update(subscription.stripeSubscriptionId, { cancel_at_period_end: false });
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: false, canceledAt: null },
    });
    return { success: true };
  },

  async getPaymentHistory(userId: string, limit: number = 10) {
    return prisma.payment.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' }, take: limit,
      include: { subscription: { include: { plan: true } } },
    });
  },

  async createPlan(data: {
    name: string; description?: string; price: number; priceYearly?: number;
    features: string[]; isPopular?: boolean; sortOrder?: number;
  }) {
    const s = ensureStripeConfigured();
    const product = await s.products.create({ name: data.name, description: data.description });
    const mp = await s.prices.create({ product: product.id, unit_amount: Math.round(data.price * 100), currency: 'usd', recurring: { interval: 'month' } });
    let yp = null;
    if (data.priceYearly) {
      yp = await s.prices.create({ product: product.id, unit_amount: Math.round(data.priceYearly * 100), currency: 'usd', recurring: { interval: 'year' } });
    }
    return prisma.subscriptionPlan.create({
      data: { name: data.name, description: data.description, price: data.price, priceYearly: data.priceYearly, features: data.features, stripeProductId: product.id, stripePriceId: mp.id, stripePriceIdYearly: yp?.id, isPopular: data.isPopular || false, sortOrder: data.sortOrder || 0 },
    });
  },

  constructWebhookEvent(payload: string | Buffer, signature: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error('Stripe webhook secret not configured');
    return ensureStripeConfigured().webhooks.constructEvent(payload, signature, secret);
  },
};
