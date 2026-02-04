/**
 * Achievements Service Tests
 * Tests for user achievements and badges operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AchievementsService } from './achievements.service.js';
import { prisma } from '../lib/prisma.js';

// Type the mocked prisma
const mockPrisma = prisma as unknown as {
  achievement: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  userAchievement: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  notification: {
    create: ReturnType<typeof vi.fn>;
  };
  user: {
    findUnique: ReturnType<typeof vi.fn>;
  };
};

// Test data factories
const createMockAchievement = (overrides: Record<string, unknown> = {}) => ({
  id: 'achievement-1',
  name: 'First Response',
  description: 'Complete your first response',
  iconUrl: 'https://example.com/icon.png',
  requirement: { type: 'response_count', value: 1 },
  xpReward: 50,
  _count: { users: 10 },
  ...overrides,
});

const createMockUserAchievement = (overrides: Record<string, unknown> = {}) => ({
  id: 'ua-1',
  userId: 'user-1',
  achievementId: 'achievement-1',
  unlockedAt: new Date('2024-01-01'),
  achievement: createMockAchievement(),
  ...overrides,
});

describe('AchievementsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== listAchievements ====================
  describe('listAchievements', () => {
    it('should return achievements with pagination', async () => {
      const mockAchievements = [
        createMockAchievement({ id: 'achievement-1' }),
        createMockAchievement({ id: 'achievement-2', name: 'Second Response' }),
      ];
      mockPrisma.achievement.findMany.mockResolvedValue(mockAchievements);
      mockPrisma.achievement.count.mockResolvedValue(2);

      const result = await AchievementsService.listAchievements();

      expect(result.achievements).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.achievements[0].unlockedCount).toBe(10);
    });

    it('should use custom pagination values', async () => {
      mockPrisma.achievement.findMany.mockResolvedValue([]);
      mockPrisma.achievement.count.mockResolvedValue(0);

      await AchievementsService.listAchievements({ limit: 10, offset: 5 });

      expect(mockPrisma.achievement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 5,
        })
      );
    });

    it('should use default limit of 100', async () => {
      mockPrisma.achievement.findMany.mockResolvedValue([]);
      mockPrisma.achievement.count.mockResolvedValue(0);

      await AchievementsService.listAchievements();

      expect(mockPrisma.achievement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
          skip: 0,
        })
      );
    });
  });

  // ==================== getAchievementById ====================
  describe('getAchievementById', () => {
    it('should return achievement with unlocked count', async () => {
      const mockAchievement = createMockAchievement();
      mockPrisma.achievement.findUnique.mockResolvedValue(mockAchievement);

      const result = await AchievementsService.getAchievementById('achievement-1');

      expect(result.id).toBe('achievement-1');
      expect(result.unlockedCount).toBe(10);
    });

    it('should throw error when achievement not found', async () => {
      mockPrisma.achievement.findUnique.mockResolvedValue(null);

      await expect(
        AchievementsService.getAchievementById('non-existent')
      ).rejects.toThrow('Achievement not found');
    });
  });

  // ==================== getUserAchievements ====================
  describe('getUserAchievements', () => {
    it('should return user achievements with pagination', async () => {
      const mockUserAchievements = [
        createMockUserAchievement({ id: 'ua-1' }),
        createMockUserAchievement({ id: 'ua-2', achievementId: 'achievement-2' }),
      ];
      mockPrisma.userAchievement.findMany.mockResolvedValue(mockUserAchievements);
      mockPrisma.userAchievement.count.mockResolvedValue(2);

      const result = await AchievementsService.getUserAchievements('user-1');

      expect(result.achievements).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.achievements[0].unlockedAt).toBeDefined();
    });

    it('should order by unlockedAt descending', async () => {
      mockPrisma.userAchievement.findMany.mockResolvedValue([]);
      mockPrisma.userAchievement.count.mockResolvedValue(0);

      await AchievementsService.getUserAchievements('user-1');

      expect(mockPrisma.userAchievement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { unlockedAt: 'desc' },
        })
      );
    });
  });

  // ==================== hasUnlocked ====================
  describe('hasUnlocked', () => {
    it('should return true when user has achievement', async () => {
      mockPrisma.userAchievement.findUnique.mockResolvedValue(createMockUserAchievement());

      const result = await AchievementsService.hasUnlocked('user-1', 'achievement-1');

      expect(result).toBe(true);
    });

    it('should return false when user does not have achievement', async () => {
      mockPrisma.userAchievement.findUnique.mockResolvedValue(null);

      const result = await AchievementsService.hasUnlocked('user-1', 'achievement-1');

      expect(result).toBe(false);
    });
  });

  // ==================== unlockAchievement ====================
  describe('unlockAchievement', () => {
    it('should unlock achievement for user', async () => {
      const mockAchievement = createMockAchievement();
      const mockUserAchievement = createMockUserAchievement();

      mockPrisma.userAchievement.findUnique.mockResolvedValue(null);
      mockPrisma.achievement.findUnique.mockResolvedValue(mockAchievement);
      mockPrisma.userAchievement.create.mockResolvedValue(mockUserAchievement);
      mockPrisma.notification.create.mockResolvedValue({});

      const result = await AchievementsService.unlockAchievement('user-1', 'achievement-1');

      expect(mockPrisma.userAchievement.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          achievementId: 'achievement-1',
        },
        include: { achievement: true },
      });
      expect(result).toEqual(mockUserAchievement);
    });

    it('should throw error when already unlocked', async () => {
      mockPrisma.userAchievement.findUnique.mockResolvedValue(createMockUserAchievement());

      await expect(
        AchievementsService.unlockAchievement('user-1', 'achievement-1')
      ).rejects.toThrow('Achievement already unlocked');
    });

    it('should throw error when achievement not found', async () => {
      mockPrisma.userAchievement.findUnique.mockResolvedValue(null);
      mockPrisma.achievement.findUnique.mockResolvedValue(null);

      await expect(
        AchievementsService.unlockAchievement('user-1', 'non-existent')
      ).rejects.toThrow('Achievement not found');
    });

    it('should create notification on unlock', async () => {
      const mockAchievement = createMockAchievement({ name: 'Test Badge' });
      mockPrisma.userAchievement.findUnique.mockResolvedValue(null);
      mockPrisma.achievement.findUnique.mockResolvedValue(mockAchievement);
      mockPrisma.userAchievement.create.mockResolvedValue(createMockUserAchievement());
      mockPrisma.notification.create.mockResolvedValue({});

      await AchievementsService.unlockAchievement('user-1', 'achievement-1');

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'ACHIEVEMENT_UNLOCKED',
          title: 'Achievement Unlocked!',
          message: 'You earned the "Test Badge" achievement!',
          relatedContentId: 'achievement-1',
        },
      });
    });
  });

  // ==================== checkAndUnlockAchievements ====================
  describe('checkAndUnlockAchievements', () => {
    it('should unlock achievements based on response_count', async () => {
      const user = {
        responseCount: 5,
        chatCount: 0,
        missionCompletedCount: 0,
        isPremium: false,
      };
      const achievement = createMockAchievement({
        requirement: { type: 'response_count', value: 5 },
      });

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.achievement.findMany.mockResolvedValue([achievement]);
      mockPrisma.userAchievement.findUnique.mockResolvedValueOnce(null); // For hasUnlocked
      mockPrisma.userAchievement.findUnique.mockResolvedValueOnce(null); // For unlockAchievement
      mockPrisma.achievement.findUnique.mockResolvedValue(achievement);
      mockPrisma.userAchievement.create.mockResolvedValue(createMockUserAchievement());
      mockPrisma.notification.create.mockResolvedValue({});

      const result = await AchievementsService.checkAndUnlockAchievements('user-1');

      expect(result).toHaveLength(1);
    });

    it('should return empty array when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await AchievementsService.checkAndUnlockAchievements('non-existent');

      expect(result).toEqual([]);
    });

    it('should not unlock already unlocked achievements', async () => {
      const user = { responseCount: 5, chatCount: 0, missionCompletedCount: 0, isPremium: false };
      const achievement = createMockAchievement({
        requirement: { type: 'response_count', value: 5 },
      });

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.achievement.findMany.mockResolvedValue([achievement]);
      mockPrisma.userAchievement.findUnique.mockResolvedValue(createMockUserAchievement()); // Already unlocked

      const result = await AchievementsService.checkAndUnlockAchievements('user-1');

      expect(result).toHaveLength(0);
      expect(mockPrisma.userAchievement.create).not.toHaveBeenCalled();
    });
  });

  // ==================== createAchievement ====================
  describe('createAchievement', () => {
    it('should create a new achievement', async () => {
      const newAchievement = createMockAchievement();
      mockPrisma.achievement.create.mockResolvedValue(newAchievement);

      const result = await AchievementsService.createAchievement({
        name: 'First Response',
        description: 'Complete your first response',
        iconUrl: 'https://example.com/icon.png',
        requirement: { type: 'response_count', value: 1 },
        xpReward: 50,
      });

      expect(mockPrisma.achievement.create).toHaveBeenCalledWith({
        data: {
          name: 'First Response',
          description: 'Complete your first response',
          iconUrl: 'https://example.com/icon.png',
          requirement: { type: 'response_count', value: 1 },
          xpReward: 50,
        },
      });
      expect(result).toEqual(newAchievement);
    });

    it('should use default xpReward of 50', async () => {
      mockPrisma.achievement.create.mockResolvedValue(createMockAchievement());

      await AchievementsService.createAchievement({
        name: 'Test',
        description: 'Test description',
        requirement: { type: 'response_count', value: 1 },
      });

      expect(mockPrisma.achievement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          xpReward: 50,
        }),
      });
    });
  });

  // ==================== getAchievementStats ====================
  describe('getAchievementStats', () => {
    it('should return achievement stats', async () => {
      const mockAchievement = createMockAchievement();
      const mockRecentUnlocks = [
        {
          ...createMockUserAchievement(),
          user: { id: 'user-1', firstName: 'Test', lastName: 'User', profileImages: [] },
        },
      ];

      mockPrisma.achievement.findUnique.mockResolvedValue(mockAchievement);
      mockPrisma.userAchievement.count.mockResolvedValue(10);
      mockPrisma.userAchievement.findMany.mockResolvedValue(mockRecentUnlocks);

      const result = await AchievementsService.getAchievementStats('achievement-1');

      expect(result.achievement).toEqual(mockAchievement);
      expect(result.unlockedCount).toBe(10);
      expect(result.recentUnlocks).toHaveLength(1);
    });
  });
});
