/**
 * E2E User Factory
 * Mock user data for Playwright E2E tests
 */

export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  age?: number;
  bio?: string;
  location?: string;
  profileImages?: string[];
  isVerified?: boolean;
  isPremium?: boolean;
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: `user-${Date.now()}`,
    email: `test-${Date.now()}@bellor.app`,
    firstName: 'Test',
    lastName: 'User',
    nickname: 'TestUser',
    age: 25,
    bio: 'Test bio',
    location: 'Tel Aviv',
    profileImages: ['https://i.pravatar.cc/300?u=test'],
    isVerified: true,
    isPremium: false,
    ...overrides,
  };
}
