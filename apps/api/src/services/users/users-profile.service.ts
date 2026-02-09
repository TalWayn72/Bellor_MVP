/**
 * User Profile Update Service
 * Handles updating user profiles with complex field mapping
 */
import { prisma } from '../../lib/prisma.js';
import { cacheDel, CacheKey } from '../../lib/cache.js';
import { logger } from '../../lib/logger.js';
import type { UpdateUserProfileInput } from './users.types.js';
import { buildUpdateData, USER_PROFILE_SELECT } from './users-profile-mapping.js';

// Re-export mapping utilities for consumers that need them directly
export { buildUpdateData, USER_PROFILE_SELECT } from './users-profile-mapping.js';

/**
 * Update user profile with complex field mapping
 */
export async function updateUserProfile(userId: string, input: UpdateUserProfileInput) {
  logger.info('USER_SERVICE', `updateUserProfile called for user ${userId}`, {
    userId, inputKeys: Object.keys(input),
    dateFields: { birthDate: input.birthDate, date_of_birth: input.date_of_birth, age: input.age },
  });

  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    logger.warn('USER_SERVICE', `User not found: ${userId}`);
    throw new Error('User not found');
  }

  logger.debug('USER_SERVICE', `Found existing user`, { userId, email: existingUser.email });
  const updateData = buildUpdateData(input);

  logger.debug('USER_SERVICE', `Final updateData prepared`, {
    userId, updateDataKeys: Object.keys(updateData),
    updateData: {
      ...updateData,
      birthDate: updateData.birthDate instanceof Date
        ? (updateData.birthDate as Date).toISOString() : updateData.birthDate,
    },
  });

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId }, data: updateData, select: USER_PROFILE_SELECT,
    });
    logger.info('USER_SERVICE', `User updated successfully`, { userId, updatedFields: Object.keys(updateData) });
    await cacheDel(CacheKey.user(userId));
    return updatedUser;
  } catch (prismaError) {
    logger.error('USER_SERVICE', `Prisma update failed for user ${userId}`, prismaError as Error, {
      userId, updateData: {
        ...updateData,
        birthDate: updateData.birthDate instanceof Date
          ? (updateData.birthDate as Date).toISOString() : updateData.birthDate,
      },
    });
    throw prismaError;
  }
}
