/**
 * TypeScript interfaces and types for the Users service
 */

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
  bio?: string | null;
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
