import { z } from 'zod';
import { GenderEnum, LanguageEnum, LocationSchema } from './user-profile.schema.js';

export const UserDbSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  passwordHash: z.string().optional().nullable(),
  googleId: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  nickname: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  birthDate: z.string().datetime().optional().nullable(),
  gender: GenderEnum.optional().nullable(),
  profileImages: z.array(z.string()),
  drawingUrl: z.string().optional().nullable(),
  sketchMethod: z.string().optional().nullable(),
  location: z.union([z.string(), LocationSchema]).optional().nullable(),
  phone: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  interests: z.array(z.string()),
  preferredLanguage: LanguageEnum,
  lookingFor: z.array(GenderEnum),
  ageRangeMin: z.number().int().optional().nullable(),
  ageRangeMax: z.number().int().optional().nullable(),
  maxDistance: z.number().int().optional().nullable(),
  showOnline: z.boolean(),
  showDistance: z.boolean(),
  showAge: z.boolean(),
  privateProfile: z.boolean(),
  doNotSell: z.boolean(),
  notifyNewMatches: z.boolean(),
  notifyNewMessages: z.boolean(),
  notifyChatRequests: z.boolean(),
  notifyDailyMissions: z.boolean(),
  notifyEmail: z.boolean(),
  isVerified: z.boolean(),
  isBlocked: z.boolean(),
  isPremium: z.boolean(),
  isAdmin: z.boolean(),
  premiumExpiresAt: z.string().datetime().optional().nullable(),
  lastActiveAt: z.string().datetime().optional().nullable(),
  responseCount: z.number().int(),
  chatCount: z.number().int(),
  missionCompletedCount: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ListUsersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z.enum(['createdAt', 'firstName', 'lastActiveAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  isBlocked: z.coerce.boolean().optional(),
  isPremium: z.coerce.boolean().optional(),
  language: LanguageEnum.optional(),
});

export const SearchUsersQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type UserDb = z.infer<typeof UserDbSchema>;
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
export type SearchUsersQuery = z.infer<typeof SearchUsersQuerySchema>;
