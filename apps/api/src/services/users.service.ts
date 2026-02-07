import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { cacheGet, cacheSet, cacheDel, CacheKey, CacheTTL } from '../lib/cache.js';
import { logger, validateAndParseDate } from '../lib/logger.js';

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
  nickname?: string; // alias for firstName
  bio?: string;
  birthDate?: string;
  date_of_birth?: string; // snake_case alias
  gender?: string;
  profileImages?: string[];
  profile_images?: string[]; // snake_case alias
  drawingUrl?: string;
  drawing_url?: string; // snake_case alias
  sketchMethod?: string;
  sketch_method?: string; // snake_case alias
  location?: string | { lat?: number; lng?: number; city?: string; country?: string };
  lookingFor?: string[];
  looking_for?: string; // snake_case alias
  ageRangeMin?: number;
  ageRangeMax?: number;
  maxDistance?: number;
  // Fields that don't exist in DB - will be ignored
  age?: number;
  phone?: string;
  occupation?: string;
  education?: string;
  interests?: string[];
  last_active_date?: string;
  main_profile_image_url?: string;
  verification_photos?: string[];
  onboarding_completed?: boolean;
  gender_other?: string;
  location_city?: string;
  location_state?: string;
  can_currently_relocate?: boolean;
  can_language_travel?: boolean;
  response_count?: number;
  chat_count?: number;
  mission_completed_count?: number;
  [key: string]: any; // Allow extra fields from frontend
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
          isVerified: true,
          isPremium: true,
          isAdmin: true,
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
    // Check cache first
    const cached = await cacheGet<any>(CacheKey.user(userId));
    if (cached) return cached;

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
        drawingUrl: true,
        sketchMethod: true,
        location: true,
        lookingFor: true,
        isBlocked: true,
        isVerified: true,
        isPremium: true,
        isAdmin: true,
        createdAt: true,
        lastActiveAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Cache the result
    await cacheSet(CacheKey.user(userId), user, CacheTTL.USER);

    return user;
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, input: UpdateUserProfileInput) {
    logger.info('USER_SERVICE', `updateUserProfile called for user ${userId}`, {
      userId,
      inputKeys: Object.keys(input),
      dateFields: {
        birthDate: input.birthDate,
        date_of_birth: input.date_of_birth,
        age: input.age,
      },
    });

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      logger.warn('USER_SERVICE', `User not found: ${userId}`);
      throw new Error('User not found');
    }

    logger.debug('USER_SERVICE', `Found existing user`, { userId, email: existingUser.email });

    // Build update data, mapping frontend fields to database fields
    const updateData: Prisma.UserUpdateInput = {};

    // Handle firstName
    if (input.firstName) updateData.firstName = input.firstName;

    // Handle nickname (display name) - separate from firstName
    if (input.nickname) updateData.nickname = input.nickname;

    if (input.lastName) updateData.lastName = input.lastName;
    if (input.bio !== undefined) updateData.bio = input.bio;

    // Handle birthDate (with snake_case alias and age conversion) - SAFE PARSING
    const birthDateStr = input.birthDate || input.date_of_birth;
    if (birthDateStr) {
      logger.debug('USER_SERVICE', `Parsing birthDate`, { birthDateStr, type: typeof birthDateStr });

      // Use safe validation with logging
      const parsedDate = validateAndParseDate(birthDateStr, 'birthDate');
      if (parsedDate) {
        updateData.birthDate = parsedDate;
        logger.debug('USER_SERVICE', `birthDate parsed successfully`, { parsedDate: parsedDate.toISOString() });
      } else {
        logger.warn('USER_SERVICE', `birthDate validation failed, skipping field`, { birthDateStr });
        // Don't update birthDate if validation fails - fail silently for this field
      }
    } else if (input.age && typeof input.age === 'number' && input.age >= 18 && input.age <= 120) {
      // Convert age to approximate birthDate
      const birthYear = new Date().getFullYear() - input.age;
      updateData.birthDate = new Date(`${birthYear}-01-01`);
      logger.debug('USER_SERVICE', `birthDate calculated from age`, { age: input.age, birthYear });
    }

    // Handle gender (uppercase, with flexible mapping)
    if (input.gender) {
      const genderMap: Record<string, 'MALE' | 'FEMALE' | 'OTHER'> = {
        'male': 'MALE',
        'female': 'FEMALE',
        'other': 'OTHER',
        'MALE': 'MALE',
        'FEMALE': 'FEMALE',
        'OTHER': 'OTHER',
        'NON_BINARY': 'OTHER',
        'non_binary': 'OTHER',
        'non-binary': 'OTHER',
      };
      const mappedGender = genderMap[input.gender.toLowerCase()] || genderMap[input.gender];
      if (mappedGender) updateData.gender = mappedGender;
    }

    // Handle profileImages (with snake_case alias) - filter out falsy values
    const images = input.profileImages || input.profile_images;
    if (images) {
      updateData.profileImages = images.filter((img: string) => img && typeof img === 'string');
    }

    // Handle drawing URL (with snake_case alias)
    const drawingUrl = input.drawingUrl || input.drawing_url;
    if (drawingUrl) updateData.drawingUrl = drawingUrl;

    // Handle sketch method (with snake_case alias)
    const sketchMethod = input.sketchMethod || input.sketch_method;
    if (sketchMethod) updateData.sketchMethod = sketchMethod;

    // Handle location (can be string or object)
    if (input.location !== undefined) {
      if (typeof input.location === 'string') {
        updateData.location = { city: input.location };
      } else {
        updateData.location = input.location;
      }
    }

    // Handle lookingFor (with snake_case alias)
    if (input.lookingFor) {
      updateData.lookingFor = input.lookingFor.map((g: string) => {
        const map: Record<string, 'MALE' | 'FEMALE' | 'OTHER'> = {
          'male': 'MALE', 'female': 'FEMALE', 'other': 'OTHER',
          'MALE': 'MALE', 'FEMALE': 'FEMALE', 'OTHER': 'OTHER',
        };
        return map[g] || 'OTHER';
      });
    }
    if (input.looking_for) {
      const map: Record<string, 'MALE' | 'FEMALE' | 'OTHER'> = {
        'male': 'MALE', 'female': 'FEMALE', 'other': 'OTHER', 'both': 'OTHER',
        'MALE': 'MALE', 'FEMALE': 'FEMALE', 'OTHER': 'OTHER',
      };
      // If it's a single value, convert to array
      const mappedValue = map[input.looking_for];
      if (mappedValue) {
        updateData.lookingFor = input.looking_for === 'both' ? ['MALE', 'FEMALE'] : [mappedValue];
      }
    }

    if (input.ageRangeMin) updateData.ageRangeMin = input.ageRangeMin;
    if (input.ageRangeMax) updateData.ageRangeMax = input.ageRangeMax;
    if (input.maxDistance) updateData.maxDistance = input.maxDistance;

    // Update lastActiveAt
    updateData.lastActiveAt = new Date();

    logger.debug('USER_SERVICE', `Final updateData prepared`, {
      userId,
      updateDataKeys: Object.keys(updateData),
      updateData: {
        ...updateData,
        // Log birthDate as ISO string for readability
        birthDate: updateData.birthDate instanceof Date
          ? (updateData.birthDate as Date).toISOString()
          : updateData.birthDate,
      },
    });

    // Update user with try-catch for detailed error logging
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          nickname: true,
          birthDate: true,
          gender: true,
          preferredLanguage: true,
          bio: true,
          profileImages: true,
          drawingUrl: true,
          sketchMethod: true,
          location: true,
          lookingFor: true,
          ageRangeMin: true,
          ageRangeMax: true,
          maxDistance: true,
          isBlocked: true,
          isPremium: true,
          isVerified: true,
          createdAt: true,
          lastActiveAt: true,
        },
      });

      logger.info('USER_SERVICE', `User updated successfully`, {
        userId,
        updatedFields: Object.keys(updateData),
      });

      // Invalidate user cache
      await cacheDel(CacheKey.user(userId));

      return updatedUser;
    } catch (prismaError) {
      logger.error('USER_SERVICE', `Prisma update failed for user ${userId}`, prismaError as Error, {
        userId,
        updateData: {
          ...updateData,
          birthDate: updateData.birthDate instanceof Date
            ? (updateData.birthDate as Date).toISOString()
            : updateData.birthDate,
        },
      });
      throw prismaError;
    }
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

    // Invalidate user cache
    await cacheDel(CacheKey.user(userId));

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

    await cacheDel(CacheKey.user(userId));

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

  /**
   * GDPR Data Export - Export all user data
   */
  static async exportUserData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sentMessages: {
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
        responses: {
          select: {
            id: true,
            content: true,
            responseType: true,
            createdAt: true,
          },
        },
        stories: {
          select: {
            id: true,
            mediaUrl: true,
            caption: true,
            createdAt: true,
          },
        },
        achievements: {
          include: {
            achievement: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Structure the export data according to GDPR requirements
    return {
      personalInformation: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        birthDate: user.birthDate,
        gender: user.gender,
        bio: user.bio,
        location: user.location,
        preferredLanguage: user.preferredLanguage,
        profileImages: user.profileImages,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
      },
      preferences: {
        lookingFor: user.lookingFor,
        ageRangeMin: user.ageRangeMin,
        ageRangeMax: user.ageRangeMax,
        maxDistance: user.maxDistance,
      },
      accountStatus: {
        isVerified: user.isVerified,
        isPremium: user.isPremium,
        premiumExpiresAt: user.premiumExpiresAt,
      },
      content: {
        messages: user.sentMessages,
        responses: user.responses,
        stories: user.stories,
      },
      achievements: user.achievements.map(ua => ({
        name: ua.achievement.name,
        description: ua.achievement.description,
        unlockedAt: ua.unlockedAt,
      })),
      statistics: {
        responseCount: user.responseCount,
        chatCount: user.chatCount,
        missionCompletedCount: user.missionCompletedCount,
      },
    };
  }

  /**
   * GDPR Right to Erasure - Permanently delete all user data
   */
  static async deleteUserGDPR(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Delete all related data in correct order (respecting foreign keys)
    await prisma.$transaction(async (tx) => {
      // Delete messages
      await tx.message.deleteMany({
        where: { senderId: userId },
      });

      // Delete responses
      await tx.response.deleteMany({
        where: { userId: userId },
      });

      // Delete stories
      await tx.story.deleteMany({
        where: { userId: userId },
      });

      // Delete user achievements
      await tx.userAchievement.deleteMany({
        where: { userId: userId },
      });

      // Delete notifications
      await tx.notification.deleteMany({
        where: { userId: userId },
      });

      // Delete chats where user is participant
      await tx.chat.deleteMany({
        where: {
          OR: [
            { user1Id: userId },
            { user2Id: userId },
          ],
        },
      });

      // Delete reports made by or against user
      await tx.report.deleteMany({
        where: {
          OR: [
            { reporterId: userId },
            { reportedUserId: userId },
          ],
        },
      });

      // Delete likes
      await tx.like.deleteMany({
        where: {
          OR: [
            { userId: userId },
            { targetUserId: userId },
          ],
        },
      });

      // Delete follows
      await tx.follow.deleteMany({
        where: {
          OR: [
            { followerId: userId },
            { followingId: userId },
          ],
        },
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: userId },
      });
    });

    // Invalidate user cache
    await cacheDel(CacheKey.user(userId));

    return { message: 'User and all related data permanently deleted' };
  }
}
