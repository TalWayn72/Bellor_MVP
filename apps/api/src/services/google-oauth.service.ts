/**
 * Google OAuth Service - barrel file for backward compatibility.
 * All logic has been split into apps/api/src/services/google-oauth/:
 *   - google-oauth-client.ts  (OAuth2 client setup, isConfigured, getAuthorizationUrl)
 *   - google-oauth-user.ts    (handleCallback - user creation/update from Google auth)
 */
export { GoogleOAuthService } from './google-oauth/index.js';
