/**
 * Auth Service barrel - re-exports all auth functionality
 * and composes the AuthService class for backward compatibility.
 */
export type { RegisterInput, LoginInput, AuthResponse } from './auth-types.js';

export {
  SALT_ROUNDS,
  REFRESH_TOKEN_PREFIX,
  RESET_TOKEN_PREFIX,
  RESET_TOKEN_EXPIRY,
  REFRESH_TOKEN_TTL,
} from './auth-types.js';

import { register, login } from './auth-login.service.js';
import { refresh, logout, storeRefreshToken } from './auth-tokens.service.js';
import {
  verifyPassword,
  changePassword,
  forgotPassword,
  resetPassword,
} from './auth-password.service.js';

/**
 * AuthService class - delegates to split modules.
 * Preserves the static-method calling convention used across the codebase.
 */
export class AuthService {
  static register = register;
  static login = login;
  static refresh = refresh;
  static logout = logout;
  static storeRefreshToken = storeRefreshToken;
  static verifyPassword = verifyPassword;
  static changePassword = changePassword;
  static forgotPassword = forgotPassword;
  static resetPassword = resetPassword;
}
