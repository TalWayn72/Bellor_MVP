/** Stripe webhook handlers for payment events */
import Stripe from 'stripe';
import { prisma } from '../../lib/prisma.js';
import { ensureStripeConfigured, StripeSubscriptionWithPeriod, StripeInvoiceWithRefs } from './subscriptions.types.js';

export const SubscriptionPaymentWebhooks = {
  /** Handle Stripe webhook: invoice.payment_succeeded */
  async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const invoiceWithRefs = invoice as StripeInvoiceWithRefs;
    const stripeSubscriptionId = (typeof invoiceWithRefs.subscription === 'string'
      ? invoiceWithRefs.subscription
      : invoiceWithRefs.subscription?.id) as string;
    const subscription = await prisma.subscription.findFirst({ where: { stripeSubscriptionId } });
    if (!subscription) return null;

    const paymentIntentId = typeof invoiceWithRefs.payment_intent === 'string'
      ? invoiceWithRefs.payment_intent
      : invoiceWithRefs.payment_intent?.id ?? null;

    const payment = await prisma.payment.create({
      data: {
        subscriptionId: subscription.id, userId: subscription.userId,
        amount: invoice.amount_paid / 100, currency: invoice.currency.toUpperCase(),
        stripePaymentIntentId: paymentIntentId,
        stripeInvoiceId: invoice.id, status: 'SUCCEEDED', paidAt: new Date(),
      },
    });

    const stripeClient = ensureStripeConfigured();
    const stripeSub = await stripeClient.subscriptions.retrieve(stripeSubscriptionId) as unknown as StripeSubscriptionWithPeriod;

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
    const invoiceWithRefs = invoice as StripeInvoiceWithRefs;
    const stripeSubscriptionId = (typeof invoiceWithRefs.subscription === 'string'
      ? invoiceWithRefs.subscription
      : invoiceWithRefs.subscription?.id) as string;
    const subscription = await prisma.subscription.findFirst({ where: { stripeSubscriptionId } });
    if (!subscription) return null;

    const paymentIntentId = typeof invoiceWithRefs.payment_intent === 'string'
      ? invoiceWithRefs.payment_intent
      : invoiceWithRefs.payment_intent?.id ?? null;

    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id, userId: subscription.userId,
        amount: invoice.amount_due / 100, currency: invoice.currency.toUpperCase(),
        stripePaymentIntentId: paymentIntentId,
        stripeInvoiceId: invoice.id, status: 'FAILED',
      },
    });

    await prisma.subscription.update({ where: { id: subscription.id }, data: { status: 'PAST_DUE' } });
    return subscription;
  },
};
