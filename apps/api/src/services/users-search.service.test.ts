/**
 * Users Service Unit Tests - Search, Deactivate & Reactivate
 *
 * Tests for searchUsers, deactivateUser, and reactivateUser
 * functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { createMockUser } from './users-test-helpers.js';

// Import after mocking (mock is set up in helpers)
import { UsersService } from './users.service.js';
import { prisma } from '../lib/prisma.js';

describe('[P2][profile] UsersService - searchUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should search users by first name', async () => {
    const mockUsers = [createMockUser({ firstName: 'John' })];

    (prisma.user.findMany as Mock).mockResolvedValue(mockUsers as unknown);
    (prisma.user.count as Mock).mockResolvedValue(1);

    const result = await UsersService.searchUsers({ query: 'John' });

    expect(result.users).toHaveLength(1);
    expect(result.users[0].firstName).toBe('John');
  });

  it('should search users by last name', async () => {
    const mockUsers = [createMockUser({ lastName: 'Smith' })];

    (prisma.user.findMany as Mock).mockResolvedValue(mockUsers as unknown);
    (prisma.user.count as Mock).mockResolvedValue(1);

    const result = await UsersService.searchUsers({ query: 'Smith' });

    expect(result.users).toHaveLength(1);
  });

  it('should search users by email', async () => {
    const mockUsers = [createMockUser({ email: 'john@example.com' })];

    (prisma.user.findMany as Mock).mockResolvedValue(mockUsers as unknown);
    (prisma.user.count as Mock).mockResolvedValue(1);

    const result = await UsersService.searchUsers({ query: 'john@example' });

    expect(result.users).toHaveLength(1);
  });

  it('should only search active (non-blocked) users', async () => {
    (prisma.user.findMany as Mock).mockResolvedValue([]);
    (prisma.user.count as Mock).mockResolvedValue(0);

    await UsersService.searchUsers({ query: 'test' });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([{ isBlocked: false }]),
        }),
      })
    );
  });

  it('should apply default pagination', async () => {
    (prisma.user.findMany as Mock).mockResolvedValue([]);
    (prisma.user.count as Mock).mockResolvedValue(0);

    const result = await UsersService.searchUsers({ query: 'test' });

    expect(result.pagination.limit).toBe(20);
    expect(result.pagination.offset).toBe(0);
  });

  it('should apply custom pagination', async () => {
    (prisma.user.findMany as Mock).mockResolvedValue([]);
    (prisma.user.count as Mock).mockResolvedValue(100);

    await UsersService.searchUsers({ query: 'test', limit: 10, offset: 20 });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 20,
      })
    );
  });

  it('should use case-insensitive search', async () => {
    (prisma.user.findMany as Mock).mockResolvedValue([]);
    (prisma.user.count as Mock).mockResolvedValue(0);

    await UsersService.searchUsers({ query: 'JOHN' });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            {
              OR: [
                { firstName: { contains: 'JOHN', mode: 'insensitive' } },
                { lastName: { contains: 'JOHN', mode: 'insensitive' } },
                { email: { contains: 'JOHN', mode: 'insensitive' } },
              ],
            },
          ]),
        }),
      })
    );
  });

  it('should return empty array when no matches', async () => {
    (prisma.user.findMany as Mock).mockResolvedValue([]);
    (prisma.user.count as Mock).mockResolvedValue(0);

    const result = await UsersService.searchUsers({ query: 'nonexistent' });

    expect(result.users).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
  });

  it('should calculate hasMore correctly', async () => {
    (prisma.user.findMany as Mock).mockResolvedValue([createMockUser()] as unknown);
    (prisma.user.count as Mock).mockResolvedValue(50);

    const result = await UsersService.searchUsers({ query: 'test', limit: 10, offset: 0 });

    expect(result.pagination.hasMore).toBe(true);
  });
});

describe('[P2][profile] UsersService - deactivateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should deactivate user successfully', async () => {
    const mockUser = createMockUser({ isBlocked: false });

    (prisma.user.findUnique as Mock).mockResolvedValue(mockUser as unknown);
    (prisma.user.update as Mock).mockResolvedValue({ ...mockUser, isBlocked: true } as unknown);

    const result = await UsersService.deactivateUser('test-user-id');

    expect(result.message).toBe('User deactivated successfully');
  });

  it('should set isBlocked to true', async () => {
    const mockUser = createMockUser();

    (prisma.user.findUnique as Mock).mockResolvedValue(mockUser as unknown);
    (prisma.user.update as Mock).mockResolvedValue(mockUser as unknown);

    await UsersService.deactivateUser('test-user-id');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'test-user-id' },
      data: { isBlocked: true },
    });
  });

  it('should throw error when user not found', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(null);

    await expect(UsersService.deactivateUser('non-existent-id')).rejects.toThrow('User not found');
  });

  it('should not call update if user not found', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(null);

    try {
      await UsersService.deactivateUser('non-existent-id');
    } catch {
      // Expected
    }

    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

describe('[P2][profile] UsersService - reactivateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should reactivate user successfully', async () => {
    const mockUser = createMockUser({ isBlocked: true });

    (prisma.user.findUnique as Mock).mockResolvedValue(mockUser as unknown);
    (prisma.user.update as Mock).mockResolvedValue({ ...mockUser, isBlocked: false } as unknown);

    const result = await UsersService.reactivateUser('test-user-id');

    expect(result.message).toBe('User reactivated successfully');
  });

  it('should set isBlocked to false', async () => {
    const mockUser = createMockUser({ isBlocked: true });

    (prisma.user.findUnique as Mock).mockResolvedValue(mockUser as unknown);
    (prisma.user.update as Mock).mockResolvedValue(mockUser as unknown);

    await UsersService.reactivateUser('test-user-id');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'test-user-id' },
      data: { isBlocked: false },
    });
  });

  it('should throw error when user not found', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(null);

    await expect(UsersService.reactivateUser('non-existent-id')).rejects.toThrow('User not found');
  });

  it('should not call update if user not found', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(null);

    try {
      await UsersService.reactivateUser('non-existent-id');
    } catch {
      // Expected
    }

    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
