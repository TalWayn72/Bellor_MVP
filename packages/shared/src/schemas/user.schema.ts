import { z } from 'zod';

export const GenderEnum = z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER']);
export const LanguageEnum = z.enum(['ENGLISH', 'HEBREW', 'SPANISH', 'GERMAN', 'FRENCH']);

export const LocationSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

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

export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
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

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  nickname: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional().nullable(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: GenderEnum.optional(),
  profileImages: z.array(z.string()).optional(),
  drawingUrl: z.string().optional().nullable(),
  sketchMethod: z.string().optional(),
  location: z.union([z.string(), LocationSchema]).optional().nullable(),
  phone: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  interests: z.array(z.string()).optional(),
  lookingFor: z.array(GenderEnum).optional(),
  ageRangeMin: z.number().int().min(18).max(100).optional(),
  ageRangeMax: z.number().int().min(18).max(100).optional(),
  maxDistance: z.number().int().min(1).max(500).optional(),
  showOnline: z.boolean().optional(),
  showDistance: z.boolean().optional(),
  showAge: z.boolean().optional(),
  privateProfile: z.boolean().optional(),
  doNotSell: z.boolean().optional(),
  notifyNewMatches: z.boolean().optional(),
  notifyNewMessages: z.boolean().optional(),
  notifyChatRequests: z.boolean().optional(),
  notifyDailyMissions: z.boolean().optional(),
  notifyEmail: z.boolean().optional(),
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

export type Gender = z.infer<typeof GenderEnum>;
export type Language = z.infer<typeof LanguageEnum>;
export type Location = z.infer<typeof LocationSchema>;
export type UserDb = z.infer<typeof UserDbSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
export type SearchUsersQuery = z.infer<typeof SearchUsersQuerySchema>;
