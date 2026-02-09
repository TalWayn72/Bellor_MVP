export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';
  preferredLanguage?: 'ENGLISH' | 'HEBREW' | 'SPANISH' | 'GERMAN' | 'FRENCH';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    preferredLanguage: string;
  };
  accessToken: string;
  refreshToken: string;
}

/** Shared constants for auth service modules */
export const SALT_ROUNDS = 12;
export const REFRESH_TOKEN_PREFIX = 'refresh_token:';
export const RESET_TOKEN_PREFIX = 'password_reset:';
export const RESET_TOKEN_EXPIRY = 60 * 60; // 1 hour in seconds
export const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
