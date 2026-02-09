/**
 * Seed Data - Financial Models
 * Subscription plans, subscriptions, payments, and referrals
 */

import { SubscriptionStatus, BillingCycle, PaymentStatus, ReferralStatus } from '@prisma/client';

/**
 * Helper to create dates spread over specified days
 */
function getRandomPastDate(daysAgo: number, variance: number = 10): Date {
  const days = daysAgo + Math.random() * variance;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function getFutureDate(daysAhead: number): Date {
  return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
}

/**
 * Subscription Plans (3 plans)
 */
export const subscriptionPlans = [
  {
    id: 'plan-3-months',
    name: '3 Months Premium',
    description: 'Get premium features for 3 months',
    price: 19.99,
    priceYearly: null,
    currency: 'USD',
    features: JSON.stringify([
      'Unlimited likes',
      'See who liked you',
      'Advanced filters',
      'Boost profile once per month',
      'No ads',
    ]),
    isActive: true,
    isPopular: false,
  },
  {
    id: 'plan-6-months',
    name: '6 Months Premium',
    description: 'Get premium features for 6 months - Best Value!',
    price: 16.99,
    priceYearly: null,
    currency: 'USD',
    features: JSON.stringify([
      'Unlimited likes',
      'See who liked you',
      'Advanced filters',
      'Boost profile twice per month',
      'No ads',
      'Priority support',
    ]),
    isActive: true,
    isPopular: true,
  },
  {
    id: 'plan-12-months',
    name: '12 Months Premium',
    description: 'Get premium features for 1 year',
    price: 12.99,
    priceYearly: null,
    currency: 'USD',
    features: JSON.stringify([
      'Unlimited likes',
      'See who liked you',
      'Advanced filters',
      'Unlimited profile boosts',
      'No ads',
      'Priority support',
      'Exclusive badge',
    ]),
    isActive: true,
    isPopular: false,
  },
];

/**
 * Subscriptions (15 total: 10 active, 5 canceled/expired)
 * Linked to premium users from users-3.ts
 */
export const subscriptions = [
  // Active subscriptions (10)
  {
    id: 'sub-001',
    userId: 'demo-user-hebrew-1', // Yael
    planId: 'plan-6-months',
    status: SubscriptionStatus.ACTIVE,
    billingCycle: BillingCycle.MONTHLY,
    currentPeriodStart: getRandomPastDate(60, 10),
    currentPeriodEnd: getFutureDate(120),
    canceledAt: null,
    cancelAtPeriodEnd: false,
    createdAt: getRandomPastDate(60, 10),
  },
  {
    id: 'sub-002',
    userId: 'demo-user-hebrew-3', // Noa
    planId: 'plan-3-months',
    status: SubscriptionStatus.ACTIVE,
    billingCycle: BillingCycle.MONTHLY,
    currentPeriodStart: getRandomPastDate(45, 10),
    currentPeriodEnd: getFutureDate(45),
    canceledAt: null,
    cancelAtPeriodEnd: false,
    createdAt: getRandomPastDate(45, 10),
  },
  {
    id: 'sub-003',
    userId: 'demo-user-hebrew-5', // Tamar
    planId: 'plan-12-months',
    status: SubscriptionStatus.ACTIVE,
    billingCycle: BillingCycle.MONTHLY,
    currentPeriodStart: getRandomPastDate(80, 10),
    currentPeriodEnd: getFutureDate(285),
    canceledAt: null,
    cancelAtPeriodEnd: false,
    createdAt: getRandomPastDate(80, 10),
  },
  {
    id: 'sub-004',
    userId: 'demo-user-en-2', // Michael
    planId: 'plan-6-months',
    status: SubscriptionStatus.ACTIVE,
    billingCycle: BillingCycle.MONTHLY,
    currentPeriodStart: getRandomPastDate(55, 10),
    currentPeriodEnd: getFutureDate(125),
    canceledAt: null,
    cancelAtPeriodEnd: false,
    createdAt: getRandomPastDate(55, 10),
  },
  {
    id: 'sub-005',
    userId: 'demo-user-en-5', // Olivia
    planId: 'plan-3-months',
    status: SubscriptionStatus.ACTIVE,
    billingCycle: BillingCycle.MONTHLY,
    currentPeriodStart: getRandomPastDate(30, 10),
    currentPeriodEnd: getFutureDate(60),
    canceledAt: null,
    cancelAtPeriodEnd: false,
    createdAt: getRandomPastDate(30, 10),
  },
  {
    id: 'sub-006',
    userId: 'demo-user-mixed-1', // Daniel
    planId: 'plan-6-months',
    status: SubscriptionStatus.ACTIVE,
    billingCycle: BillingCycle.MONTHLY,
    currentPeriodStart: getRandomPastDate(25, 5),
    currentPeriodEnd: getFutureDate(155),
    canceledAt: null,
    cancelAtPeriodEnd: false,
    createdAt: getRandomPastDate(25, 5),
  },
  {
    id: 'sub-007',
    userId: 'demo-user-add-2', // Adam
    planId: 'plan-3-months',
    status: SubscriptionStatus.ACTIVE,
    billingCycle: BillingCycle.MONTHLY,
    currentPeriodStart: getRandomPastDate(50, 10),
    currentPeriodEnd: getFutureDate(40),
    canceledAt: null,
    cancelAtPeriodEnd: false,
    createdAt: getRandomPastDate(50, 10),
  },
  {
    id: 'sub-008',
    userId: 'demo-user-add-6', // Ethan
    planId: 'plan-6-months',
    status: SubscriptionStatus.ACTIVE,
    billingCycle: BillingCycle.MONTHLY,
    currentPeriodStart: getRandomPastDate(35, 5),
    currentPeriodEnd: getFutureDate(145),
    canceledAt: null,
    cancelAtPeriodEnd: false,
    createdAt: getRandomPastDate(35, 5),
  },
  {
    id: 'sub-009',
    userId: 'demo-user-add-19', // Shira
    planId: 'plan-3-months',
    status: SubscriptionStatus.ACTIVE,
    billingCycle: BillingCycle.MONTHLY,
    currentPeriodStart: getRandomPastDate(1, 0),
    currentPeriodEnd: getFutureDate(89),
    canceledAt: null,
    cancelAtPeriodEnd: false,
    createdAt: getRandomPastDate(1, 0),
  },
  {
    id: 'sub-010',
    userId: 'demo-user-1', // Sarah (existing user)
    planId: 'plan-12-months',
    status: SubscriptionStatus.ACTIVE,
    billingCycle: BillingCycle.MONTHLY,
    currentPeriodStart: getRandomPastDate(70, 10),
    currentPeriodEnd: getFutureDate(295),
    canceledAt: null,
    cancelAtPeriodEnd: false,
    createdAt: getRandomPastDate(70, 10),
  },

  // Canceled/Expired subscriptions (5)
  {
    id: 'sub-011',
    userId: 'demo-user-2', // David (existing user)
    planId: 'plan-3-months',
    status: SubscriptionStatus.CANCELED,
    billingCycle: BillingCycle.MONTHLY,
    currentPeriodStart: getRandomPastDate(120, 10),
    currentPeriodEnd: getRandomPastDate(30, 5),
    canceledAt: getRandomPastDate(35, 5),
    cancelAtPeriodEnd: true,
    createdAt: getRandomPastDate(120, 10),
  },
  {
    id: 'sub-012',
    userId: 'demo-user-en-1', // Emma
    planId: 'plan-6-months',
    status: SubscriptionStatus.CANCELED,
    billingCycle: BillingCycle.MONTHLY,
    currentPeriodStart: getRandomPastDate(150, 10),
    currentPeriodEnd: getRandomPastDate(60, 10),
    canceledAt: getRandomPastDate(65, 5),
    cancelAtPeriodEnd: false,
    createdAt: getRandomPastDate(150, 10),
  },
  {
    id: 'sub-013',
    userId: 'demo-user-en-3', // Sophie
    planId: 'plan-3-months',
    status: SubscriptionStatus.PAST_DUE,
    billingCycle: BillingCycle.MONTHLY,
    currentPeriodStart: getRandomPastDate(95, 5),
    currentPeriodEnd: getRandomPastDate(5, 2),
    canceledAt: null,
    cancelAtPeriodEnd: false,
    createdAt: getRandomPastDate(95, 5),
  },
  {
    id: 'sub-014',
    userId: 'demo-user-mixed-2', // Rachel
    planId: 'plan-6-months',
    status: SubscriptionStatus.CANCELED,
    billingCycle: BillingCycle.MONTHLY,
    currentPeriodStart: getRandomPastDate(180, 10),
    currentPeriodEnd: getRandomPastDate(20, 5),
    canceledAt: getRandomPastDate(25, 5),
    cancelAtPeriodEnd: true,
    createdAt: getRandomPastDate(180, 10),
  },
  {
    id: 'sub-015',
    userId: 'demo-user-add-10', // Lucas
    planId: 'plan-3-months',
    status: SubscriptionStatus.CANCELED,
    billingCycle: BillingCycle.MONTHLY,
    currentPeriodStart: getRandomPastDate(110, 10),
    currentPeriodEnd: getRandomPastDate(20, 5),
    canceledAt: getRandomPastDate(22, 3),
    cancelAtPeriodEnd: true,
    createdAt: getRandomPastDate(110, 10),
  },
];

/**
 * Payments (15 - matching subscriptions)
 */
export const payments = [
  // Active subscription payments
  { id: 'pay-001', subscriptionId: 'sub-001', userId: 'demo-user-hebrew-1', amount: 16.99, currency: 'USD', status: PaymentStatus.SUCCEEDED, createdAt: getRandomPastDate(60, 10) },
  { id: 'pay-002', subscriptionId: 'sub-002', userId: 'demo-user-hebrew-3', amount: 19.99, currency: 'USD', status: PaymentStatus.SUCCEEDED, createdAt: getRandomPastDate(45, 10) },
  { id: 'pay-003', subscriptionId: 'sub-003', userId: 'demo-user-hebrew-5', amount: 12.99, currency: 'USD', status: PaymentStatus.SUCCEEDED, createdAt: getRandomPastDate(80, 10) },
  { id: 'pay-004', subscriptionId: 'sub-004', userId: 'demo-user-en-2', amount: 16.99, currency: 'USD', status: PaymentStatus.SUCCEEDED, createdAt: getRandomPastDate(55, 10) },
  { id: 'pay-005', subscriptionId: 'sub-005', userId: 'demo-user-en-5', amount: 19.99, currency: 'USD', status: PaymentStatus.SUCCEEDED, createdAt: getRandomPastDate(30, 10) },
  { id: 'pay-006', subscriptionId: 'sub-006', userId: 'demo-user-mixed-1', amount: 16.99, currency: 'USD', status: PaymentStatus.SUCCEEDED, createdAt: getRandomPastDate(25, 5) },
  { id: 'pay-007', subscriptionId: 'sub-007', userId: 'demo-user-add-2', amount: 19.99, currency: 'USD', status: PaymentStatus.SUCCEEDED, createdAt: getRandomPastDate(50, 10) },
  { id: 'pay-008', subscriptionId: 'sub-008', userId: 'demo-user-add-6', amount: 16.99, currency: 'USD', status: PaymentStatus.SUCCEEDED, createdAt: getRandomPastDate(35, 5) },
  { id: 'pay-009', subscriptionId: 'sub-009', userId: 'demo-user-add-19', amount: 19.99, currency: 'USD', status: PaymentStatus.SUCCEEDED, createdAt: getRandomPastDate(1, 0) },
  { id: 'pay-010', subscriptionId: 'sub-010', userId: 'demo-user-1', amount: 12.99, currency: 'USD', status: PaymentStatus.SUCCEEDED, createdAt: getRandomPastDate(70, 10) },

  // Canceled/Expired subscription payments
  { id: 'pay-011', subscriptionId: 'sub-011', userId: 'demo-user-2', amount: 19.99, currency: 'USD', status: PaymentStatus.SUCCEEDED, createdAt: getRandomPastDate(120, 10) },
  { id: 'pay-012', subscriptionId: 'sub-012', userId: 'demo-user-en-1', amount: 16.99, currency: 'USD', status: PaymentStatus.SUCCEEDED, createdAt: getRandomPastDate(150, 10) },
  { id: 'pay-013', subscriptionId: 'sub-013', userId: 'demo-user-en-3', amount: 19.99, currency: 'USD', status: PaymentStatus.FAILED, createdAt: getRandomPastDate(95, 5) },
  { id: 'pay-014', subscriptionId: 'sub-014', userId: 'demo-user-mixed-2', amount: 16.99, currency: 'USD', status: PaymentStatus.SUCCEEDED, createdAt: getRandomPastDate(180, 10) },
  { id: 'pay-015', subscriptionId: 'sub-015', userId: 'demo-user-add-10', amount: 19.99, currency: 'USD', status: PaymentStatus.SUCCEEDED, createdAt: getRandomPastDate(110, 10) },
];

/**
 * Referrals (12 total: 8 successful, 4 pending)
 */
export const referrals = [
  // Successful referrals (8)
  {
    id: 'ref-001',
    referrerUserId: 'demo-user-1',
    referredEmail: 'demo-user-hebrew-1@example.com',
    phoneNumber: '+972-50-0001111',
    status: ReferralStatus.COMPLETED,
    emailSent: true,
    whatsappSent: true,
    createdAt: getRandomPastDate(85, 5),
    signedUpAt: getRandomPastDate(80, 3),
  },
  {
    id: 'ref-002',
    referrerUserId: 'demo-user-2',
    referredEmail: 'demo-user-en-2@example.com',
    phoneNumber: '+1-555-0002222',
    status: ReferralStatus.COMPLETED,
    emailSent: true,
    whatsappSent: false,
    createdAt: getRandomPastDate(70, 5),
    signedUpAt: getRandomPastDate(65, 3),
  },
  {
    id: 'ref-003',
    referrerUserId: 'demo-user-hebrew-1',
    referredEmail: 'demo-user-hebrew-3@test.com',
    phoneNumber: '+972-50-0003333',
    status: ReferralStatus.COMPLETED,
    emailSent: true,
    whatsappSent: true,
    createdAt: getRandomPastDate(65, 5),
    signedUpAt: getRandomPastDate(60, 3),
  },
  {
    id: 'ref-004',
    referrerUserId: 'demo-user-en-2',
    referredEmail: 'demo-user-en-5@example.com',
    status: ReferralStatus.COMPLETED,
    emailSent: true,
    whatsappSent: false,
    createdAt: getRandomPastDate(40, 5),
    signedUpAt: getRandomPastDate(35, 3),
  },
  {
    id: 'ref-005',
    referrerUserId: 'demo-user-hebrew-3',
    referredEmail: 'demo-user-mixed-1@example.com',
    phoneNumber: '+972-50-0005555',
    status: ReferralStatus.COMPLETED,
    emailSent: true,
    whatsappSent: true,
    createdAt: getRandomPastDate(35, 5),
    signedUpAt: getRandomPastDate(30, 3),
  },
  {
    id: 'ref-006',
    referrerUserId: 'demo-user-en-5',
    referredEmail: 'demo-user-add-6@test.com',
    status: ReferralStatus.COMPLETED,
    emailSent: true,
    whatsappSent: false,
    createdAt: getRandomPastDate(50, 5),
    signedUpAt: getRandomPastDate(45, 3),
  },
  {
    id: 'ref-007',
    referrerUserId: 'demo-user-mixed-1',
    referredEmail: 'demo-user-add-2@test.com',
    phoneNumber: '+972-50-0007777',
    status: ReferralStatus.COMPLETED,
    emailSent: true,
    whatsappSent: true,
    createdAt: getRandomPastDate(75, 5),
    signedUpAt: getRandomPastDate(72, 2),
  },
  {
    id: 'ref-008',
    referrerUserId: 'demo-user-add-6',
    referredEmail: 'demo-user-add-19@example.com',
    status: ReferralStatus.COMPLETED,
    emailSent: true,
    whatsappSent: false,
    createdAt: getRandomPastDate(5, 2),
    signedUpAt: getRandomPastDate(1, 0),
  },

  // Pending referrals (4)
  {
    id: 'ref-009',
    referrerUserId: 'demo-user-1',
    referredEmail: 'friend1@example.com',
    phoneNumber: '+1-555-0009999',
    status: ReferralStatus.PENDING,
    emailSent: true,
    whatsappSent: true,
    createdAt: getRandomPastDate(10, 3),
    signedUpAt: null,
  },
  {
    id: 'ref-010',
    referrerUserId: 'demo-user-hebrew-1',
    referredEmail: 'friend2@test.com',
    phoneNumber: '+972-50-0001010',
    status: ReferralStatus.PENDING,
    emailSent: true,
    whatsappSent: false,
    createdAt: getRandomPastDate(15, 5),
    signedUpAt: null,
  },
  {
    id: 'ref-011',
    referrerUserId: 'demo-user-en-2',
    referredEmail: 'friend3@example.com',
    status: ReferralStatus.SIGNED_UP,
    emailSent: true,
    whatsappSent: false,
    createdAt: getRandomPastDate(8, 2),
    signedUpAt: getRandomPastDate(3, 1),
  },
  {
    id: 'ref-012',
    referrerUserId: 'demo-user-mixed-1',
    referredEmail: 'friend4@test.com',
    phoneNumber: '+972-50-0001212',
    status: ReferralStatus.PENDING,
    emailSent: true,
    whatsappSent: true,
    createdAt: getRandomPastDate(5, 2),
    signedUpAt: null,
  },
];
