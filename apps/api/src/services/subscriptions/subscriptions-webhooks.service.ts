/** Stripe webhook handlers for subscriptions */
import Stripe from 'stripe';
import { prisma } from '../../lib/prisma.js';
import { SubscriptionStatus, BillingCycle } from '@prisma/client';
import { ensureStripeConfigured } from './subscriptions.types.js';

export const SubscriptionWebhooks = {
  /** Handle Stripe webhook: checkout.session.completed */
  async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    const billingCycle = session.metadata?.billingCycle as BillingCycle || 'MONTHLY';

    if (!userId || !planId) {
      throw new Error('Missing metadata in checkout session');
    }

    const stripeClient = ensureStripeConfigured();
    const stripeSub = await stripeClient.subscriptions.retrieve(session.subscription as string);

    const subscription = await prisma.subscription.create({
      data: {
        userId, planId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: stripeSub.id,
        status: 'ACTIVE', billingCycle,
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { isPremium: true, premiumExpiresAt: new Date(stripeSub.current_period_end * 1000) },
    });

    return subscription;
  },

  /** Handle Stripe webhook: invoice.payment_succeeded */
  async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const stripeSubscriptionId = invoice.subscription as string;
    const subscription = await prisma.subscription.findFirst({ where: { stripeSubscriptionId } });
    if (!subscription) return null;

    const payment = await prisma.payment.create({
      data: {
        subscriptionId: subscription.id, userId: subscription.userId,
        amount: invoice.amount_paid / 100, currency: invoice.currency.toUpperCase(),
        stripePaymentIntentId: invoice.payment_intent as string,
        stripeInvoiceId: invoice.id, status: 'SUCCEEDED', paidAt: new Date(),
      },
    });

    const stripeClient = ensureStripeConfigured();
    const stripeSub = await stripeClient.subscriptions.retrieve(stripeSubscriptionId);

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      },
    });

    await prisma.user.update({
      where: { id: subscription.userId },
      data: { isPremium: true, premiumExpiresAt: new Date(stripeSub.current_period_end * 1000) },
    });

    return payment;
  },

  /** Handle Stripe webhook: invoice.payment_failed */
  async handlePaymentFailed(invoice: Stripe.Invoice) {
    const stripeSubscriptionId = invoice.subscription as string;
    const subscription = await prisma.subscription.findFirst({ where: { stripeSubscriptionId } });
    if (!subscription) return null;

    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id, userId: subscription.userId,
        amount: invoice.amount_due / 100, currency: invoice.currency.toUpperCase(),
        stripePaymentIntentId: invoice.payment_intent as string,
        stripeInvoiceId: invoice.id, status: 'FAILED',
      },
    });

    await prisma.subscription.update({ where: { id: subscription.id }, data: { status: 'PAST_DUE' } });
    return subscription;
  },

  /** Handle Stripe webhook: customer.subscription.updated */
  async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });
    if (!subscription) return null;

    const statusMap: Record<string, SubscriptionStatus> = {
      active: 'ACTIVE', past_due: 'PAST_DUE', canceled: 'CANCELED',
      unpaid: 'PAST_DUE', trialing: 'TRIALING', paused: 'PAUSED',
    };
    const status = statusMap[stripeSubscription.status] || 'ACTIVE';

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
      },
    });

    const isPremium = ['ACTIVE', 'TRIALING', 'PAST_DUE'].includes(status);
    await prisma.user.update({
      where: { id: subscription.userId },
      data: {
        isPremium,
        premiumExpiresAt: isPremium ? new Date(stripeSubscription.current_period_end * 1000) : null,
      },
    });

    return subscription;
  },

  /** Handle Stripe webhook: customer.subscription.deleted */
  async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });
    if (!subscription) return null;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'CANCELED', canceledAt: new Date() },
    });

    await prisma.user.update({
      where: { id: subscription.userId },
      data: { isPremium: false, premiumExpiresAt: null },
    });

    return subscription;
  },
};
