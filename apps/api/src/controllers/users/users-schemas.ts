import { z } from 'zod';
import { logger } from '../../lib/logger.js';

// Custom date validation with detailed logging
export const dateStringSchema = z.string()
  .refine((val) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(val)) {
      logger.warn('ZOD_VALIDATION', 'Date format invalid', { value: val, expectedFormat: 'yyyy-MM-dd' });
      return false;
    }
    return true;
  }, { message: 'Date must be in yyyy-MM-dd format' })
  .refine((val) => {
    const parsed = new Date(val);
    if (isNaN(parsed.getTime())) {
      logger.warn('ZOD_VALIDATION', 'Date is invalid', { value: val });
      return false;
    }
    return true;
  }, { message: 'Invalid date' })
  .refine((val) => {
    const parsed = new Date(val);
    const year = parsed.getFullYear();
    const currentYear = new Date().getFullYear();
    const isValid = year >= 1900 && year <= currentYear - 18;
    if (!isValid) {
      logger.warn('ZOD_VALIDATION', 'Date year out of range', { value: val, year, validRange: `1900-${currentYear - 18}` });
    }
    return isValid;
  }, { message: 'Birth date must indicate age 18 or older' })
  .optional();

export const listUsersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z.enum(['createdAt', 'firstName', 'lastActiveAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  isBlocked: z.coerce.boolean().optional(),
  isPremium: z.coerce.boolean().optional(),
  language: z.enum(['ENGLISH', 'HEBREW', 'SPANISH', 'GERMAN', 'FRENCH']).optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  nickname: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional().nullable(),
  birthDate: dateStringSchema,
  date_of_birth: dateStringSchema,
  gender: z.string().optional(),
  profileImages: z.array(z.string()).optional(),
  profile_images: z.array(z.string()).optional(),
  drawingUrl: z.string().optional().nullable(),
  drawing_url: z.string().optional().nullable(),
  sketchMethod: z.string().optional(),
  sketch_method: z.string().optional(),
  location: z.union([z.string(), z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  })]).optional().nullable(),
  lookingFor: z.union([z.array(z.string()), z.string()]).optional(),
  looking_for: z.union([z.array(z.string()), z.string()]).optional(),
  ageRangeMin: z.number().int().min(18).max(100).optional(),
  ageRangeMax: z.number().int().min(18).max(100).optional(),
  maxDistance: z.number().int().min(1).max(500).optional(),
  age: z.number().optional().nullable(),
  phone: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  interests: z.array(z.string()).optional(),
  last_active_date: z.string().optional(),
  main_profile_image_url: z.string().optional().nullable(),
  verification_photos: z.array(z.string()).optional(),
  onboarding_completed: z.boolean().optional(),
  gender_other: z.string().optional(),
  location_city: z.string().optional(),
  location_state: z.string().optional(),
  can_currently_relocate: z.boolean().optional(),
  can_language_travel: z.boolean().optional(),
  response_count: z.number().optional(),
  chat_count: z.number().optional(),
  mission_completed_count: z.number().optional(),
}).passthrough();

export const updateLanguageSchema = z.object({
  language: z.enum(['ENGLISH', 'HEBREW', 'SPANISH', 'GERMAN', 'FRENCH']),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
