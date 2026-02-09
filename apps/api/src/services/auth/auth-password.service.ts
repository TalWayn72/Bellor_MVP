import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { sendPasswordResetEmail } from '../../lib/email.js';
import {
  SALT_ROUNDS,
  RESET_TOKEN_PREFIX,
  RESET_TOKEN_EXPIRY,
} from './auth-types.js';
import { logout } from './auth-tokens.service.js';

/**
 * Verify user's current password
 */
export async function verifyPassword(
  userId: string,
  password: string
): Promise<boolean> {
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
  // Verify current password
  const isValid = await verifyPassword(userId, currentPassword);

  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
  });

  // Invalidate all refresh tokens
  await logout(userId);
}

/**
 * Request a password reset email
 * Always returns success to prevent email enumeration
 */
export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Always return silently to prevent email enumeration
  if (!user || user.isBlocked) {
    return;
  }

  // Generate a cryptographically secure reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Store token in Redis: token -> userId mapping (1 hour expiry)
  await redis.setex(
    `${RESET_TOKEN_PREFIX}${resetToken}`,
    RESET_TOKEN_EXPIRY,
    user.id
  );

  // Send password reset email
  await sendPasswordResetEmail(email, resetToken, user.firstName ?? 'User');
}

/**
 * Reset password using a valid reset token
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  // Look up the token in Redis
  const userId = await redis.get(`${RESET_TOKEN_PREFIX}${token}`);

  if (!userId) {
    throw new Error('Invalid or expired reset token');
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
  });

  // Delete the reset token (one-time use)
  await redis.del(`${RESET_TOKEN_PREFIX}${token}`);

  // Invalidate all refresh tokens (force re-login)
  await logout(userId);
}
