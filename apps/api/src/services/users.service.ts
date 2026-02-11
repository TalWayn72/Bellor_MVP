/** Users Service - barrel file with core CRUD operations */
import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { cacheGet, cacheSet, cacheDel, CacheKey, CacheTTL } from '../lib/cache.js';

// Re-export types
export type { ListUsersOptions, UpdateUserProfileInput, SearchUsersOptions } from './users/users.types.js';

// Re-export sub-module functions
export { updateUserProfile } from './users/users-profile.service.js';
export { getUserStats, exportUserData, deleteUserGDPR } from './users/users-gdpr.service.js';

import type { ListUsersOptions, SearchUsersOptions } from './users/users.types.js';

const USER_LIST_SELECT = {
  id: true, email: true, firstName: true, lastName: true, birthDate: true,
  gender: true, preferredLanguage: true, bio: true, profileImages: true,
  isBlocked: true, isVerified: true, isPremium: true, isAdmin: true,
  createdAt: true, lastActiveAt: true,
} as const;

const USER_DETAIL_SELECT = {
  ...USER_LIST_SELECT,
  nickname: true, drawingUrl: true, sketchMethod: true, location: true,
  lookingFor: true, phone: true, occupation: true, education: true, interests: true,
} as const;

export class UsersService {
  /** List users with pagination and filters */
  static async listUsers(options: ListUsersOptions = {}) {
    const { limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'desc',
      isBlocked, isPremium, language } = options;

    const where: Prisma.UserWhereInput = {};
    if (isBlocked !== undefined) where.isBlocked = isBlocked;
    if (isPremium !== undefined) where.isPremium = isPremium;
    if (language) where.preferredLanguage = language as Prisma.EnumLanguageFilter;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, select: USER_LIST_SELECT,
        orderBy: { [sortBy]: sortOrder }, take: limit, skip: offset,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, pagination: { total, limit, offset, hasMore: offset + limit < total } };
  }

  /** Get user by ID */
  static async getUserById(userId: string) {
    const cached = await cacheGet<Record<string, unknown>>(CacheKey.user(userId));
    if (cached) return cached;

    const user = await prisma.user.findUnique({
      where: { id: userId }, select: USER_DETAIL_SELECT,
    });

    if (!user) throw new Error('User not found');
    await cacheSet(CacheKey.user(userId), user, CacheTTL.USER);
    return user;
  }

  /** Update user profile - delegates to sub-module */
  static async updateUserProfile(userId: string, input: import('./users/users.types.js').UpdateUserProfileInput) {
    const { updateUserProfile } = await import('./users/users-profile.service.js');
    return updateUserProfile(userId, input);
  }

  /** Update user language preference */
  static async updateUserLanguage(
    userId: string, language: 'ENGLISH' | 'HEBREW' | 'SPANISH' | 'GERMAN' | 'FRENCH'
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const updatedUser = await prisma.user.update({
      where: { id: userId }, data: { preferredLanguage: language },
      select: { id: true, email: true, firstName: true, lastName: true, preferredLanguage: true },
    });
    await cacheDel(CacheKey.user(userId));
    return updatedUser;
  }

  /** Search users by name or email */
  static async searchUsers(options: SearchUsersOptions) {
    const { query, limit = 20, offset = 0 } = options;

    const where: Prisma.UserWhereInput = {
      AND: [
        { isBlocked: false },
        { OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ]},
      ],
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, select: {
          id: true, email: true, firstName: true, lastName: true, gender: true,
          preferredLanguage: true, bio: true, profileImages: true, isPremium: true,
        },
        take: limit, skip: offset,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, pagination: { total, limit, offset, hasMore: offset + limit < total } };
  }

  /** Deactivate user (soft delete) */
  static async deactivateUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    await prisma.user.update({ where: { id: userId }, data: { isBlocked: true } });
    await cacheDel(CacheKey.user(userId));
    return { message: 'User deactivated successfully' };
  }

  /** Reactivate user */
  static async reactivateUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    await prisma.user.update({ where: { id: userId }, data: { isBlocked: false } });
    return { message: 'User reactivated successfully' };
  }

  /** Get user statistics - delegates to sub-module */
  static async getUserStats(userId: string) {
    const { getUserStats } = await import('./users/users-gdpr.service.js');
    return getUserStats(userId);
  }

  /** GDPR Data Export - delegates to sub-module */
  static async exportUserData(userId: string) {
    const { exportUserData } = await import('./users/users-gdpr.service.js');
    return exportUserData(userId);
  }

  /** GDPR Right to Erasure - delegates to sub-module */
  static async deleteUserGDPR(userId: string) {
    const { deleteUserGDPR } = await import('./users/users-gdpr.service.js');
    return deleteUserGDPR(userId);
  }
}
