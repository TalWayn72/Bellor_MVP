/**
 * User Service - Barrel file
 * Re-exports all user service functionality as a unified service object
 */

import { userProfileService } from './userService-profile';
import { userAuthService } from './userService-auth';

export type {
  User,
  Pagination,
  PaginationParams,
  GetUserResponse,
  UpdateProfileData,
  SearchUsersParams,
  SearchUsersResponse,
  UserStatsResponse,
  MessageResponse,
  ExportDataResponse,
} from './userService-types';

export { userProfileService } from './userService-profile';
export { userAuthService } from './userService-auth';

export const userService = {
  ...userProfileService,
  ...userAuthService,
};
