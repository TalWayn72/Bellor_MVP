import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../../utils/jwt.util.js';
import {
  getClient,
  REFRESH_TOKEN_PREFIX,
} from './google-oauth-client.js';
import type { GoogleUserInfo, GoogleAuthResult } from './google-oauth-client.js';

/**
 * Exchange authorization code for tokens and get user info
 */
export async function handleCallback(
  code: string
): Promise<GoogleAuthResult> {
  const client = getClient();

  // Exchange code for tokens
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  // Get user info from Google
  const response = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get user info from Google');
  }

  const googleUser = (await response.json()) as GoogleUserInfo;

  if (!googleUser.email) {
    throw new Error('Email not provided by Google');
  }

  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { email: googleUser.email },
  });

  let isNewUser = false;

  if (!user) {
    // Create new user
    isNewUser = true;
    user = await prisma.user.create({
      data: {
        email: googleUser.email,
        firstName:
          googleUser.given_name || googleUser.name?.split(' ')[0] || '',
        lastName:
          googleUser.family_name ||
          googleUser.name?.split(' ').slice(1).join(' ') ||
          '',
        googleId: googleUser.id,
        profileImages: googleUser.picture ? [googleUser.picture] : [],
        isVerified: googleUser.verified_email,
        isBlocked: false,
        preferredLanguage: 'ENGLISH',
        // Set defaults for required fields
        birthDate: new Date('1990-01-01'), // Will be updated in onboarding
        gender: 'OTHER',
      },
    });
  } else {
    // Update existing user with Google ID if not set
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.id,
          isVerified: user.isVerified || googleUser.verified_email,
        },
      });
    }

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });
  }

  // Check if user is blocked
  if (user.isBlocked) {
    throw new Error('Account is deactivated');
  }

  // Generate JWT tokens with admin status cached in JWT
  const accessToken = generateAccessToken(
    user.id,
    user.email,
    user.isAdmin
  );
  const refreshToken = generateRefreshToken(user.id);

  // Store refresh token in Redis
  await redis.setex(
    `${REFRESH_TOKEN_PREFIX}${user.id}`,
    7 * 24 * 60 * 60, // 7 days
    refreshToken
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      preferredLanguage: user.preferredLanguage,
    },
    accessToken,
    refreshToken,
    isNewUser,
  };
}
