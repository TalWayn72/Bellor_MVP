/**
 * External Service Circuit Breakers
 * Pre-configured breakers for Stripe, Firebase, and Email (Resend).
 */

import { CircuitBreaker } from './circuit-breaker.js';

/** Stripe API circuit breaker (payment processing) */
export const stripeBreaker = new CircuitBreaker({
  name: 'stripe',
  timeout: 5000,
  errorThreshold: 3,
  resetTimeout: 30000,
});

/** Firebase Cloud Messaging circuit breaker (push notifications) */
export const firebaseBreaker = new CircuitBreaker({
  name: 'firebase',
  timeout: 5000,
  errorThreshold: 3,
  resetTimeout: 30000,
});

/** Email / Resend circuit breaker */
export const emailBreaker = new CircuitBreaker({
  name: 'email',
  timeout: 10000,
  errorThreshold: 3,
  resetTimeout: 60000,
});
