import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';
  preferredLanguage?: 'ENGLISH' | 'HEBREW' | 'SPANISH' | 'GERMAN' | 'FRENCH';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    preferredLanguage: string;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly REFRESH_TOKEN_PREFIX = 'refresh_token:';

  /**
   * Register a new user
   */
  static async register(input: RegisterInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, this.SALT_ROUNDS);

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

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in Redis with expiry (7 days)
    await redis.setex(
      `${this.REFRESH_TOKEN_PREFIX}${user.id}`,
      7 * 24 * 60 * 60, // 7 days in seconds
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
  static async login(input: LoginInput): Promise<AuthResponse> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!!user.isBlocked) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash!);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in Redis
    await redis.setex(
      `${this.REFRESH_TOKEN_PREFIX}${user.id}`,
      7 * 24 * 60 * 60,
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
   * Refresh access token using refresh token
   */
  static async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if refresh token exists in Redis
    const storedToken = await redis.get(`${this.REFRESH_TOKEN_PREFIX}${payload.userId}`);

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

    // Generate new access token
    const accessToken = generateAccessToken(user.id, user.email);

    return { accessToken };
  }

  /**
   * Logout user by invalidating refresh token
   */
  static async logout(userId: string): Promise<void> {
    // Remove refresh token from Redis
    await redis.del(`${this.REFRESH_TOKEN_PREFIX}${userId}`);
  }

  /**
   * Verify user's current password
   */
  static async verifyPassword(userId: string, password: string): Promise<boolean> {
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
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Verify current password
    const isValid = await this.verifyPassword(userId, currentPassword);

    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    // Invalidate all refresh tokens
    await this.logout(userId);
  }
}
