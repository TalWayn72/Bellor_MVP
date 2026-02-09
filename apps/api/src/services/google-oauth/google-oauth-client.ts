import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env.js';

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export interface GoogleAuthResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    preferredLanguage: string;
  };
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

export const REFRESH_TOKEN_PREFIX = 'refresh_token:';

let oauthClient: OAuth2Client | null = null;

/**
 * Get or create the singleton OAuth2Client
 */
export function getClient(): OAuth2Client {
  if (!oauthClient) {
    oauthClient = new OAuth2Client(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    );
  }
  return oauthClient;
}

/**
 * Check if Google OAuth is configured
 */
export function isConfigured(): boolean {
  return !!(
    env.GOOGLE_CLIENT_ID &&
    env.GOOGLE_CLIENT_SECRET &&
    env.GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate the Google OAuth authorization URL
 */
export function getAuthorizationUrl(state?: string): string {
  const client = getClient();

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    prompt: 'consent',
    state: state || '',
  });
}
