/**
 * Auth Routes - Integration Tests: Register Endpoint
 *
 * Tests the full HTTP request/response cycle for user registration.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp } from '../build-test-app.js';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import type { User } from '@prisma/client';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('[P0][auth] POST /api/v1/auth/register', () => {
  const validRegistration = {
    email: 'newuser@example.com',
    password: 'StrongP@ss1',
    firstName: 'John',
    lastName: 'Doe',
    birthDate: '1990-01-01',
    gender: 'MALE',
  };

  it('should register a new user with valid data', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null); // No existing user
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'new-user-id',
      email: 'newuser@example.com',
      firstName: 'John',
      lastName: 'Doe',
      birthDate: new Date('1990-01-01'),
      gender: 'MALE',
      preferredLanguage: 'ENGLISH',
      isBlocked: false,
      isVerified: false,
      isPremium: false,
      createdAt: new Date(),
    } as unknown as User);
    vi.mocked(redis.setex).mockResolvedValue('OK');

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: validRegistration,
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('accessToken');
    expect(body.data).toHaveProperty('refreshToken');
    expect(body.data).toHaveProperty('user');
  });

  it('should return 400 for missing required fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'test@example.com' }, // Missing password, firstName, etc.
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid email format', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { ...validRegistration, email: 'not-an-email' },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for weak password (no uppercase)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { ...validRegistration, password: 'weakpass1!' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 for weak password (no special char)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { ...validRegistration, password: 'WeakPass1' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 for weak password (too short)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { ...validRegistration, password: 'Ab1!' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 409 when email already exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'existing-user',
      email: 'newuser@example.com',
    } as unknown as User);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: validRegistration,
    });

    expect(response.statusCode).toBe(409);
    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('USER_EXISTS');
  });

  it('should return 400 for invalid gender', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { ...validRegistration, gender: 'INVALID' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should accept optional preferredLanguage', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'new-user-id',
      email: 'newuser@example.com',
      firstName: 'John',
      lastName: 'Doe',
      preferredLanguage: 'HEBREW',
    } as unknown as User);
    vi.mocked(redis.setex).mockResolvedValue('OK');

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { ...validRegistration, preferredLanguage: 'HEBREW' },
    });

    expect(response.statusCode).toBe(201);
  });
});
