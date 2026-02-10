/**
 * Users Service Unit Tests - Get User By ID
 *
 * Tests for getUserById functionality including
 * user retrieval, field selection, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockUser } from './users-test-helpers.js';

// Import after mocking (mock is set up in helpers)
import { UsersService } from './users.service.js';
import { prisma } from '../lib/prisma.js';

describe('[P2][profile] UsersService - getUserById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return user when found', async () => {
    const mockUser = createMockUser();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as unknown);

    const result = await UsersService.getUserById('test-user-id');

    expect(result).toEqual(mockUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'test-user-id' },
      select: expect.any(Object),
    });
  });

  it('should throw error when user not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(UsersService.getUserById('non-existent-id')).rejects.toThrow('User not found');
  });

  it('should include isVerified in user details', async () => {
    const mockUser = createMockUser({ isVerified: true });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as unknown);

    await UsersService.getUserById('test-user-id');

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          isVerified: true,
        }),
      })
    );
  });

  it('should select comprehensive user fields', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(createMockUser() as unknown);

    await UsersService.getUserById('test-user-id');

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          birthDate: true,
          gender: true,
          preferredLanguage: true,
          bio: true,
          profileImages: true,
          isBlocked: true,
          isVerified: true,
          isPremium: true,
          createdAt: true,
          lastActiveAt: true,
        }),
      })
    );
  });
});
