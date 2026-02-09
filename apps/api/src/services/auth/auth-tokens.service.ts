import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import {
  generateAccessToken,
  verifyRefreshToken,
} from '../../utils/jwt.util.js';
import { REFRESH_TOKEN_PREFIX, REFRESH_TOKEN_TTL } from './auth-types.js';

/**
 * Refresh access token using refresh token
 */
export async function refresh(
  refreshToken: string
): Promise<{ accessToken: string }> {
  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);

  // Check if refresh token exists in Redis
  const storedToken = await redis.get(
    `${REFRESH_TOKEN_PREFIX}${payload.userId}`
  );

  if (!storedToken || storedToken !== refreshToken) {
    throw new Error('Invalid or expired refresh token');
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || !!user.isBlocked) {
    throw new Error('User not found or inactive');
  }

  // Generate new access token with current admin status
  const accessToken = generateAccessToken(user.id, user.email, user.isAdmin);

  return { accessToken };
}

/**
 * Logout user by invalidating refresh token
 */
export async function logout(userId: string): Promise<void> {
  // Remove refresh token from Redis
  await redis.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
}

/**
 * Store refresh token in Redis
 */
export async function storeRefreshToken(
  userId: string,
  refreshToken: string
): Promise<void> {
  await redis.setex(
    `${REFRESH_TOKEN_PREFIX}${userId}`,
    REFRESH_TOKEN_TTL,
    refreshToken
  );
}
