/**
 * Social Features Test Factory
 * Mock like/follow/notification data creation for backend tests
 */

export interface MockLike {
  id: string;
  userId: string;
  targetUserId: string;
  likeType: 'POSITIVE' | 'ROMANTIC' | 'SUPER';
  responseId: string | null;
  createdAt: Date;
}

export interface MockFollow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface MockNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data: Record<string, unknown>;
  createdAt: Date;
}

export const createMockLike = (overrides: Partial<MockLike> = {}): MockLike => ({
  id: 'test-like-id',
  userId: 'user-1',
  targetUserId: 'user-2',
  likeType: 'POSITIVE',
  responseId: null,
  createdAt: new Date(),
  ...overrides,
});

export const createMockFollow = (overrides: Partial<MockFollow> = {}): MockFollow => ({
  id: 'test-follow-id',
  followerId: 'user-1',
  followingId: 'user-2',
  createdAt: new Date(),
  ...overrides,
});

export const createMockNotification = (overrides: Partial<MockNotification> = {}): MockNotification => ({
  id: 'test-notification-id',
  userId: 'test-user-id',
  type: 'NEW_LIKE',
  title: 'New Like',
  message: 'Someone liked your response',
  isRead: false,
  data: {},
  createdAt: new Date(),
  ...overrides,
});
