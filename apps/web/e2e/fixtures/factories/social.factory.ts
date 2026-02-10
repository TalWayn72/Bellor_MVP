/**
 * E2E Social Factory
 * Mock notification/like data for Playwright E2E tests
 */

export interface MockNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface MockLike {
  id: string;
  userId: string;
  likedUserId: string;
  likeType: 'ROMANTIC' | 'POSITIVE';
  createdDate: string;
}

export function createMockNotification(overrides: Partial<MockNotification> = {}): MockNotification {
  return {
    id: `notif-${Date.now()}`,
    type: 'LIKE',
    title: 'New Like',
    body: 'Someone liked your response',
    isRead: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockLike(overrides: Partial<MockLike> = {}): MockLike {
  return {
    id: `like-${Date.now()}`,
    userId: 'other-user-1',
    likedUserId: 'current-user',
    likeType: 'ROMANTIC',
    createdDate: new Date().toISOString(),
    ...overrides,
  };
}
