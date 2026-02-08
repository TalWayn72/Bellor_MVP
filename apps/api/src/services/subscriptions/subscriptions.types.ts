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
