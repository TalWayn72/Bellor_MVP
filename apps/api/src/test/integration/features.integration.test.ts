/**
 * Feature Routes - Integration Tests
 * Tests likes, follows, notifications, missions, responses, stories endpoints
 *
 * @see PRD.md Section 10 - Phase 6 Testing
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, type Mock } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader } from '../build-test-app.js';
import { prisma } from '../../lib/prisma.js';
import type { User, Like, Follow, Notification, Mission } from '@prisma/client';

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
describe('[P2][infra] Likes Endpoints', () => {
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
      (prisma.user.findUnique as Mock).mockResolvedValue({ id: 'user-2' } as unknown as User);
      (prisma.like.findUnique as Mock).mockResolvedValue(null); // No existing like
      (prisma.like.findFirst as Mock).mockResolvedValue(null); // No mutual like
      (prisma.like.create as Mock).mockResolvedValue({
        id: 'like-1',
        userId: 'test-user-id',
        targetUserId: 'user-2',
        likeType: 'POSITIVE',
        createdAt: new Date(),
      } as unknown as Like);
      (prisma.notification.create as Mock).mockResolvedValue({} as unknown as Notification);

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
      (prisma.like.findFirst as Mock).mockResolvedValue(null);

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
      (prisma.like.findMany as Mock).mockResolvedValue([]);
      (prisma.like.count as Mock).mockResolvedValue(0);

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
describe('[P2][infra] Follows Endpoints', () => {
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
      (prisma.follow.findFirst as Mock).mockResolvedValue(null); // Not already following
      (prisma.follow.create as Mock).mockResolvedValue({
        id: 'follow-1',
        followerId: 'test-user-id',
        followingId: 'user-2',
        createdAt: new Date(),
      } as unknown as Follow);
      (prisma.notification.create as Mock).mockResolvedValue({} as unknown as Notification);

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
      (prisma.follow.findUnique as Mock).mockResolvedValue({
        id: 'follow-1',
        followerId: 'test-user-id',
        followingId: 'user-2',
      } as unknown as Follow);
      (prisma.follow.delete as Mock).mockResolvedValue({} as unknown as Follow);

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
      (prisma.follow.findMany as Mock).mockResolvedValue([]);
      (prisma.follow.count as Mock).mockResolvedValue(0);

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
      (prisma.follow.findMany as Mock).mockResolvedValue([]);
      (prisma.follow.count as Mock).mockResolvedValue(0);

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
describe('[P2][infra] Notifications Endpoints', () => {
  describe('GET /api/v1/notifications', () => {
    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return notification list', async () => {
      (prisma.notification.findMany as Mock).mockResolvedValue([]);
      (prisma.notification.count as Mock).mockResolvedValue(0);

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
      (prisma.notification.count as Mock).mockResolvedValue(5);

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
describe('[P2][infra] Missions Endpoints', () => {
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
      (prisma.mission.findMany as Mock).mockResolvedValue([mockMission] as unknown as Mission[]);
      (prisma.mission.count as Mock).mockResolvedValue(1);

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
      (prisma.mission.findMany as Mock).mockResolvedValue([mockMission] as unknown as Mission[]);
      (prisma.mission.findFirst as Mock).mockResolvedValue(mockMission as unknown as Mission);

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
describe('[P2][infra] Responses Endpoints', () => {
  describe('GET /api/v1/responses', () => {
    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/responses',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return responses list', async () => {
      (prisma.response.findMany as Mock).mockResolvedValue([]);
      (prisma.response.count as Mock).mockResolvedValue(0);

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
describe('[P2][infra] Stories Endpoints', () => {
  describe('GET /api/v1/stories/feed', () => {
    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/stories/feed',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return stories feed', async () => {
      (prisma.story.findMany as Mock).mockResolvedValue([]);

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
      (prisma.story.findMany as Mock).mockResolvedValue([]);

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
describe('[P2][infra] Achievements Endpoints', () => {
  describe('GET /api/v1/achievements', () => {
    it('should return 401 without authorization', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/achievements',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return achievements list', async () => {
      (prisma.achievement.findMany as Mock).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/achievements',
        headers: { authorization: authHeader() },
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
