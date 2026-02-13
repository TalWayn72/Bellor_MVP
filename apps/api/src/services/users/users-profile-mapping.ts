/**
 * User Profile - Field mapping logic
 * Converts frontend input (camelCase + snake_case) to Prisma update data
 */

import { Prisma } from '@prisma/client';
import { logger, validateAndParseDate } from '../../lib/logger.js';
import type { UpdateUserProfileInput } from './users.types.js';

/** Prisma select fields for user profile responses */
export const USER_PROFILE_SELECT = {
  id: true, email: true, firstName: true, lastName: true, nickname: true,
  birthDate: true, gender: true, preferredLanguage: true, bio: true,
  profileImages: true, drawingUrl: true, sketchMethod: true, location: true,
  lookingFor: true, ageRangeMin: true, ageRangeMax: true, maxDistance: true,
  phone: true, occupation: true, education: true, interests: true,
  showOnline: true, showDistance: true, showAge: true, privateProfile: true, doNotSell: true,
  notifyNewMatches: true, notifyNewMessages: true, notifyChatRequests: true,
  notifyDailyMissions: true, notifyEmail: true,
  isBlocked: true, isPremium: true, isVerified: true, createdAt: true, lastActiveAt: true,
} as const;

/**
 * Build Prisma update data from frontend input
 */
export function buildUpdateData(input: UpdateUserProfileInput): Prisma.UserUpdateInput {
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
    updateData.location = input.location === null
      ? Prisma.JsonNull
      : typeof input.location === 'string'
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

  // Extra profile fields
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.occupation !== undefined) updateData.occupation = input.occupation;
  if (input.education !== undefined) updateData.education = input.education;
  if (input.interests !== undefined) updateData.interests = input.interests;

  // Privacy settings
  if (input.showOnline !== undefined) updateData.showOnline = input.showOnline;
  if (input.showDistance !== undefined) updateData.showDistance = input.showDistance;
  if (input.showAge !== undefined) updateData.showAge = input.showAge;
  if (input.privateProfile !== undefined) updateData.privateProfile = input.privateProfile;
  if (input.doNotSell !== undefined) updateData.doNotSell = input.doNotSell;

  // Notification preferences
  if (input.notifyNewMatches !== undefined) updateData.notifyNewMatches = input.notifyNewMatches;
  if (input.notifyNewMessages !== undefined) updateData.notifyNewMessages = input.notifyNewMessages;
  if (input.notifyChatRequests !== undefined) updateData.notifyChatRequests = input.notifyChatRequests;
  if (input.notifyDailyMissions !== undefined) updateData.notifyDailyMissions = input.notifyDailyMissions;
  if (input.notifyEmail !== undefined) updateData.notifyEmail = input.notifyEmail;

  updateData.lastActiveAt = new Date();
  return updateData;
}
