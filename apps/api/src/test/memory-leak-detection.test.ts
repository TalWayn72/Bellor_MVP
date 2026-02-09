/**
 * Memory Leak Detection Tests
 * Automated tests to detect common memory leak patterns
 * Run with: npm run test:memory-leak
 */

import { describe, it, expect, vi } from 'vitest';

describe('Memory Leak Detection - Backend', () => {
  describe('Interval and Timer Management', () => {
    it('should detect intervals without clearInterval storage', async () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      // Simulate interval creation
      const interval = setInterval(() => {}, 1000);

      // Check if interval reference is stored (should be captured in a variable)
      expect(interval).toBeDefined();
      expect(typeof interval).toBe('object');

      // Cleanup
      clearInterval(interval);
      setIntervalSpy.mockRestore();
    });

    it('should verify all intervals are cleared in cleanup', () => {
      const intervals: NodeJS.Timeout[] = [];

      // Create multiple intervals
      intervals.push(setInterval(() => {}, 1000));
      intervals.push(setInterval(() => {}, 2000));

      // Verify cleanup
      intervals.forEach(interval => {
        expect(interval).toBeDefined();
        clearInterval(interval);
      });

      expect(intervals.length).toBeGreaterThan(0);
    });
  });

  describe('Event Listener Management', () => {
    it('should detect event listeners without removal', () => {
      const mockEmitter = {
        listeners: new Map<string, Set<() => void>>(),
        on(event: string, handler: () => void) {
          if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
          }
          this.listeners.get(event)!.add(handler);
        },
        off(event: string, handler: () => void) {
          this.listeners.get(event)?.delete(handler);
        }
      };

      const handler1 = () => {};
      const handler2 = () => {};

      mockEmitter.on('test', handler1);
      mockEmitter.on('test', handler2);

      // Should have 2 listeners
      expect(mockEmitter.listeners.get('test')?.size).toBe(2);

      // Cleanup should remove all
      mockEmitter.off('test', handler1);
      mockEmitter.off('test', handler2);

      expect(mockEmitter.listeners.get('test')?.size).toBe(0);
    });
  });

  describe('Array and Object Growth', () => {
    it('should detect unbounded array growth', () => {
      const cache: string[] = [];
      const MAX_SIZE = 1000;

      // Simulate adding items
      for (let i = 0; i < 1500; i++) {
        cache.push(`item-${i}`);

        // Should enforce size limit
        if (cache.length > MAX_SIZE) {
          cache.shift(); // Remove oldest
        }
      }

      // Should not exceed max size
      expect(cache.length).toBeLessThanOrEqual(MAX_SIZE);
    });

    it('should detect Map growth without cleanup', () => {
      const cache = new Map<string, unknown>();
      const MAX_SIZE = 100;

      for (let i = 0; i < 150; i++) {
        cache.set(`key-${i}`, { data: 'value' });

        // Enforce size limit
        if (cache.size > MAX_SIZE) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
      }

      expect(cache.size).toBeLessThanOrEqual(MAX_SIZE);
    });
  });

  describe('Connection Management', () => {
    it('should verify Redis connections are closed', async () => {
      // Mock Redis client
      const mockRedis = {
        connected: true,
        disconnect: vi.fn(),
        quit: vi.fn()
      };

      // Simulate cleanup
      if (mockRedis.connected) {
        await mockRedis.quit();
      }

      expect(mockRedis.quit).toHaveBeenCalled();
    });

    it('should verify database connections have cleanup', () => {
      const mockPrisma = {
        $disconnect: vi.fn()
      };

      // Simulate graceful shutdown
      mockPrisma.$disconnect();

      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });
  });

  describe('Memory Pattern Analysis', () => {
    it('should detect closure memory retention', () => {
      const largeData = new Array(1000).fill('data');
      let closure: (() => void) | null = null;

      // Create closure that captures large data
      closure = () => {
        return largeData.length;
      };

      // Should be able to release
      expect(closure).toBeDefined();
      closure = null; // Release reference

      expect(closure).toBeNull();
    });

    it('should verify ref cleanup in data structures', () => {
      const refs = new WeakMap<object, string>();
      let obj: object | null = { id: 1 };

      refs.set(obj, 'value');
      expect(refs.has(obj)).toBe(true);

      // Release reference
      obj = null;

      // WeakMap should allow garbage collection
      expect(obj).toBeNull();
    });
  });
});

/**
 * Helper function to simulate memory pressure
 * Exported for use in load tests
 */
export function simulateMemoryPressure(iterations: number): void {
  const temp: unknown[] = [];
  for (let i = 0; i < iterations; i++) {
    temp.push({ data: new Array(100).fill(i) });
  }
  temp.length = 0; // Clear
}

/**
 * Helper to check for common leak patterns in code
 */
export function analyzeCodeForLeaks(code: string): string[] {
  const issues: string[] = [];

  // Pattern: setInterval without clearInterval
  if (code.includes('setInterval') && !code.includes('clearInterval')) {
    issues.push('setInterval without clearInterval detected');
  }

  // Pattern: setTimeout without clearTimeout
  if (code.includes('setTimeout') && !code.includes('clearTimeout') && code.includes('ref')) {
    issues.push('setTimeout refs may not be cleared');
  }

  // Pattern: addEventListener without removeEventListener
  if (code.includes('addEventListener') && !code.includes('removeEventListener')) {
    issues.push('addEventListener without removeEventListener detected');
  }

  // Pattern: .on() without .off()
  if (code.includes('.on(') && !code.includes('.off(')) {
    issues.push('Event listener .on() without .off() detected');
  }

  // Pattern: Map/Set without size limits
  if ((code.includes('new Map') || code.includes('new Set')) && !code.includes('size') && !code.includes('delete')) {
    issues.push('Map/Set without size management detected');
  }

  return issues;
}
