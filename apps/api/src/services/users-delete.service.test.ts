/**
 * Users Service Unit Tests - Delete User (GDPR Article 17)
 *
 * Tests for deleteUserGDPR functionality including
 * transaction handling and related data cleanup.
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { createMockUser } from './users-test-helpers.js';

// Import after mocking (mock is set up in helpers)
import { UsersService } from './users.service.js';
import { prisma } from '../lib/prisma.js';

describe('[P0][profile] UsersService - deleteUserGDPR (GDPR Article 17)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delete user and all related data', async () => {
    const mockUser = createMockUser();
    (prisma.user.findUnique as Mock).mockResolvedValue(mockUser as unknown);

    (prisma.$transaction as Mock).mockImplementation(async (cb: (tx: Record<string, unknown>) => unknown) => {
      const tx = {
        message: { deleteMany: vi.fn().mockResolvedValue({ count: 5 }) },
        response: { deleteMany: vi.fn().mockResolvedValue({ count: 3 }) },
        story: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
        userAchievement: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
        notification: { deleteMany: vi.fn().mockResolvedValue({ count: 10 }) },
        chat: { deleteMany: vi.fn().mockResolvedValue({ count: 4 }) },
        report: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        like: { deleteMany: vi.fn().mockResolvedValue({ count: 8 }) },
        follow: { deleteMany: vi.fn().mockResolvedValue({ count: 6 }) },
        user: { delete: vi.fn().mockResolvedValue(mockUser) },
      };
      return cb(tx);
    });

    const result = await UsersService.deleteUserGDPR('test-user-id');
    expect(result.message).toBe('User and all related data permanently deleted');
  });

  it('should throw error when user not found', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(null);
    await expect(UsersService.deleteUserGDPR('non-existent-id')).rejects.toThrow('User not found');
  });

  it('should not call transaction when user not found', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(null);
    try { await UsersService.deleteUserGDPR('non-existent-id'); } catch { /* Expected */ }
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should use a transaction for data deletion', async () => {
    const mockUser = createMockUser();
    (prisma.user.findUnique as Mock).mockResolvedValue(mockUser as unknown);

    (prisma.$transaction as Mock).mockImplementation(async (cb: (tx: Record<string, unknown>) => unknown) => {
      const tx = {
        message: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        response: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        story: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        userAchievement: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        notification: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        chat: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        report: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        like: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        follow: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        user: { delete: vi.fn().mockResolvedValue(mockUser) },
      };
      return cb(tx);
    });

    await UsersService.deleteUserGDPR('test-user-id');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('should delete all related entity types in transaction', async () => {
    const mockUser = createMockUser();
    (prisma.user.findUnique as Mock).mockResolvedValue(mockUser as unknown);

    const deleteMocks: Record<string, ReturnType<typeof vi.fn>> = {};

    (prisma.$transaction as Mock).mockImplementation(async (cb: (tx: Record<string, unknown>) => unknown) => {
      const tx = {
        message: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        response: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        story: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        userAchievement: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        notification: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        chat: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        report: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        like: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        follow: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        user: { delete: vi.fn().mockResolvedValue(mockUser) },
      };
      Object.entries(tx).forEach(([key, value]) => {
        const record = value as Record<string, ReturnType<typeof vi.fn>>;
        const method = record.deleteMany || record.delete;
        if (method) deleteMocks[key] = method;
      });
      return cb(tx);
    });

    await UsersService.deleteUserGDPR('test-user-id');

    expect(deleteMocks['message']).toHaveBeenCalledWith({ where: { senderId: 'test-user-id' } });
    expect(deleteMocks['response']).toHaveBeenCalledWith({ where: { userId: 'test-user-id' } });
    expect(deleteMocks['story']).toHaveBeenCalledWith({ where: { userId: 'test-user-id' } });
    expect(deleteMocks['userAchievement']).toHaveBeenCalledWith({ where: { userId: 'test-user-id' } });
    expect(deleteMocks['notification']).toHaveBeenCalledWith({ where: { userId: 'test-user-id' } });
    expect(deleteMocks['user']).toHaveBeenCalledWith({ where: { id: 'test-user-id' } });
  });

  it('should delete chats where user is either participant', async () => {
    const mockUser = createMockUser();
    (prisma.user.findUnique as Mock).mockResolvedValue(mockUser as unknown);

    let chatDeleteArgs: Record<string, unknown>;

    (prisma.$transaction as Mock).mockImplementation(async (cb: (tx: Record<string, unknown>) => unknown) => {
      const tx = {
        message: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        response: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        story: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        userAchievement: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        notification: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        chat: { deleteMany: vi.fn().mockImplementation((args: Record<string, unknown>) => { chatDeleteArgs = args; return { count: 0 }; }) },
        report: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        like: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        follow: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
        user: { delete: vi.fn().mockResolvedValue(mockUser) },
      };
      return cb(tx);
    });

    await UsersService.deleteUserGDPR('test-user-id');

    expect(chatDeleteArgs).toEqual({
      where: { OR: [{ user1Id: 'test-user-id' }, { user2Id: 'test-user-id' }] },
    });
  });
});
