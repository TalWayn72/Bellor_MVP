/**
 * Subscriptions Service
 * Handles Stripe integration for premium subscriptions
 */

import Stripe from 'stripe';
import { prisma } from '../lib/prisma.js';
import { SubscriptionStatus, BillingCycle } from '@prisma/client';

// Initialize Stripe with API key from environment (only if configured)
const stripeApiKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeApiKey ? new Stripe(stripeApiKey) : null;

// Helper to check if Stripe is configured
const ensureStripeConfigured = () => {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  return stripe;
};

interface CreateCheckoutSessionInput {
  userId: string;
  planId: string;
  billingCycle: BillingCycle;
  successUrl: string;
  cancelUrl: string;
}

interface CreateCustomerPortalInput {
  userId: string;
  returnUrl: string;
}

export const SubscriptionsService = {
  /**
   * Get all subscription plans
   */
  async getPlans() {
    return prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  },

  /**
   * Get plan by ID
   */
  async getPlanById(planId: string) {
    return prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
  },

  /**
   * Get user's active subscription
   */
  async getUserSubscription(userId: string) {
    return prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
      },
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get or create Stripe customer for user
   */
  async getOrCreateStripeCustomer(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already has a subscription with Stripe customer ID
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        stripeCustomerId: { not: null },
      },
    });

    if (existingSubscription?.stripeCustomerId) {
      return existingSubscription.stripeCustomerId;
    }

    // Create new Stripe customer
    const stripeClient = ensureStripeConfigured();
    const customer = await stripeClient.customers.create({
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
      metadata: {
        userId: user.id,
      },
    });

    return customer.id;
  },

  /**
   * Create Stripe checkout session
   */
  async createCheckoutSession(input: CreateCheckoutSessionInput) {
    const { userId, planId, billingCycle, successUrl, cancelUrl } = input;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    // Get the correct Stripe price ID based on billing cycle
    const priceId = billingCycle === 'YEARLY'
      ? plan.stripePriceIdYearly
      : plan.stripePriceId;

    if (!priceId) {
      throw new Error('Stripe price not configured for this plan');
    }

    // Get or create Stripe customer
    const customerId = await this.getOrCreateStripeCustomer(userId);

    // Create checkout session
    const stripeClient = ensureStripeConfigured();
    const session = await stripeClient.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId,
        billingCycle,
      },
      subscription_data: {
        metadata: {
          userId,
          planId,
        },
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  },

  /**
   * Create customer portal session for managing subscription
   */
  async createCustomerPortalSession(input: CreateCustomerPortalInput) {
    const { userId, returnUrl } = input;

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        stripeCustomerId: { not: null },
      },
    });

    if (!subscription?.stripeCustomerId) {
      throw new Error('No active subscription found');
    }

    const stripeClient = ensureStripeConfigured();
    const session = await stripeClient.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return {
      url: session.url,
    };
  },

  /**
   * Handle Stripe webhook: checkout.session.completed
   */
  async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    const billingCycle = session.metadata?.billingCycle as BillingCycle || 'MONTHLY';

    if (!userId || !planId) {
      throw new Error('Missing metadata in checkout session');
    }

    const stripeClient = ensureStripeConfigured();
    const stripeSubscription = await stripeClient.subscriptions.retrieve(
      session.subscription as string
    ) as any;

    // Create subscription record
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: stripeSubscription.id,
        status: 'ACTIVE',
        billingCycle,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    // Update user premium status
    await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        premiumExpiresAt: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    return subscription;
  },

  /**
   * Handle Stripe webhook: invoice.payment_succeeded
   */
  async handlePaymentSucceeded(invoice: any) {
    const stripeSubscriptionId = invoice.subscription as string;

    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId },
    });

    if (!subscription) {
      return null;
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        amount: invoice.amount_paid / 100, // Convert from cents
        currency: invoice.currency.toUpperCase(),
        stripePaymentIntentId: invoice.payment_intent as string,
        stripeInvoiceId: invoice.id,
        status: 'SUCCEEDED',
        paidAt: new Date(),
      },
    });

    // Update subscription period
    const stripeClient = ensureStripeConfigured();
    const stripeSubscription = await stripeClient.subscriptions.retrieve(stripeSubscriptionId) as any;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    // Update user premium status
    await prisma.user.update({
      where: { id: subscription.userId },
      data: {
        isPremium: true,
        premiumExpiresAt: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    return payment;
  },

  /**
   * Handle Stripe webhook: invoice.payment_failed
   */
  async handlePaymentFailed(invoice: any) {
    const stripeSubscriptionId = invoice.subscription as string;

    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId },
    });

    if (!subscription) {
      return null;
    }

    // Create failed payment record
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        amount: invoice.amount_due / 100,
        currency: invoice.currency.toUpperCase(),
        stripePaymentIntentId: invoice.payment_intent as string,
        stripeInvoiceId: invoice.id,
        status: 'FAILED',
      },
    });

    // Update subscription status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'PAST_DUE',
      },
    });

    return subscription;
  },

  /**
   * Handle Stripe webhook: customer.subscription.updated
   */
  async handleSubscriptionUpdated(stripeSubscription: any) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      return null;
    }

    // Map Stripe status to our status
    const statusMap: Record<string, SubscriptionStatus> = {
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      canceled: 'CANCELED',
      unpaid: 'PAST_DUE',
      trialing: 'TRIALING',
      paused: 'PAUSED',
    };

    const status = statusMap[stripeSubscription.status] || 'ACTIVE';

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        canceledAt: stripeSubscription.canceled_at
          ? new Date(stripeSubscription.canceled_at * 1000)
          : null,
      },
    });

    // Update user premium status based on subscription status
    const isPremium = ['ACTIVE', 'TRIALING', 'PAST_DUE'].includes(status);

    await prisma.user.update({
      where: { id: subscription.userId },
      data: {
        isPremium,
        premiumExpiresAt: isPremium
          ? new Date(stripeSubscription.current_period_end * 1000)
          : null,
      },
    });

    return subscription;
  },

  /**
   * Handle Stripe webhook: customer.subscription.deleted
   */
  async handleSubscriptionDeleted(stripeSubscription: any) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      return null;
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });

    // Remove user premium status
    await prisma.user.update({
      where: { id: subscription.userId },
      data: {
        isPremium: false,
        premiumExpiresAt: null,
      },
    });

    return subscription;
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
      },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    // Cancel in Stripe
    const stripeClient = ensureStripeConfigured();
    const stripeSubscription = await stripeClient.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: cancelAtPeriodEnd,
      }
    ) as any;

    // Update local subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: cancelAtPeriodEnd,
        canceledAt: cancelAtPeriodEnd ? null : new Date(),
        status: cancelAtPeriodEnd ? subscription.status : 'CANCELED',
      },
    });

    return {
      success: true,
      cancelAtPeriodEnd,
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    };
  },

  /**
   * Reactivate canceled subscription
   */
  async reactivateSubscription(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        cancelAtPeriodEnd: true,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No subscription to reactivate');
    }

    // Reactivate in Stripe
    const stripeClient = ensureStripeConfigured();
    await stripeClient.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    // Update local subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
    });

    return { success: true };
  },

  /**
   * Get user's payment history
   */
  async getPaymentHistory(userId: string, limit: number = 10) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });
  },

  /**
   * Admin: Create subscription plan
   */
  async createPlan(data: {
    name: string;
    description?: string;
    price: number;
    priceYearly?: number;
    features: string[];
    isPopular?: boolean;
    sortOrder?: number;
  }) {
    // Create product in Stripe
    const stripeClient = ensureStripeConfigured();
    const product = await stripeClient.products.create({
      name: data.name,
      description: data.description,
    });

    // Create monthly price
    const monthlyPrice = await stripeClient.prices.create({
      product: product.id,
      unit_amount: Math.round(data.price * 100), // Convert to cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });

    // Create yearly price if provided
    let yearlyPrice = null;
    if (data.priceYearly) {
      yearlyPrice = await stripeClient.prices.create({
        product: product.id,
        unit_amount: Math.round(data.priceYearly * 100),
        currency: 'usd',
        recurring: {
          interval: 'year',
        },
      });
    }

    // Create plan in database
    return prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        priceYearly: data.priceYearly,
        features: data.features,
        stripeProductId: product.id,
        stripePriceId: monthlyPrice.id,
        stripePriceIdYearly: yearlyPrice?.id,
        isPopular: data.isPopular || false,
        sortOrder: data.sortOrder || 0,
      },
    });
  },

  /**
   * Verify Stripe webhook signature
   */
  constructWebhookEvent(payload: string | Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    const stripeClient = ensureStripeConfigured();
    return stripeClient.webhooks.constructEvent(payload, signature, webhookSecret);
  },
};
