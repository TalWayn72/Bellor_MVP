/**
 * Auth Tokens Service
 * JWT generation, refresh token logic, password reset tokens
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.util.js';
import { sendPasswordResetEmail } from '../../lib/email.js';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_PREFIX = 'refresh_token:';
const RESET_TOKEN_PREFIX = 'password_reset:';
const RESET_TOKEN_EXPIRY = 60 * 60; // 1 hour in seconds

/**
 * Refresh access token using refresh token
 */
export async function refresh(refreshToken: string): Promise<{ accessToken: string }> {
  const payload = verifyRefreshToken(refreshToken);

  const storedToken = await redis.get(`${REFRESH_TOKEN_PREFIX}${payload.userId}`);

  if (!storedToken || storedToken !== refreshToken) {
    throw new Error('Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || !!user.isBlocked) {
    throw new Error('User not found or inactive');
  }

  const accessToken = generateAccessToken(user.id, user.email);
  return { accessToken };
}

/**
 * Logout user by invalidating refresh token
 */
export async function logout(userId: string): Promise<void> {
  await redis.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
}

/**
 * Store refresh token in Redis
 */
export async function storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
  await redis.setex(
    `${REFRESH_TOKEN_PREFIX}${userId}`,
    7 * 24 * 60 * 60, // 7 days in seconds
    refreshToken
  );
}

/**
 * Verify user's current password
 */
export async function verifyPassword(userId: string, password: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.passwordHash) {
    return false;
  }

  return bcrypt.compare(password, user.passwordHash);
}

/**
 * Change user's password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const isValid = await verifyPassword(userId, currentPassword);

  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
  });

  await logout(userId);
}

/**
 * Request a password reset email
 * Always returns success to prevent email enumeration
 */
export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.isBlocked) {
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');

  await redis.setex(
    `${RESET_TOKEN_PREFIX}${resetToken}`,
    RESET_TOKEN_EXPIRY,
    user.id
  );

  await sendPasswordResetEmail(email, resetToken, user.firstName ?? 'User');
}

/**
 * Reset password using a valid reset token
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const userId = await redis.get(`${RESET_TOKEN_PREFIX}${token}`);

  if (!userId) {
    throw new Error('Invalid or expired reset token');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
  });

  await redis.del(`${RESET_TOKEN_PREFIX}${token}`);
  await logout(userId);
}

// Re-export constants for backward compatibility
export { SALT_ROUNDS, REFRESH_TOKEN_PREFIX };
