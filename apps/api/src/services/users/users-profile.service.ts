/**
 * User Profile Update Service
 * Handles complex field mapping from frontend to database
 */
import { prisma } from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { cacheDel, CacheKey } from '../../lib/cache.js';
import { logger, validateAndParseDate } from '../../lib/logger.js';
import type { UpdateUserProfileInput } from './users.types.js';

/**
 * Build Prisma update data from frontend input
 */
function buildUpdateData(input: UpdateUserProfileInput): Prisma.UserUpdateInput {
  const updateData: Prisma.UserUpdateInput = {};

  if (input.firstName) updateData.firstName = input.firstName;
  if (input.nickname) updateData.nickname = input.nickname;
  if (input.lastName) updateData.lastName = input.lastName;
  if (input.bio !== undefined) updateData.bio = input.bio;

  // Handle birthDate (with snake_case alias and age conversion) - SAFE PARSING
  const birthDateStr = input.birthDate || input.date_of_birth;
  if (birthDateStr) {
    logger.debug('USER_SERVICE', `Parsing birthDate`, { birthDateStr, type: typeof birthDateStr });
    const parsedDate = validateAndParseDate(birthDateStr, 'birthDate');
    if (parsedDate) {
      updateData.birthDate = parsedDate;
      logger.debug('USER_SERVICE', `birthDate parsed successfully`, { parsedDate: parsedDate.toISOString() });
    } else {
      logger.warn('USER_SERVICE', `birthDate validation failed, skipping field`, { birthDateStr });
    }
  } else if (input.age && typeof input.age === 'number' && input.age >= 18 && input.age <= 120) {
    const birthYear = new Date().getFullYear() - input.age;
    updateData.birthDate = new Date(`${birthYear}-01-01`);
    logger.debug('USER_SERVICE', `birthDate calculated from age`, { age: input.age, birthYear });
  }

  // Handle gender (uppercase, with flexible mapping)
  if (input.gender) {
    const genderMap: Record<string, 'MALE' | 'FEMALE' | 'OTHER'> = {
      'male': 'MALE', 'female': 'FEMALE', 'other': 'OTHER',
      'MALE': 'MALE', 'FEMALE': 'FEMALE', 'OTHER': 'OTHER',
      'NON_BINARY': 'OTHER', 'non_binary': 'OTHER', 'non-binary': 'OTHER',
    };
    const mappedGender = genderMap[input.gender.toLowerCase()] || genderMap[input.gender];
    if (mappedGender) updateData.gender = mappedGender;
  }

  // Handle profileImages (with snake_case alias)
  const images = input.profileImages || input.profile_images;
  if (images) {
    updateData.profileImages = images.filter((img: string) => img && typeof img === 'string');
  }

  // Handle drawing URL and sketch method (with snake_case aliases)
  const drawingUrl = input.drawingUrl || input.drawing_url;
  if (drawingUrl) updateData.drawingUrl = drawingUrl;
  const sketchMethod = input.sketchMethod || input.sketch_method;
  if (sketchMethod) updateData.sketchMethod = sketchMethod;

  // Handle location (can be string or object)
  if (input.location !== undefined) {
    updateData.location = typeof input.location === 'string'
      ? { city: input.location }
      : input.location;
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
    const mappedValue = map[input.looking_for];
    if (mappedValue) {
      updateData.lookingFor = input.looking_for === 'both' ? ['MALE', 'FEMALE'] : [mappedValue];
    }
  }

  if (input.ageRangeMin) updateData.ageRangeMin = input.ageRangeMin;
  if (input.ageRangeMax) updateData.ageRangeMax = input.ageRangeMax;
  if (input.maxDistance) updateData.maxDistance = input.maxDistance;

  updateData.lastActiveAt = new Date();
  return updateData;
}

const USER_PROFILE_SELECT = {
  id: true, email: true, firstName: true, lastName: true, nickname: true,
  birthDate: true, gender: true, preferredLanguage: true, bio: true,
  profileImages: true, drawingUrl: true, sketchMethod: true, location: true,
  lookingFor: true, ageRangeMin: true, ageRangeMax: true, maxDistance: true,
  isBlocked: true, isPremium: true, isVerified: true, createdAt: true, lastActiveAt: true,
} as const;

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
