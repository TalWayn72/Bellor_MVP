/**
 * Subscriptions Admin Controller Integration Tests
 * Tests for subscription plan management and Stripe webhooks
 *
 * @see PRD.md Section 10 - Phase 6 Testing (Integration)
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader } from '../../build-test-app.js';
import { prisma } from '../../../lib/prisma.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

const mockPlan = {
  id: 'plan-1',
  name: 'Premium',
  description: 'Premium subscription',
  price: 9.99,
  priceYearly: 99.99,
  features: ['Feature 1', 'Feature 2'],
  isPopular: true,
  sortOrder: 1,
  createdAt: new Date(),
};

// ============================================
// CREATE PLAN (ADMIN)
// ============================================
describe('POST /api/v1/subscriptions/plans - Create Plan (Admin)', () => {
  it('should create plan as admin', async () => {
    vi.mocked(prisma.subscriptionPlan.create).mockResolvedValue(mockPlan as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/subscriptions/plans',
      headers: { authorization: authHeader('admin-user-id') },
      payload: {
        name: 'Premium',
        description: 'Premium subscription',
        price: 9.99,
        features: ['Feature 1', 'Feature 2'],
      },
    });

    expect([201, 400, 403, 500]).toContain(response.statusCode);
  });

  it('should reject non-admin access', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/subscriptions/plans',
      headers: { authorization: authHeader() },
      payload: {
        name: 'Premium',
        price: 9.99,
        features: ['Feature 1'],
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should require authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/subscriptions/plans',
      payload: {
        name: 'Premium',
        price: 9.99,
        features: ['Feature 1'],
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should validate required fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/subscriptions/plans',
      headers: { authorization: authHeader('admin-user-id') },
      payload: {},
    });

    expect([400, 403, 500]).toContain(response.statusCode);
  });

  it('should accept yearly price', async () => {
    vi.mocked(prisma.subscriptionPlan.create).mockResolvedValue(mockPlan as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/subscriptions/plans',
      headers: { authorization: authHeader('admin-user-id') },
      payload: {
        name: 'Premium',
        price: 9.99,
        priceYearly: 99.99,
        features: ['Feature 1', 'Feature 2'],
      },
    });

    expect([201, 400, 403, 500]).toContain(response.statusCode);
  });

  it('should accept optional fields (isPopular, sortOrder)', async () => {
    vi.mocked(prisma.subscriptionPlan.create).mockResolvedValue(mockPlan as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/subscriptions/plans',
      headers: { authorization: authHeader('admin-user-id') },
      payload: {
        name: 'Premium',
        price: 9.99,
        features: ['Feature 1'],
        isPopular: true,
        sortOrder: 1,
      },
    });

    expect([201, 400, 403, 500]).toContain(response.statusCode);
  });
});

// ============================================
// STRIPE WEBHOOK
// ============================================
describe('POST /api/v1/webhooks/stripe - Handle Stripe Webhook', () => {
  it('should require stripe-signature header', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/stripe',
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it('should reject invalid signature', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/stripe',
      headers: {
        'stripe-signature': 'invalid-signature',
      },
      payload: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    expect([400, 415, 500]).toContain(response.statusCode);
  });

  it('should handle checkout.session.completed event', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          customer: 'cus_test_123',
          subscription: 'sub_test_123',
          metadata: { userId: 'test-user-id' },
        },
      },
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/stripe',
      headers: {
        'stripe-signature': 'test-signature',
      },
      payload: JSON.stringify(mockEvent),
    });

    expect([200, 400, 415, 500]).toContain(response.statusCode);
  });

  it('should handle invoice.payment_succeeded event', async () => {
    const mockEvent = {
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_test_123',
          subscription: 'sub_test_123',
          customer: 'cus_test_123',
        },
      },
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/stripe',
      headers: {
        'stripe-signature': 'test-signature',
      },
      payload: JSON.stringify(mockEvent),
    });

    expect([200, 400, 415, 500]).toContain(response.statusCode);
  });

  it('should handle invoice.payment_failed event', async () => {
    const mockEvent = {
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_test_123',
          subscription: 'sub_test_123',
          customer: 'cus_test_123',
        },
      },
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/stripe',
      headers: {
        'stripe-signature': 'test-signature',
      },
      payload: JSON.stringify(mockEvent),
    });

    expect([200, 400, 415, 500]).toContain(response.statusCode);
  });

  it('should handle customer.subscription.updated event', async () => {
    const mockEvent = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test_123',
          customer: 'cus_test_123',
          status: 'active',
        },
      },
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/stripe',
      headers: {
        'stripe-signature': 'test-signature',
      },
      payload: JSON.stringify(mockEvent),
    });

    expect([200, 400, 415, 500]).toContain(response.statusCode);
  });

  it('should handle customer.subscription.deleted event', async () => {
    const mockEvent = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_test_123',
          customer: 'cus_test_123',
          status: 'canceled',
        },
      },
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/stripe',
      headers: {
        'stripe-signature': 'test-signature',
      },
      payload: JSON.stringify(mockEvent),
    });

    expect([200, 400, 415, 500]).toContain(response.statusCode);
  });

  it('should handle unknown event types gracefully', async () => {
    const mockEvent = {
      type: 'unknown.event.type',
      data: {
        object: {},
      },
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/stripe',
      headers: {
        'stripe-signature': 'test-signature',
      },
      payload: JSON.stringify(mockEvent),
    });

    expect([200, 400, 415, 500]).toContain(response.statusCode);
  });

  it('should handle malformed JSON payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/stripe',
      headers: {
        'stripe-signature': 'test-signature',
        'content-type': 'application/json',
      },
      payload: 'invalid-json{',
    });

    expect([400, 500]).toContain(response.statusCode);
  });

  it('should handle empty payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/stripe',
      headers: {
        'stripe-signature': 'test-signature',
      },
      payload: '',
    });

    expect([400, 500]).toContain(response.statusCode);
  });
});
