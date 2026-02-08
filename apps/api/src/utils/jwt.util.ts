import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JWTPayload {
  userId: string;
  id: string; // Alias for userId for backward compatibility
  email: string;
}

export interface RefreshTokenPayload {
  userId: string;
}

export const generateAccessToken = (userId: string, email: string): string => {
  const payload: JWTPayload = { userId, id: userId, email };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions) as string;
};

export const generateRefreshToken = (userId: string): string => {
  const payload: RefreshTokenPayload = { userId };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions) as string;
};

export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};
