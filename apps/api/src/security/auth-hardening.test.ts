/**
 * Tests for Auth Hardening (Brute Force Protection)
 * Covers: failed attempt tracking, lockout threshold, lockout clearing,
 * remaining attempts, middleware behavior, IP-based tracking.
 *
 * Uses mocked Redis from test/setup.ts.
 *
 * @see security/auth-hardening.ts
 * @see config/security.config.ts RATE_LIMITS.bruteForce
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../lib/redis.js';
import {
  recordFailedAttempt,
  isLockedOut,
  clearFailedAttempts,
  getRemainingAttempts,
  bruteForceProtection,
  handleFailedLogin,
  handleSuccessfulLogin,
} from './auth-hardening.js';

// Redis is already mocked via test/setup.ts
const mockRedis = vi.mocked(redis);

// Mock security logger
vi.mock('./logger.js', () => ({
  securityLogger: {
    bruteForceBlocked: vi.fn(),
    loginFailure: vi.fn(),
    loginSuccess: vi.fn(),
  },
}));

import { securityLogger } from './logger.js';

const mockSecurityLogger = vi.mocked(securityLogger);

// ============================================
// Helpers
// ============================================

function createMockRequest(overrides: Partial<{
  ip: string;
  body: Record<string, unknown>;
  headers: Record<string, string>;
  log: Record<string, unknown>;
}>): FastifyRequest {
  return {
    ip: overrides.ip || '192.168.1.1',
    body: overrides.body || {},
    headers: overrides.headers || {},
    log: overrides.log || { warn: vi.fn() },
  } as unknown as FastifyRequest;
}

function createMockReply(): FastifyReply {
  const reply = {
    code: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply;
  return reply;
}

// ============================================
// recordFailedAttempt
// ============================================

describe('[P0][safety] recordFailedAttempt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should increment the counter in Redis', async () => {
    mockRedis.incr.mockResolvedValue(1);

    await recordFailedAttempt('192.168.1.1', 'user@example.com');

    expect(mockRedis.incr).toHaveBeenCalledWith('bf:192.168.1.1:user@example.com');
  });

  it('should set expiry on first attempt (attempts === 1)', async () => {
    mockRedis.incr.mockResolvedValue(1);

    await recordFailedAttempt('192.168.1.1', 'user@example.com');

    // lockoutMinutes = 15, so expire = 15 * 60 = 900 seconds
    expect(mockRedis.expire).toHaveBeenCalledWith(
      'bf:192.168.1.1:user@example.com',
      900,
    );
  });

  it('should NOT set expiry on subsequent attempts', async () => {
    mockRedis.incr.mockResolvedValue(3);

    await recordFailedAttempt('192.168.1.1', 'user@example.com');

    expect(mockRedis.expire).not.toHaveBeenCalled();
  });

  it('should return the current attempt count', async () => {
    mockRedis.incr.mockResolvedValue(4);

    const attempts = await recordFailedAttempt('10.0.0.1', 'test@test.com');

    expect(attempts).toBe(4);
  });

  it('should use IP and identifier in the key', async () => {
    mockRedis.incr.mockResolvedValue(1);

    await recordFailedAttempt('10.0.0.5', 'admin@bellor.app');

    expect(mockRedis.incr).toHaveBeenCalledWith('bf:10.0.0.5:admin@bellor.app');
  });
});

// ============================================
// isLockedOut
// ============================================

describe('[P0][safety] isLockedOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when attempts >= maxAttempts (5)', async () => {
    mockRedis.get.mockResolvedValue('5');

    const locked = await isLockedOut('192.168.1.1', 'user@example.com');

    expect(locked).toBe(true);
  });

  it('should return true when attempts exceed maxAttempts', async () => {
    mockRedis.get.mockResolvedValue('10');

    const locked = await isLockedOut('192.168.1.1', 'user@example.com');

    expect(locked).toBe(true);
  });

  it('should return false when attempts < maxAttempts', async () => {
    mockRedis.get.mockResolvedValue('3');

    const locked = await isLockedOut('192.168.1.1', 'user@example.com');

    expect(locked).toBe(false);
  });

  it('should return false when no attempts recorded (null)', async () => {
    mockRedis.get.mockResolvedValue(null);

    const locked = await isLockedOut('192.168.1.1', 'user@example.com');

    expect(locked).toBe(false);
  });

  it('should return false at exactly 4 attempts (one below threshold)', async () => {
    mockRedis.get.mockResolvedValue('4');

    const locked = await isLockedOut('192.168.1.1', 'user@example.com');

    expect(locked).toBe(false);
  });

  it('should query the correct Redis key', async () => {
    mockRedis.get.mockResolvedValue(null);

    await isLockedOut('10.0.0.1', 'test@test.com');

    expect(mockRedis.get).toHaveBeenCalledWith('bf:10.0.0.1:test@test.com');
  });
});

// ============================================
// clearFailedAttempts
// ============================================

describe('[P0][safety] clearFailedAttempts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete the tracking key from Redis', async () => {
    await clearFailedAttempts('192.168.1.1', 'user@example.com');

    expect(mockRedis.del).toHaveBeenCalledWith('bf:192.168.1.1:user@example.com');
  });

  it('should use the correct key format', async () => {
    await clearFailedAttempts('10.0.0.5', 'admin@bellor.app');

    expect(mockRedis.del).toHaveBeenCalledWith('bf:10.0.0.5:admin@bellor.app');
  });
});

// ============================================
// getRemainingAttempts
// ============================================

describe('[P0][safety] getRemainingAttempts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return maxAttempts (5) when no attempts recorded', async () => {
    mockRedis.get.mockResolvedValue(null);

    const remaining = await getRemainingAttempts('192.168.1.1', 'user@example.com');

    expect(remaining).toBe(5);
  });

  it('should return correct remaining count', async () => {
    mockRedis.get.mockResolvedValue('2');

    const remaining = await getRemainingAttempts('192.168.1.1', 'user@example.com');

    expect(remaining).toBe(3);
  });

  it('should return 0 when at max attempts', async () => {
    mockRedis.get.mockResolvedValue('5');

    const remaining = await getRemainingAttempts('192.168.1.1', 'user@example.com');

    expect(remaining).toBe(0);
  });

  it('should return 0 when over max attempts (never negative)', async () => {
    mockRedis.get.mockResolvedValue('10');

    const remaining = await getRemainingAttempts('192.168.1.1', 'user@example.com');

    expect(remaining).toBe(0);
  });

  it('should return 1 when at 4 attempts', async () => {
    mockRedis.get.mockResolvedValue('4');

    const remaining = await getRemainingAttempts('192.168.1.1', 'user@example.com');

    expect(remaining).toBe(1);
  });
});

// ============================================
// bruteForceProtection middleware
// ============================================

describe('[P0][safety] bruteForceProtection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow request when not locked out', async () => {
    mockRedis.get.mockResolvedValue('2'); // 2 attempts, below threshold

    const request = createMockRequest({
      ip: '192.168.1.1',
      body: { email: 'user@example.com' },
    });
    const reply = createMockReply();

    await bruteForceProtection(request, reply);

    expect(reply.code).not.toHaveBeenCalled();
    expect(reply.send).not.toHaveBeenCalled();
  });

  it('should block request when locked out (429)', async () => {
    mockRedis.get.mockResolvedValue('5'); // At threshold

    const request = createMockRequest({
      ip: '192.168.1.1',
      body: { email: 'user@example.com' },
    });
    const reply = createMockReply();

    await bruteForceProtection(request, reply);

    expect(reply.code).toHaveBeenCalledWith(429);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'TOO_MANY_ATTEMPTS',
          message: expect.stringContaining('15 minutes'),
        }),
      }),
    );
  });

  it('should log brute force blocked event', async () => {
    mockRedis.get.mockResolvedValue('5');

    const request = createMockRequest({
      ip: '192.168.1.1',
      body: { email: 'hacker@evil.com' },
    });
    const reply = createMockReply();

    await bruteForceProtection(request, reply);

    expect(mockSecurityLogger.bruteForceBlocked).toHaveBeenCalledWith(
      request,
      'hacker@evil.com',
      5, // maxAttempts
    );
  });

  it('should use "unknown" as identifier when no email in body', async () => {
    mockRedis.get.mockResolvedValue('5');

    const request = createMockRequest({
      ip: '192.168.1.1',
      body: {},
    });
    const reply = createMockReply();

    await bruteForceProtection(request, reply);

    expect(mockRedis.get).toHaveBeenCalledWith('bf:192.168.1.1:unknown');
  });

  it('should use request.ip for tracking', async () => {
    mockRedis.get.mockResolvedValue(null);

    const request = createMockRequest({
      ip: '10.0.0.42',
      body: { email: 'test@test.com' },
    });
    const reply = createMockReply();

    await bruteForceProtection(request, reply);

    expect(mockRedis.get).toHaveBeenCalledWith('bf:10.0.0.42:test@test.com');
  });

  it('should allow request with no previous attempts', async () => {
    mockRedis.get.mockResolvedValue(null);

    const request = createMockRequest({
      ip: '192.168.1.1',
      body: { email: 'new@user.com' },
    });
    const reply = createMockReply();

    await bruteForceProtection(request, reply);

    expect(reply.code).not.toHaveBeenCalled();
  });

  it('should handle undefined body gracefully', async () => {
    mockRedis.get.mockResolvedValue(null);

    const request = {
      ip: '192.168.1.1',
      body: undefined,
      headers: {},
    } as unknown as FastifyRequest;
    const reply = createMockReply();

    await bruteForceProtection(request, reply);

    expect(mockRedis.get).toHaveBeenCalledWith('bf:192.168.1.1:unknown');
    expect(reply.code).not.toHaveBeenCalled();
  });
});

// ============================================
// handleFailedLogin
// ============================================

describe('[P0][safety] handleFailedLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should record the failed attempt and return status', async () => {
    mockRedis.incr.mockResolvedValue(3);

    const request = createMockRequest({ ip: '192.168.1.1' });
    const result = await handleFailedLogin(request, 'user@example.com');

    expect(result.attempts).toBe(3);
    expect(result.remaining).toBe(2);
    expect(result.locked).toBe(false);
  });

  it('should indicate locked when reaching max attempts', async () => {
    mockRedis.incr.mockResolvedValue(5);

    const request = createMockRequest({ ip: '192.168.1.1' });
    const result = await handleFailedLogin(request, 'user@example.com');

    expect(result.locked).toBe(true);
    expect(result.remaining).toBe(0);
    expect(result.attempts).toBe(5);
  });

  it('should indicate locked when exceeding max attempts', async () => {
    mockRedis.incr.mockResolvedValue(7);

    const request = createMockRequest({ ip: '192.168.1.1' });
    const result = await handleFailedLogin(request, 'user@example.com');

    expect(result.locked).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('should log brute force when locked', async () => {
    mockRedis.incr.mockResolvedValue(5);

    const request = createMockRequest({ ip: '192.168.1.1' });
    await handleFailedLogin(request, 'user@example.com');

    expect(mockSecurityLogger.bruteForceBlocked).toHaveBeenCalledWith(
      request,
      'user@example.com',
      5,
    );
  });

  it('should log login failure when not locked', async () => {
    mockRedis.incr.mockResolvedValue(2);

    const request = createMockRequest({ ip: '192.168.1.1' });
    await handleFailedLogin(request, 'user@example.com');

    expect(mockSecurityLogger.loginFailure).toHaveBeenCalledWith(
      request,
      'user@example.com',
      'Attempt 2/5',
    );
  });

  it('should return remaining = 1 at 4 attempts', async () => {
    mockRedis.incr.mockResolvedValue(4);

    const request = createMockRequest({ ip: '192.168.1.1' });
    const result = await handleFailedLogin(request, 'user@example.com');

    expect(result.remaining).toBe(1);
    expect(result.locked).toBe(false);
  });
});

// ============================================
// handleSuccessfulLogin
// ============================================

describe('[P0][safety] handleSuccessfulLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear failed attempts from Redis', async () => {
    const request = createMockRequest({ ip: '192.168.1.1' });

    await handleSuccessfulLogin(request, 'user@example.com', 'user-id-123');

    expect(mockRedis.del).toHaveBeenCalledWith('bf:192.168.1.1:user@example.com');
  });

  it('should log successful login', async () => {
    const request = createMockRequest({ ip: '192.168.1.1' });

    await handleSuccessfulLogin(request, 'user@example.com', 'user-id-456');

    expect(mockSecurityLogger.loginSuccess).toHaveBeenCalledWith(
      request,
      'user-id-456',
    );
  });

  it('should use request.ip for clearing the correct key', async () => {
    const request = createMockRequest({ ip: '10.0.0.99' });

    await handleSuccessfulLogin(request, 'admin@bellor.app', 'admin-id');

    expect(mockRedis.del).toHaveBeenCalledWith('bf:10.0.0.99:admin@bellor.app');
  });
});

// ============================================
// IP-based tracking isolation
// ============================================

describe('[P0][safety] IP-based tracking isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should track different IPs independently', async () => {
    mockRedis.incr.mockResolvedValue(1);

    await recordFailedAttempt('10.0.0.1', 'user@example.com');
    await recordFailedAttempt('10.0.0.2', 'user@example.com');

    expect(mockRedis.incr).toHaveBeenCalledWith('bf:10.0.0.1:user@example.com');
    expect(mockRedis.incr).toHaveBeenCalledWith('bf:10.0.0.2:user@example.com');
    // Different keys, so they are tracked independently
  });

  it('should track different emails from same IP independently', async () => {
    mockRedis.incr.mockResolvedValue(1);

    await recordFailedAttempt('192.168.1.1', 'alice@example.com');
    await recordFailedAttempt('192.168.1.1', 'bob@example.com');

    expect(mockRedis.incr).toHaveBeenCalledWith('bf:192.168.1.1:alice@example.com');
    expect(mockRedis.incr).toHaveBeenCalledWith('bf:192.168.1.1:bob@example.com');
  });

  it('should lock out specific IP+email combination without affecting others', async () => {
    // First call: locked IP+email
    mockRedis.get.mockResolvedValueOnce('5');
    const lockedResult = await isLockedOut('10.0.0.1', 'hacker@evil.com');
    expect(lockedResult).toBe(true);

    // Second call: different IP, same email
    mockRedis.get.mockResolvedValueOnce(null);
    const otherIpResult = await isLockedOut('10.0.0.2', 'hacker@evil.com');
    expect(otherIpResult).toBe(false);

    // Third call: same IP, different email
    mockRedis.get.mockResolvedValueOnce('1');
    const otherEmailResult = await isLockedOut('10.0.0.1', 'legit@user.com');
    expect(otherEmailResult).toBe(false);
  });
});

// ============================================
// Lockout timeout (TTL-based expiry)
// ============================================

describe('[P0][safety] lockout timeout behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set TTL of 900 seconds (15 min) on first attempt', async () => {
    mockRedis.incr.mockResolvedValue(1);

    await recordFailedAttempt('192.168.1.1', 'user@example.com');

    expect(mockRedis.expire).toHaveBeenCalledWith(
      'bf:192.168.1.1:user@example.com',
      900,
    );
  });

  it('should not reset TTL on subsequent attempts', async () => {
    mockRedis.incr.mockResolvedValue(2);

    await recordFailedAttempt('192.168.1.1', 'user@example.com');

    expect(mockRedis.expire).not.toHaveBeenCalled();
  });

  it('should indicate unlocked when key has expired (null)', async () => {
    // After TTL expires, Redis returns null
    mockRedis.get.mockResolvedValue(null);

    const locked = await isLockedOut('192.168.1.1', 'user@example.com');

    expect(locked).toBe(false);
  });

  it('should return full attempts after lockout expires', async () => {
    // After TTL expires, Redis returns null
    mockRedis.get.mockResolvedValue(null);

    const remaining = await getRemainingAttempts('192.168.1.1', 'user@example.com');

    expect(remaining).toBe(5);
  });
});

// ============================================
// Full flow simulation
// ============================================

describe('[P0][safety] full login flow simulation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should track progressive failed attempts then allow reset on success', async () => {
    const request = createMockRequest({ ip: '192.168.1.1' });
    const email = 'user@example.com';

    // Attempt 1
    mockRedis.incr.mockResolvedValue(1);
    const r1 = await handleFailedLogin(request, email);
    expect(r1.attempts).toBe(1);
    expect(r1.remaining).toBe(4);
    expect(r1.locked).toBe(false);

    // Attempt 2
    mockRedis.incr.mockResolvedValue(2);
    const r2 = await handleFailedLogin(request, email);
    expect(r2.attempts).toBe(2);
    expect(r2.remaining).toBe(3);

    // Attempt 5 - lockout
    mockRedis.incr.mockResolvedValue(5);
    const r5 = await handleFailedLogin(request, email);
    expect(r5.locked).toBe(true);
    expect(r5.remaining).toBe(0);

    // Successful login clears tracking
    await handleSuccessfulLogin(request, email, 'user-id');
    expect(mockRedis.del).toHaveBeenCalledWith('bf:192.168.1.1:user@example.com');
  });
});
