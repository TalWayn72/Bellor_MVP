import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

export interface ListUsersOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'firstName' | 'lastActiveAt';
  sortOrder?: 'asc' | 'desc';
  isBlocked?: boolean;
  isPremium?: boolean;
  language?: string;
}

export interface UpdateUserProfileInput {
  firstName?: string;
  lastName?: string;
  bio?: string;
  // Note: interests and profilePicture not in schema, removed
}

export interface SearchUsersOptions {
  query: string;
  limit?: number;
  offset?: number;
}

export class UsersService {
  /**
   * List users with pagination and filters
   */
  static async listUsers(options: ListUsersOptions = {}) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isBlocked,
      isPremium,
      language,
    } = options;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (isBlocked !== undefined) {
      where.isBlocked = isBlocked;
    }

    if (isPremium !== undefined) {
      where.isPremium = isPremium;
    }

    if (language) {
      where.preferredLanguage = language as any;
    }

    // Execute query with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
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
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
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
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, input: UpdateUserProfileInput) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        bio: input.bio,
      },
      select: {
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
      },
    });

    return updatedUser;
  }

  /**
   * Update user language preference
   */
  static async updateUserLanguage(
    userId: string,
    language: 'ENGLISH' | 'HEBREW' | 'SPANISH' | 'GERMAN' | 'FRENCH'
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { preferredLanguage: language },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        preferredLanguage: true,
      },
    });

    return updatedUser;
  }

  /**
   * Search users by name or email
   */
  static async searchUsers(options: SearchUsersOptions) {
    const { query, limit = 20, offset = 0 } = options;

    // Search in firstName, lastName, and email
    const where: Prisma.UserWhereInput = {
      AND: [
        { isBlocked: false }, // Only search active users
        {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
      ],
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          gender: true,
          preferredLanguage: true,
          bio: true,
          profileImages: true,
          isPremium: true,
        },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Deactivate user (soft delete)
   */
  static async deactivateUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true },
    });

    return { message: 'User deactivated successfully' };
  }

  /**
   * Reactivate user
   */
  static async reactivateUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: false },
    });

    return { message: 'User reactivated successfully' };
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw new Error('User not found');
    }

    return {
      userId: user.id,
      messagesCount: user._count.sentMessages,
      chatsCount: user._count.chatsAsUser1 + user._count.chatsAsUser2,
      isPremium: user.isPremium,
      memberSince: user.createdAt,
      lastLogin: user.lastActiveAt,
    };
  }
}
