/**
 * Users Service Unit Tests - List Users
 *
 * Tests for listUsers functionality including pagination,
 * filtering, sorting, and field selection.
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { createMockUser } from './users-test-helpers.js';

// Import after mocking (mock is set up in helpers)
import { UsersService } from './users.service.js';
import { prisma } from '../lib/prisma.js';

describe('[P2][profile] UsersService - listUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should list users with default pagination', async () => {
    const mockUsers = [createMockUser(), createMockUser({ id: 'user-2', email: 'user2@example.com' })];

    (prisma.user.findMany as Mock).mockResolvedValue(mockUsers as unknown);
    (prisma.user.count as Mock).mockResolvedValue(2);

    const result = await UsersService.listUsers();

    expect(result.users).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.limit).toBe(20);
    expect(result.pagination.offset).toBe(0);
  });

  it('should apply custom pagination options', async () => {
    (prisma.user.findMany as Mock).mockResolvedValue([]);
    (prisma.user.count as Mock).mockResolvedValue(100);

    await UsersService.listUsers({ limit: 10, offset: 50 });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 50,
      })
    );
  });

  it('should filter by isBlocked status', async () => {
    (prisma.user.findMany as Mock).mockResolvedValue([]);
    (prisma.user.count as Mock).mockResolvedValue(0);

    await UsersService.listUsers({ isBlocked: true });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isBlocked: true,
        }),
      })
    );
  });

  it('should filter by isPremium status', async () => {
    (prisma.user.findMany as Mock).mockResolvedValue([]);
    (prisma.user.count as Mock).mockResolvedValue(0);

    await UsersService.listUsers({ isPremium: true });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isPremium: true,
        }),
      })
    );
  });

  it('should filter by language preference', async () => {
    (prisma.user.findMany as Mock).mockResolvedValue([]);
    (prisma.user.count as Mock).mockResolvedValue(0);

    await UsersService.listUsers({ language: 'HEBREW' });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          preferredLanguage: 'HEBREW',
        }),
      })
    );
  });

  it('should sort by createdAt descending by default', async () => {
    (prisma.user.findMany as Mock).mockResolvedValue([]);
    (prisma.user.count as Mock).mockResolvedValue(0);

    await UsersService.listUsers();

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          createdAt: 'desc',
        },
      })
    );
  });

  it('should apply custom sort options', async () => {
    (prisma.user.findMany as Mock).mockResolvedValue([]);
    (prisma.user.count as Mock).mockResolvedValue(0);

    await UsersService.listUsers({ sortBy: 'firstName', sortOrder: 'asc' });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          firstName: 'asc',
        },
      })
    );
  });

  it('should calculate hasMore correctly when more users exist', async () => {
    (prisma.user.findMany as Mock).mockResolvedValue([createMockUser()] as unknown);
    (prisma.user.count as Mock).mockResolvedValue(100);

    const result = await UsersService.listUsers({ limit: 20, offset: 0 });

    expect(result.pagination.hasMore).toBe(true);
  });

  it('should calculate hasMore correctly when no more users', async () => {
    (prisma.user.findMany as Mock).mockResolvedValue([createMockUser()] as unknown);
    (prisma.user.count as Mock).mockResolvedValue(1);

    const result = await UsersService.listUsers({ limit: 20, offset: 0 });

    expect(result.pagination.hasMore).toBe(false);
  });

  it('should combine multiple filters', async () => {
    (prisma.user.findMany as Mock).mockResolvedValue([]);
    (prisma.user.count as Mock).mockResolvedValue(0);

    await UsersService.listUsers({ isBlocked: false, isPremium: true, language: 'ENGLISH' });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isBlocked: false,
          isPremium: true,
          preferredLanguage: 'ENGLISH',
        }),
      })
    );
  });

  it('should select appropriate fields for user list', async () => {
    (prisma.user.findMany as Mock).mockResolvedValue([]);
    (prisma.user.count as Mock).mockResolvedValue(0);

    await UsersService.listUsers();

    expect(prisma.user.findMany).toHaveBeenCalledWith(
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
          isPremium: true,
          createdAt: true,
          lastActiveAt: true,
        }),
      })
    );
  });
});
