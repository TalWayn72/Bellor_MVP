/**
 * Users Service Unit Tests - Stats & Export (GDPR)
 *
 * Tests for getUserStats and exportUserData (GDPR Article 20).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockUser } from './users-test-helpers.js';

// Import after mocking (mock is set up in helpers)
import { UsersService } from './users.service.js';
import { prisma } from '../lib/prisma.js';

describe('UsersService - getUserStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return user statistics', async () => {
    const mockUser = {
      id: 'test-user-id',
      isPremium: true,
      createdAt: new Date('2024-01-01'),
      lastActiveAt: new Date('2024-06-01'),
      _count: { sentMessages: 100, chatsAsUser1: 5, chatsAsUser2: 3 },
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const result = await UsersService.getUserStats('test-user-id');

    expect(result.userId).toBe('test-user-id');
    expect(result.messagesCount).toBe(100);
    expect(result.chatsCount).toBe(8);
    expect(result.isPremium).toBe(true);
    expect(result.memberSince).toEqual(new Date('2024-01-01'));
    expect(result.lastLogin).toEqual(new Date('2024-06-01'));
  });

  it('should throw error when user not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    await expect(UsersService.getUserStats('non-existent-id')).rejects.toThrow('User not found');
  });

  it('should include _count in the query', async () => {
    const mockUser = {
      id: 'test-user-id', isPremium: false, createdAt: new Date(), lastActiveAt: null,
      _count: { sentMessages: 0, chatsAsUser1: 0, chatsAsUser2: 0 },
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    await UsersService.getUserStats('test-user-id');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'test-user-id' },
      include: { _count: { select: { sentMessages: true, chatsAsUser1: true, chatsAsUser2: true } } },
    });
  });

  it('should handle zero messages and chats', async () => {
    const mockUser = {
      id: 'test-user-id', isPremium: false, createdAt: new Date(), lastActiveAt: null,
      _count: { sentMessages: 0, chatsAsUser1: 0, chatsAsUser2: 0 },
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    const result = await UsersService.getUserStats('test-user-id');
    expect(result.messagesCount).toBe(0);
    expect(result.chatsCount).toBe(0);
  });

  it('should handle null lastActiveAt', async () => {
    const mockUser = {
      id: 'test-user-id', isPremium: false, createdAt: new Date(), lastActiveAt: null,
      _count: { sentMessages: 0, chatsAsUser1: 0, chatsAsUser2: 0 },
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    const result = await UsersService.getUserStats('test-user-id');
    expect(result.lastLogin).toBeNull();
  });
});

describe('UsersService - exportUserData (GDPR Article 20)', () => {
  const createFullMockUser = (overrides = {}) => ({
    ...createMockUser(),
    location: { city: 'Tel Aviv', country: 'Israel' },
    lookingFor: ['FEMALE'], ageRangeMin: 18, ageRangeMax: 35, maxDistance: 50,
    isVerified: true, premiumExpiresAt: null,
    responseCount: 5, chatCount: 3, missionCompletedCount: 2,
    sentMessages: [
      { id: 'msg-1', content: 'Hello', createdAt: new Date('2024-03-01') },
      { id: 'msg-2', content: 'Hi there', createdAt: new Date('2024-03-02') },
    ],
    responses: [
      { id: 'resp-1', content: 'My response', responseType: 'TEXT', createdAt: new Date('2024-03-01') },
    ],
    stories: [
      { id: 'story-1', mediaUrl: 'https://example.com/story.jpg', caption: 'My story', createdAt: new Date('2024-04-01') },
    ],
    achievements: [
      { achievement: { name: 'First Match', description: 'Got your first match' }, unlockedAt: new Date('2024-02-01') },
    ],
    ...overrides,
  });

  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should export all user data successfully', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(createFullMockUser() as any);
    const result = await UsersService.exportUserData('test-user-id');
    expect(result).toHaveProperty('personalInformation');
    expect(result).toHaveProperty('preferences');
    expect(result).toHaveProperty('accountStatus');
    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('achievements');
    expect(result).toHaveProperty('statistics');
  });

  it('should include personal information in export', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(createFullMockUser() as any);
    const result = await UsersService.exportUserData('test-user-id');
    expect(result.personalInformation).toEqual({
      id: 'test-user-id', email: 'test@example.com', firstName: 'John', lastName: 'Doe',
      birthDate: new Date('1990-01-01'), gender: 'MALE', bio: 'Test bio',
      location: { city: 'Tel Aviv', country: 'Israel' }, preferredLanguage: 'ENGLISH',
      profileImages: ['https://example.com/image.jpg'],
      createdAt: new Date('2024-01-01'), lastActiveAt: new Date('2024-06-01'),
    });
  });

  it('should include messages in export', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(createFullMockUser() as any);
    const result = await UsersService.exportUserData('test-user-id');
    expect(result.content.messages).toHaveLength(2);
    expect(result.content.messages[0].content).toBe('Hello');
  });

  it('should include achievements in export', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(createFullMockUser() as any);
    const result = await UsersService.exportUserData('test-user-id');
    expect(result.achievements).toHaveLength(1);
    expect(result.achievements[0].name).toBe('First Match');
    expect(result.achievements[0]).toHaveProperty('unlockedAt');
  });

  it('should include statistics in export', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(createFullMockUser() as any);
    const result = await UsersService.exportUserData('test-user-id');
    expect(result.statistics).toEqual({ responseCount: 5, chatCount: 3, missionCompletedCount: 2 });
  });

  it('should throw error when user not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    await expect(UsersService.exportUserData('non-existent-id')).rejects.toThrow('User not found');
  });

  it('should query with include for related data', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(createFullMockUser() as any);
    await UsersService.exportUserData('test-user-id');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'test-user-id' },
      include: expect.objectContaining({
        sentMessages: expect.any(Object), responses: expect.any(Object),
        stories: expect.any(Object), achievements: expect.any(Object),
      }),
    });
  });

  it('should handle user with no content', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      createFullMockUser({ sentMessages: [], responses: [], stories: [], achievements: [] }) as any
    );
    const result = await UsersService.exportUserData('test-user-id');
    expect(result.content.messages).toHaveLength(0);
    expect(result.content.responses).toHaveLength(0);
    expect(result.content.stories).toHaveLength(0);
    expect(result.achievements).toHaveLength(0);
  });
});
