/**
 * Subscriptions types and Stripe initialization
 */

import Stripe from 'stripe';
import { BillingCycle } from '@prisma/client';

// Initialize Stripe with API key from environment (only if configured)
const stripeApiKey = process.env.STRIPE_SECRET_KEY;
export const stripe = stripeApiKey ? new Stripe(stripeApiKey) : null;

/** Helper to check if Stripe is configured */
export const ensureStripeConfigured = () => {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  return stripe;
};

export interface CreateCheckoutSessionInput {
  userId: string;
  planId: string;
  billingCycle: BillingCycle;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCustomerPortalInput {
  userId: string;
  returnUrl: string;
}

/**
 * Stripe Subscription with legacy period fields.
 * The current_period_start/end fields exist in the Stripe API response
 * but may not be present in newer @types/stripe versions.
 */
export interface StripeSubscriptionWithPeriod extends Stripe.Subscription {
  current_period_start: number;
  current_period_end: number;
}

/**
 * Stripe Invoice with top-level subscription and payment_intent fields.
 * These fields exist in the Stripe API response but may be typed differently
 * in newer @types/stripe versions.
 */
export interface StripeInvoiceWithRefs extends Stripe.Invoice {
  subscription: string | Stripe.Subscription;
  payment_intent: string | Stripe.PaymentIntent | null;
}
