/**
 * Google OAuth Service barrel - re-exports all Google OAuth functionality
 * and composes the GoogleOAuthService class for backward compatibility.
 */
export type {
  GoogleUserInfo,
  GoogleAuthResult,
} from './google-oauth-client.js';

import { isConfigured, getAuthorizationUrl } from './google-oauth-client.js';
import { handleCallback } from './google-oauth-user.js';

/**
 * GoogleOAuthService class - delegates to split modules.
 * Preserves the static-method calling convention used across the codebase.
 */
export class GoogleOAuthService {
  static isConfigured = isConfigured;
  static getAuthorizationUrl = getAuthorizationUrl;
  static handleCallback = handleCallback;
}
