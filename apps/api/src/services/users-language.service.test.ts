/**
 * Users Service Unit Tests - Update Language
 *
 * Tests for updateUserLanguage functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockUser } from './users-test-helpers.js';

// Import after mocking (mock is set up in helpers)
import { UsersService } from './users.service.js';
import { prisma } from '../lib/prisma.js';

describe('[P2][profile] UsersService - updateUserLanguage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should update language to HEBREW', async () => {
    const mockUser = createMockUser();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as unknown);
    vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, preferredLanguage: 'HEBREW' } as unknown);

    const result = await UsersService.updateUserLanguage('test-user-id', 'HEBREW');

    expect(result.preferredLanguage).toBe('HEBREW');
  });

  it('should update language to SPANISH', async () => {
    const mockUser = createMockUser();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as unknown);
    vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, preferredLanguage: 'SPANISH' } as unknown);

    const result = await UsersService.updateUserLanguage('test-user-id', 'SPANISH');

    expect(result.preferredLanguage).toBe('SPANISH');
  });

  it('should update language to GERMAN', async () => {
    const mockUser = createMockUser();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as unknown);
    vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, preferredLanguage: 'GERMAN' } as unknown);

    const result = await UsersService.updateUserLanguage('test-user-id', 'GERMAN');

    expect(result.preferredLanguage).toBe('GERMAN');
  });

  it('should update language to FRENCH', async () => {
    const mockUser = createMockUser();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as unknown);
    vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, preferredLanguage: 'FRENCH' } as unknown);

    const result = await UsersService.updateUserLanguage('test-user-id', 'FRENCH');

    expect(result.preferredLanguage).toBe('FRENCH');
  });

  it('should throw error when user not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(UsersService.updateUserLanguage('non-existent-id', 'ENGLISH')).rejects.toThrow(
      'User not found'
    );
  });

  it('should call prisma update with correct data', async () => {
    const mockUser = createMockUser();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as unknown);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as unknown);

    await UsersService.updateUserLanguage('test-user-id', 'HEBREW');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'test-user-id' },
      data: { preferredLanguage: 'HEBREW' },
      select: expect.objectContaining({
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        preferredLanguage: true,
      }),
    });
  });
});
