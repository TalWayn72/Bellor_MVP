/**
 * User Schema - Barrel file
 * Re-exports all user-related schemas from split modules
 */

export {
  GenderEnum,
  LanguageEnum,
  LocationSchema,
  UserResponseSchema,
  UpdateProfileSchema,
} from './user-profile.schema.js';

export type {
  Gender,
  Language,
  Location,
  UserResponse,
  UpdateProfile,
} from './user-profile.schema.js';

export {
  UserDbSchema,
  ListUsersQuerySchema,
  SearchUsersQuerySchema,
} from './user-auth.schema.js';

export type {
  UserDb,
  ListUsersQuery,
  SearchUsersQuery,
} from './user-auth.schema.js';
