import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt.util.js';
import {
  SALT_ROUNDS,
  REFRESH_TOKEN_PREFIX,
  REFRESH_TOKEN_TTL,
} from './auth-types.js';
import type { RegisterInput, LoginInput, AuthResponse } from './auth-types.js';

/**
 * Register a new user
 */
export async function register(input: RegisterInput): Promise<AuthResponse> {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      birthDate: input.birthDate,
      gender: input.gender,
      preferredLanguage: input.preferredLanguage || 'ENGLISH',
      isBlocked: false,
      isVerified: false,
    },
  });

  // Generate tokens (new users are never admin)
  const accessToken = generateAccessToken(user.id, user.email, false);
  const refreshToken = generateRefreshToken(user.id);

  // Store refresh token in Redis with expiry (7 days)
  await redis.setex(
    `${REFRESH_TOKEN_PREFIX}${user.id}`,
    REFRESH_TOKEN_TTL,
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
  };
}

/**
 * Login with email and password
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if user is active
  if (user.isBlocked) {
    throw new Error('Account is deactivated');
  }

  // OAuth users have no password — reject password login
  if (!user.passwordHash) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });

  // Generate tokens with admin status cached in JWT
  const accessToken = generateAccessToken(user.id, user.email, user.isAdmin);
  const refreshToken = generateRefreshToken(user.id);

  // Store refresh token in Redis
  await redis.setex(
    `${REFRESH_TOKEN_PREFIX}${user.id}`,
    REFRESH_TOKEN_TTL,
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
  };
}
