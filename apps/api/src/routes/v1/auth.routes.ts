import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { bruteForceProtection } from '../../security/auth-hardening.js';
import { RATE_LIMITS } from '../../config/rate-limits.js';
import {
  handleRegister, handleLogin, handleRefresh, handleLogout,
  handleGetMe, handleChangePassword, handleForgotPassword, handleResetPassword,
} from './auth/auth-handlers.js';

export default async function authRoutes(app: FastifyInstance) {
  /** POST /auth/register */
  app.post('/register', {
    config: { rateLimit: RATE_LIMITS.auth.register },
    schema: { tags: ['Auth'], summary: 'Register a new user', description: 'Creates a new user account and returns access/refresh tokens' },
  }, handleRegister);

  /** POST /auth/login */
  app.post('/login', {
    config: { rateLimit: RATE_LIMITS.auth.login },
    preHandler: bruteForceProtection,
    schema: { tags: ['Auth'], summary: 'Login with email and password', description: 'Authenticates user and returns access/refresh tokens' },
  }, handleLogin);

  /** POST /auth/refresh */
  app.post('/refresh', {
    schema: { tags: ['Auth'], summary: 'Refresh access token', description: 'Exchange a valid refresh token for new access token' },
  }, handleRefresh);

  /** POST /auth/logout */
  app.post('/logout', { preHandler: authMiddleware, handler: handleLogout });

  /** GET /auth/me */
  app.get('/me', { preHandler: authMiddleware, handler: handleGetMe });

  /** POST /auth/change-password */
  app.post('/change-password', { preHandler: authMiddleware, handler: handleChangePassword });

  /** POST /auth/forgot-password */
  app.post('/forgot-password', {
    config: { rateLimit: RATE_LIMITS.auth.passwordReset },
    schema: { tags: ['Auth'], summary: 'Request password reset email', description: 'Sends a password reset link to the provided email address' },
  }, handleForgotPassword);

  /** POST /auth/reset-password */
  app.post('/reset-password', {
    config: { rateLimit: RATE_LIMITS.auth.passwordReset },
    schema: { tags: ['Auth'], summary: 'Reset password with token', description: 'Reset password using the token received via email' },
  }, handleResetPassword);
}
