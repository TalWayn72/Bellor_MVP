/**
 * Subscriptions Service Tests
 * Tests for premium subscription management with Stripe
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { SubscriptionsService } from './subscriptions.service.js';
import { prisma } from '../lib/prisma.js';

// Mock Prisma - define mock inside factory to avoid hoisting issues
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    subscriptionPlan: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Access mocked prisma through the imported module
const mockPrisma = (prisma as Mock);

describe('[P0][payments] SubscriptionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlans', () => {
    it('should return active subscription plans sorted by order', async () => {
      const mockPlans = [
        { id: 'plan-1', name: 'Basic', price: 9.99, isActive: true, sortOrder: 0 },
        { id: 'plan-2', name: 'Premium', price: 19.99, isActive: true, sortOrder: 1 },
      ];

      mockPrisma.subscriptionPlan.findMany.mockResolvedValue(mockPlans);

      const result = await SubscriptionsService.getPlans();

      expect(mockPrisma.subscriptionPlan.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      expect(result).toEqual(mockPlans);
    });

    it('should return empty array when no plans exist', async () => {
      mockPrisma.subscriptionPlan.findMany.mockResolvedValue([]);

      const result = await SubscriptionsService.getPlans();

      expect(result).toEqual([]);
    });
  });

  describe('getPlanById', () => {
    it('should return plan when found', async () => {
      const mockPlan = { id: 'plan-1', name: 'Premium', price: 19.99 };
      mockPrisma.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);

      const result = await SubscriptionsService.getPlanById('plan-1');

      expect(mockPrisma.subscriptionPlan.findUnique).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
      });
      expect(result).toEqual(mockPlan);
    });

    it('should return null when plan not found', async () => {
      mockPrisma.subscriptionPlan.findUnique.mockResolvedValue(null);

      const result = await SubscriptionsService.getPlanById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getUserSubscription', () => {
    it('should return active subscription for user', async () => {
      const mockSubscription = {
        id: 'sub-1',
        userId: 'user-1',
        status: 'ACTIVE',
        plan: { id: 'plan-1', name: 'Premium' },
      };

      mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await SubscriptionsService.getUserSubscription('user-1');

      expect(mockPrisma.subscription.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
        },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should return null when user has no subscription', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      const result = await SubscriptionsService.getUserSubscription('user-1');

      expect(result).toBeNull();
    });
  });

  describe('getPaymentHistory', () => {
    it('should return payment history for user', async () => {
      const mockPayments = [
        { id: 'pay-1', amount: 19.99, status: 'SUCCEEDED' },
        { id: 'pay-2', amount: 19.99, status: 'SUCCEEDED' },
      ];

      mockPrisma.payment.findMany.mockResolvedValue(mockPayments);

      const result = await SubscriptionsService.getPaymentHistory('user-1', 10);

      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          subscription: {
            include: { plan: true },
          },
        },
      });
      expect(result).toEqual(mockPayments);
    });
  });

  describe('getOrCreateStripeCustomer', () => {
    it('should return existing Stripe customer ID if exists', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const mockSubscription = { stripeCustomerId: 'cus_existing123' };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await SubscriptionsService.getOrCreateStripeCustomer('user-1');

      expect(result).toBe('cus_existing123');
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        SubscriptionsService.getOrCreateStripeCustomer('non-existent')
      ).rejects.toThrow('User not found');
    });
  });

  describe('handleSubscriptionUpdated', () => {
    it('should update subscription status correctly', async () => {
      const mockSubscription = {
        id: 'sub-1',
        userId: 'user-1',
        status: 'ACTIVE',
      };

      mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription);
      mockPrisma.subscription.update.mockResolvedValue(mockSubscription);
      mockPrisma.user.update.mockResolvedValue({});

      const stripeSubscription = {
        id: 'stripe-sub-123',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        cancel_at_period_end: false,
        canceled_at: null,
      };

      const result = await SubscriptionsService.handleSubscriptionUpdated(stripeSubscription);

      expect(mockPrisma.subscription.update).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(result).toEqual(mockSubscription);
    });

    it('should return null if subscription not found', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      const result = await SubscriptionsService.handleSubscriptionUpdated({
        id: 'non-existent',
      });

      expect(result).toBeNull();
    });
  });

  describe('handleSubscriptionDeleted', () => {
    it('should mark subscription as canceled and remove premium', async () => {
      const mockSubscription = {
        id: 'sub-1',
        userId: 'user-1',
      };

      mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription);
      mockPrisma.subscription.update.mockResolvedValue({ ...mockSubscription, status: 'CANCELED' });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await SubscriptionsService.handleSubscriptionDeleted({
        id: 'stripe-sub-123',
      });

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: {
          status: 'CANCELED',
          canceledAt: expect.any(Date),
        },
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          isPremium: false,
          premiumExpiresAt: null,
        },
      });

      expect(result).toEqual(mockSubscription);
    });
  });
});
