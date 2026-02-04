/**
 * Users Service Unit Tests
 *
 * @see PRD.md Section 14 - Development Guidelines
 * @see PRD.md Section 10.1 Phase 6 - Testing
 *
 * Target Coverage: 90%
 * Priority: Critical
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules before importing the service
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Import after mocking
import { UsersService } from './users.service.js';
import { prisma } from '../lib/prisma.js';

// Helper to create mock user data
const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  birthDate: new Date('1990-01-01'),
  gender: 'MALE',
  preferredLanguage: 'ENGLISH',
  bio: 'Test bio',
  profileImages: ['https://example.com/image.jpg'],
  isBlocked: false,
  isVerified: true,
  isPremium: false,
  createdAt: new Date('2024-01-01'),
  lastActiveAt: new Date('2024-06-01'),
  ...overrides,
});

describe('UsersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // LIST USERS TESTS
  // ============================================
  describe('listUsers', () => {
    it('should list users with default pagination', async () => {
      const mockUsers = [createMockUser(), createMockUser({ id: 'user-2', email: 'user2@example.com' })];

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);
      vi.mocked(prisma.user.count).mockResolvedValue(2);

      const result = await UsersService.listUsers();

      expect(result.users).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.offset).toBe(0);
    });

    it('should apply custom pagination options', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(100);

      await UsersService.listUsers({ limit: 10, offset: 50 });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 50,
        })
      );
    });

    it('should filter by isBlocked status', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

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
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

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
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

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
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

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
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

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
      vi.mocked(prisma.user.findMany).mockResolvedValue([createMockUser()] as any);
      vi.mocked(prisma.user.count).mockResolvedValue(100);

      const result = await UsersService.listUsers({ limit: 20, offset: 0 });

      expect(result.pagination.hasMore).toBe(true);
    });

    it('should calculate hasMore correctly when no more users', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([createMockUser()] as any);
      vi.mocked(prisma.user.count).mockResolvedValue(1);

      const result = await UsersService.listUsers({ limit: 20, offset: 0 });

      expect(result.pagination.hasMore).toBe(false);
    });

    it('should combine multiple filters', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

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
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

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

  // ============================================
  // GET USER BY ID TESTS
  // ============================================
  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = createMockUser();
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

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
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

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
      vi.mocked(prisma.user.findUnique).mockResolvedValue(createMockUser() as any);

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

  // ============================================
  // UPDATE USER PROFILE TESTS
  // ============================================
  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const mockUser = createMockUser();
      const updateInput = { firstName: 'Jane', lastName: 'Smith', bio: 'Updated bio' };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, ...updateInput } as any);

      const result = await UsersService.updateUserProfile('test-user-id', updateInput);

      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(result.bio).toBe('Updated bio');
    });

    it('should throw error when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        UsersService.updateUserProfile('non-existent-id', { firstName: 'Test' })
      ).rejects.toThrow('User not found');
    });

    it('should only update firstName when provided', async () => {
      const mockUser = createMockUser();

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      await UsersService.updateUserProfile('test-user-id', { firstName: 'NewName' });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: 'NewName',
          }),
        })
      );
    });

    it('should only update lastName when provided', async () => {
      const mockUser = createMockUser();

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      await UsersService.updateUserProfile('test-user-id', { lastName: 'NewLastName' });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lastName: 'NewLastName',
          }),
        })
      );
    });

    it('should only update bio when provided', async () => {
      const mockUser = createMockUser();

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      await UsersService.updateUserProfile('test-user-id', { bio: 'New bio text' });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bio: 'New bio text',
          }),
        })
      );
    });

    it('should return updated user with selected fields', async () => {
      const mockUser = createMockUser();

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      await UsersService.updateUserProfile('test-user-id', { firstName: 'Test' });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }),
        })
      );
    });

    it('should update multiple fields at once', async () => {
      const mockUser = createMockUser();
      const updateInput = {
        firstName: 'New',
        lastName: 'Name',
        bio: 'New bio',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, ...updateInput } as any);

      await UsersService.updateUserProfile('test-user-id', updateInput);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: updateInput,
        })
      );
    });
  });

  // ============================================
  // UPDATE USER LANGUAGE TESTS
  // ============================================
  describe('updateUserLanguage', () => {
    it('should update language to HEBREW', async () => {
      const mockUser = createMockUser();

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, preferredLanguage: 'HEBREW' } as any);

      const result = await UsersService.updateUserLanguage('test-user-id', 'HEBREW');

      expect(result.preferredLanguage).toBe('HEBREW');
    });

    it('should update language to SPANISH', async () => {
      const mockUser = createMockUser();

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, preferredLanguage: 'SPANISH' } as any);

      const result = await UsersService.updateUserLanguage('test-user-id', 'SPANISH');

      expect(result.preferredLanguage).toBe('SPANISH');
    });

    it('should update language to GERMAN', async () => {
      const mockUser = createMockUser();

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, preferredLanguage: 'GERMAN' } as any);

      const result = await UsersService.updateUserLanguage('test-user-id', 'GERMAN');

      expect(result.preferredLanguage).toBe('GERMAN');
    });

    it('should update language to FRENCH', async () => {
      const mockUser = createMockUser();

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, preferredLanguage: 'FRENCH' } as any);

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

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

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

  // ============================================
  // SEARCH USERS TESTS
  // ============================================
  describe('searchUsers', () => {
    it('should search users by first name', async () => {
      const mockUsers = [createMockUser({ firstName: 'John' })];

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);
      vi.mocked(prisma.user.count).mockResolvedValue(1);

      const result = await UsersService.searchUsers({ query: 'John' });

      expect(result.users).toHaveLength(1);
      expect(result.users[0].firstName).toBe('John');
    });

    it('should search users by last name', async () => {
      const mockUsers = [createMockUser({ lastName: 'Smith' })];

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);
      vi.mocked(prisma.user.count).mockResolvedValue(1);

      const result = await UsersService.searchUsers({ query: 'Smith' });

      expect(result.users).toHaveLength(1);
    });

    it('should search users by email', async () => {
      const mockUsers = [createMockUser({ email: 'john@example.com' })];

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);
      vi.mocked(prisma.user.count).mockResolvedValue(1);

      const result = await UsersService.searchUsers({ query: 'john@example' });

      expect(result.users).toHaveLength(1);
    });

    it('should only search active (non-blocked) users', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

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
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

      const result = await UsersService.searchUsers({ query: 'test' });

      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.offset).toBe(0);
    });

    it('should apply custom pagination', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(100);

      await UsersService.searchUsers({ query: 'test', limit: 10, offset: 20 });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });

    it('should use case-insensitive search', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

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
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

      const result = await UsersService.searchUsers({ query: 'nonexistent' });

      expect(result.users).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should calculate hasMore correctly', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([createMockUser()] as any);
      vi.mocked(prisma.user.count).mockResolvedValue(50);

      const result = await UsersService.searchUsers({ query: 'test', limit: 10, offset: 0 });

      expect(result.pagination.hasMore).toBe(true);
    });
  });

  // ============================================
  // DEACTIVATE USER TESTS
  // ============================================
  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const mockUser = createMockUser({ isBlocked: false });

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, isBlocked: true } as any);

      const result = await UsersService.deactivateUser('test-user-id');

      expect(result.message).toBe('User deactivated successfully');
    });

    it('should set isBlocked to true', async () => {
      const mockUser = createMockUser();

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      await UsersService.deactivateUser('test-user-id');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { isBlocked: true },
      });
    });

    it('should throw error when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(UsersService.deactivateUser('non-existent-id')).rejects.toThrow('User not found');
    });

    it('should not call update if user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      try {
        await UsersService.deactivateUser('non-existent-id');
      } catch (e) {
        // Expected
      }

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // REACTIVATE USER TESTS
  // ============================================
  describe('reactivateUser', () => {
    it('should reactivate user successfully', async () => {
      const mockUser = createMockUser({ isBlocked: true });

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, isBlocked: false } as any);

      const result = await UsersService.reactivateUser('test-user-id');

      expect(result.message).toBe('User reactivated successfully');
    });

    it('should set isBlocked to false', async () => {
      const mockUser = createMockUser({ isBlocked: true });

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      await UsersService.reactivateUser('test-user-id');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { isBlocked: false },
      });
    });

    it('should throw error when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(UsersService.reactivateUser('non-existent-id')).rejects.toThrow('User not found');
    });

    it('should not call update if user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      try {
        await UsersService.reactivateUser('non-existent-id');
      } catch (e) {
        // Expected
      }

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // GET USER STATS TESTS
  // ============================================
  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const mockUser = {
        id: 'test-user-id',
        isPremium: true,
        createdAt: new Date('2024-01-01'),
        lastActiveAt: new Date('2024-06-01'),
        _count: {
          sentMessages: 100,
          chatsAsUser1: 5,
          chatsAsUser2: 3,
        },
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await UsersService.getUserStats('test-user-id');

      expect(result.userId).toBe('test-user-id');
      expect(result.messagesCount).toBe(100);
      expect(result.chatsCount).toBe(8); // 5 + 3
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
        id: 'test-user-id',
        isPremium: false,
        createdAt: new Date(),
        lastActiveAt: null,
        _count: {
          sentMessages: 0,
          chatsAsUser1: 0,
          chatsAsUser2: 0,
        },
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      await UsersService.getUserStats('test-user-id');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        include: {
          _count: {
            select: {
              sentMessages: true,
              chatsAsUser1: true,
              chatsAsUser2: true,
            },
          },
        },
      });
    });

    it('should handle zero messages and chats', async () => {
      const mockUser = {
        id: 'test-user-id',
        isPremium: false,
        createdAt: new Date(),
        lastActiveAt: null,
        _count: {
          sentMessages: 0,
          chatsAsUser1: 0,
          chatsAsUser2: 0,
        },
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await UsersService.getUserStats('test-user-id');

      expect(result.messagesCount).toBe(0);
      expect(result.chatsCount).toBe(0);
    });

    it('should handle null lastActiveAt', async () => {
      const mockUser = {
        id: 'test-user-id',
        isPremium: false,
        createdAt: new Date(),
        lastActiveAt: null,
        _count: {
          sentMessages: 0,
          chatsAsUser1: 0,
          chatsAsUser2: 0,
        },
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await UsersService.getUserStats('test-user-id');

      expect(result.lastLogin).toBeNull();
    });
  });
});
