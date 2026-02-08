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
  drawingUrl?: string | null;
  drawing_url?: string | null; // snake_case alias
  sketchMethod?: string;
  sketch_method?: string; // snake_case alias
  location?: string | { lat?: number; lng?: number; city?: string; country?: string } | null;
  lookingFor?: string[];
  looking_for?: string; // snake_case alias
  ageRangeMin?: number;
  ageRangeMax?: number;
  maxDistance?: number;
  // Extra profile fields
  age?: number;
  phone?: string | null;
  occupation?: string | null;
  education?: string | null;
  interests?: string[];
  // Privacy settings
  showOnline?: boolean;
  showDistance?: boolean;
  showAge?: boolean;
  privateProfile?: boolean;
  doNotSell?: boolean;
  // Notification preferences
  notifyNewMatches?: boolean;
  notifyNewMessages?: boolean;
  notifyChatRequests?: boolean;
  notifyDailyMissions?: boolean;
  notifyEmail?: boolean;
  // Legacy fields from frontend
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
