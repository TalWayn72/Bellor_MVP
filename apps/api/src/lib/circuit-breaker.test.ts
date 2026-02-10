/**
 * Tests for CircuitBreaker pattern implementation
 * Validates state transitions: CLOSED -> OPEN -> HALF_OPEN -> CLOSED
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { CircuitBreaker, CircuitState } from './circuit-breaker.js';
import type { CircuitBreakerOptions } from './circuit-breaker.js';

const createBreaker = (overrides: Partial<CircuitBreakerOptions> = {}): CircuitBreaker => {
  return new CircuitBreaker({
    name: 'test-breaker',
    timeout: 5000,
    errorThreshold: 3,
    resetTimeout: 1000,
    ...overrides,
  });
};

describe('[P2][infra] CircuitBreaker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should start in CLOSED state', () => {
      const breaker = createBreaker();
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('CLOSED state', () => {
    it('should execute function successfully', async () => {
      const breaker = createBreaker();
      const result = await breaker.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');
    });

    it('should remain CLOSED after successful execution', async () => {
      const breaker = createBreaker();
      await breaker.execute(() => Promise.resolve('ok'));
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should return the correct result from the wrapped function', async () => {
      const breaker = createBreaker();
      const data = { id: 1, name: 'test' };
      const result = await breaker.execute(() => Promise.resolve(data));
      expect(result).toEqual(data);
    });

    it('should propagate errors from the wrapped function', async () => {
      const breaker = createBreaker();
      await expect(
        breaker.execute(() => Promise.reject(new Error('service error')))
      ).rejects.toThrow('service error');
    });

    it('should remain CLOSED after failures below threshold', async () => {
      const breaker = createBreaker({ errorThreshold: 3 });

      // 2 failures (below threshold of 3)
      for (let i = 0; i < 2; i++) {
        await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
      }

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('transition to OPEN', () => {
    it('should open after reaching error threshold', async () => {
      const breaker = createBreaker({ errorThreshold: 3 });

      for (let i = 0; i < 3; i++) {
        await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should open after exceeding error threshold', async () => {
      const breaker = createBreaker({ errorThreshold: 2 });

      for (let i = 0; i < 2; i++) {
        await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should reset failure count after a success', async () => {
      const breaker = createBreaker({ errorThreshold: 3 });

      // 2 failures
      await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
      await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});

      // 1 success resets count
      await breaker.execute(() => Promise.resolve('ok'));

      // 2 more failures should not open (count was reset)
      await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
      await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('OPEN state', () => {
    it('should throw immediately without executing the function', async () => {
      const breaker = createBreaker({ errorThreshold: 1 });

      // Trip the breaker
      await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Should reject without calling fn
      const fn = vi.fn(() => Promise.resolve('result'));
      await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker test-breaker is OPEN');
      expect(fn).not.toHaveBeenCalled();
    });

    it('should include breaker name in error message', async () => {
      const breaker = createBreaker({ name: 'redis-service', errorThreshold: 1 });

      await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});

      await expect(
        breaker.execute(() => Promise.resolve('ok'))
      ).rejects.toThrow('Circuit breaker redis-service is OPEN');
    });
  });

  describe('transition to HALF_OPEN', () => {
    it('should transition to HALF_OPEN after resetTimeout', async () => {
      vi.useFakeTimers();
      const breaker = createBreaker({ errorThreshold: 1, resetTimeout: 1000 });

      // Trip the breaker
      await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Advance time past resetTimeout
      vi.advanceTimersByTime(1001);

      // Next execute should transition to HALF_OPEN and attempt the call
      await breaker.execute(() => Promise.resolve('recovered'));
      // After success in HALF_OPEN, it should transition to CLOSED
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      vi.useRealTimers();
    });

    it('should not transition before resetTimeout expires', async () => {
      vi.useFakeTimers();
      const breaker = createBreaker({ errorThreshold: 1, resetTimeout: 5000 });

      await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Only advance 2 seconds (less than 5 second resetTimeout)
      vi.advanceTimersByTime(2000);

      await expect(
        breaker.execute(() => Promise.resolve('ok'))
      ).rejects.toThrow('Circuit breaker test-breaker is OPEN');

      vi.useRealTimers();
    });
  });

  describe('HALF_OPEN state', () => {
    it('should transition to CLOSED on success', async () => {
      vi.useFakeTimers();
      const breaker = createBreaker({ errorThreshold: 1, resetTimeout: 500 });

      // Trip the breaker
      await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Wait for resetTimeout
      vi.advanceTimersByTime(501);

      // Successful call in HALF_OPEN should close the circuit
      const result = await breaker.execute(() => Promise.resolve('back online'));
      expect(result).toBe('back online');
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      vi.useRealTimers();
    });

    it('should transition back to OPEN on failure', async () => {
      vi.useFakeTimers();
      const breaker = createBreaker({ errorThreshold: 1, resetTimeout: 500 });

      // Trip the breaker
      await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Wait for resetTimeout
      vi.advanceTimersByTime(501);

      // Failing call in HALF_OPEN should re-open the circuit
      await breaker.execute(() => Promise.reject(new Error('still failing'))).catch(() => {});
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      vi.useRealTimers();
    });
  });

  describe('timeout handling', () => {
    it('should fail if function exceeds timeout', async () => {
      vi.useFakeTimers();
      const breaker = createBreaker({ timeout: 100 });

      const slowFn = () => new Promise<string>((resolve) => {
        setTimeout(() => resolve('too slow'), 5000);
      });

      const executePromise = breaker.execute(slowFn);

      // Advance past the timeout
      vi.advanceTimersByTime(101);

      await expect(executePromise).rejects.toThrow('Circuit breaker timeout');

      vi.useRealTimers();
    });

    it('should count timeout as a failure', async () => {
      vi.useFakeTimers();
      const breaker = createBreaker({ timeout: 100, errorThreshold: 1 });

      const slowFn = () => new Promise<string>((resolve) => {
        setTimeout(() => resolve('slow'), 5000);
      });

      const executePromise = breaker.execute(slowFn);
      vi.advanceTimersByTime(101);

      await executePromise.catch(() => {});
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      vi.useRealTimers();
    });
  });

  describe('CircuitState enum', () => {
    it('should have CLOSED state', () => {
      expect(CircuitState.CLOSED).toBe('CLOSED');
    });

    it('should have OPEN state', () => {
      expect(CircuitState.OPEN).toBe('OPEN');
    });

    it('should have HALF_OPEN state', () => {
      expect(CircuitState.HALF_OPEN).toBe('HALF_OPEN');
    });
  });
});
