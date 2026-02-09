/**
 * User Service Types
 * Shared interfaces for user service modules
 */

export interface User {
  id: string;
  email?: string;
  nickname?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  age?: number;
  location?: string;
  profile_images?: string[];
  main_profile_image_url?: string;
  is_verified?: boolean;
  is_admin?: boolean;
  is_premium?: boolean;
  is_blocked?: boolean;
  [key: string]: unknown;
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface GetUserResponse {
  user: User;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  profilePictureUrl?: string;
  preferredLanguage?: string;
  profile_images?: string[];
  main_profile_image_url?: string;
  [key: string]: unknown;
}

export interface SearchUsersParams extends PaginationParams {
  search?: string;
  isBlocked?: boolean;
}

export interface SearchUsersResponse {
  users: User[];
  total: number;
  pagination?: Pagination;
}

export interface UserStatsResponse {
  stats: unknown;
}

export interface MessageResponse {
  message: string;
}

export interface ExportDataResponse {
  data: unknown;
}
