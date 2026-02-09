/**
 * Auth Service - barrel file for backward compatibility.
 * All logic has been split into apps/api/src/services/auth/:
 *   - auth-types.ts      (interfaces and constants)
 *   - auth-login.service.ts   (register, login)
 *   - auth-tokens.service.ts  (refresh, logout, storeRefreshToken)
 *   - auth-password.service.ts (verifyPassword, changePassword, forgotPassword, resetPassword)
 */
export {
  AuthService,
  type RegisterInput,
  type LoginInput,
  type AuthResponse,
} from './auth/index.js';
