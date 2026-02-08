/**
 * Feature Routes - Integration Tests
 * Tests likes, follows, notifications, missions, responses, stories endpoints
 *
 * @see PRD.md Section 10 - Phase 6 Testing
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader } from '../build-test-app.js';
import { prisma } from '../../lib/prisma.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================
// LIKES
// ============================================
describe('Likes Endpoints', () => {
  describe('POST /api/v1/likes/user', () => {
    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/likes/user',
        payload: { targetUserId: 'user-2', likeType: 'POSITIVE' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should like a user', async () => {
      // Mock target user lookup (likeUser validates user exists)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-2' } as any);
      vi.mocked(prisma.like.findUnique).mockResolvedValue(null); // No existing like
      vi.mocked(prisma.like.findFirst).mockResolvedValue(null); // No mutual like
      vi.mocked(prisma.like.create).mockResolvedValue({
        id: 'like-1',
        userId: 'test-user-id',
        targetUserId: 'user-2',
        likeType: 'POSITIVE',
        createdAt: new Date(),
      } as any);
      vi.mocked(prisma.notification.create).mockResolvedValue({} as any);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/likes/user',
        headers: { authorization: authHeader() },
        payload: { targetUserId: 'user-2', likeType: 'POSITIVE' },
      });

      expect([200, 201]).toContain(response.statusCode);
    });
  });

  describe('GET /api/v1/likes/check/:targetUserId', () => {
    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/likes/check/user-2',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should check if user is liked', async () => {
      vi.mocked(prisma.like.findFirst).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/likes/check/user-2',
        headers: { authorization: authHeader() },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      // Likes check returns {hasLiked, isMatch} directly
      expect(body).toHaveProperty('hasLiked');
    });
  });

  describe('GET /api/v1/likes/received', () => {
    it('should return received likes', async () => {
      vi.mocked(prisma.like.findMany).mockResolvedValue([]);
      vi.mocked(prisma.like.count).mockResolvedValue(0);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/likes/received',
        headers: { authorization: authHeader() },
      });

      expect(response.statusCode).toBe(200);
    });
  });
});

// ============================================
// FOLLOWS
// ============================================
describe('Follows Endpoints', () => {
  describe('POST /api/v1/follows', () => {
    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/follows',
        payload: { userId: 'user-2' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should follow a user', async () => {
      vi.mocked(prisma.follow.findFirst).mockResolvedValue(null); // Not already following
      vi.mocked(prisma.follow.create).mockResolvedValue({
        id: 'follow-1',
        followerId: 'test-user-id',
        followingId: 'user-2',
        createdAt: new Date(),
      } as any);
      vi.mocked(prisma.notification.create).mockResolvedValue({} as any);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/follows',
        headers: { authorization: authHeader() },
        payload: { userId: 'user-2' },
      });

      expect([200, 201]).toContain(response.statusCode);
    });
  });

  describe('DELETE /api/v1/follows/:userId', () => {
    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/follows/user-2',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should unfollow a user', async () => {
      vi.mocked(prisma.follow.findUnique).mockResolvedValue({
        id: 'follow-1',
        followerId: 'test-user-id',
        followingId: 'user-2',
      } as any);
      vi.mocked(prisma.follow.delete).mockResolvedValue({} as any);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/follows/user-2',
        headers: { authorization: authHeader() },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api/v1/follows/following', () => {
    it('should return following list', async () => {
      vi.mocked(prisma.follow.findMany).mockResolvedValue([]);
      vi.mocked(prisma.follow.count).mockResolvedValue(0);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/follows/following',
        headers: { authorization: authHeader() },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api/v1/follows/followers', () => {
    it('should return followers list', async () => {
      vi.mocked(prisma.follow.findMany).mockResolvedValue([]);
      vi.mocked(prisma.follow.count).mockResolvedValue(0);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/follows/followers',
        headers: { authorization: authHeader() },
      });

      expect(response.statusCode).toBe(200);
    });
  });
});

// ============================================
// NOTIFICATIONS
// ============================================
describe('Notifications Endpoints', () => {
  describe('GET /api/v1/notifications', () => {
    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return notification list', async () => {
      vi.mocked(prisma.notification.findMany).mockResolvedValue([]);
      vi.mocked(prisma.notification.count).mockResolvedValue(0);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications',
        headers: { authorization: authHeader() },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/notifications/notif-1/read',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/notifications/unread-count', () => {
    it('should return unread count', async () => {
      vi.mocked(prisma.notification.count).mockResolvedValue(5);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications/unread-count',
        headers: { authorization: authHeader() },
      });

      expect(response.statusCode).toBe(200);
    });
  });
});

// ============================================
// MISSIONS
// ============================================
describe('Missions Endpoints', () => {
  const mockMission = {
    id: 'mission-1',
    title: 'Daily Challenge',
    description: 'Share something about yourself',
    missionType: 'DAILY',
    responseTypes: ['TEXT'],
    isActive: true,
    publishDate: new Date(),
    createdAt: new Date(),
  };

  describe('GET /api/v1/missions', () => {
    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/missions',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return missions list', async () => {
      vi.mocked(prisma.mission.findMany).mockResolvedValue([mockMission] as any);
      vi.mocked(prisma.mission.count).mockResolvedValue(1);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/missions',
        headers: { authorization: authHeader() },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api/v1/missions/today', () => {
    it('should return todays mission', async () => {
      vi.mocked(prisma.mission.findMany).mockResolvedValue([mockMission] as any);
      vi.mocked(prisma.mission.findFirst).mockResolvedValue(mockMission as any);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/missions/today',
        headers: { authorization: authHeader() },
      });

      expect(response.statusCode).toBe(200);
    });
  });
});

// ============================================
// RESPONSES
// ============================================
describe('Responses Endpoints', () => {
  describe('GET /api/v1/responses', () => {
    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/responses',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return responses list', async () => {
      vi.mocked(prisma.response.findMany).mockResolvedValue([]);
      vi.mocked(prisma.response.count).mockResolvedValue(0);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/responses',
        headers: { authorization: authHeader() },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('POST /api/v1/responses', () => {
    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/responses',
        payload: {
          missionId: 'mission-1',
          responseType: 'TEXT',
          textContent: 'My response',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});

// ============================================
// STORIES
// ============================================
describe('Stories Endpoints', () => {
  describe('GET /api/v1/stories/feed', () => {
    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/stories/feed',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return stories feed', async () => {
      vi.mocked(prisma.story.findMany).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/stories/feed',
        headers: { authorization: authHeader() },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api/v1/stories/my', () => {
    it('should return user stories', async () => {
      vi.mocked(prisma.story.findMany).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/stories/my',
        headers: { authorization: authHeader() },
      });

      expect(response.statusCode).toBe(200);
    });
  });
});

// ============================================
// ACHIEVEMENTS
// ============================================
describe('Achievements Endpoints', () => {
  describe('GET /api/v1/achievements', () => {
    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/achievements',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return achievements list', async () => {
      vi.mocked(prisma.achievement.findMany).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/achievements',
        headers: { authorization: authHeader() },
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
