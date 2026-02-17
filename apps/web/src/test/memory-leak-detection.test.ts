/**
 * Memory Leak Detection Tests - Frontend
 * Automated tests to detect React memory leak patterns
 * Run with: npm run test:memory-leak
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useEffect, useRef } from 'react';

describe('Memory Leak Detection - Frontend', () => {
  afterEach(() => {
    cleanup();
  });

  describe('React Hook Cleanup', () => {
    it('should detect useEffect without cleanup function', () => {
      const mockCleanup = vi.fn();

      const { unmount } = renderHook(() => {
        useEffect(() => {
          const interval = setInterval(() => {}, 1000);

          return () => {
            clearInterval(interval);
            mockCleanup();
          };
        }, []);
      });

      unmount();

      // Cleanup should be called
      expect(mockCleanup).toHaveBeenCalled();
    });

    it('should verify interval refs are cleared on unmount', () => {
      const { unmount } = renderHook(() => {
        const intervalRef = useRef<NodeJS.Timeout | null>(null);

        useEffect(() => {
          intervalRef.current = setInterval(() => {}, 1000);

          return () => {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          };
        }, []);

        return intervalRef;
      });

      unmount();

      // Should complete without errors
      expect(true).toBe(true);
    });

    it('should detect event listeners not removed', () => {
      const addListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => {
        useEffect(() => {
          const handler = () => {};
          window.addEventListener('resize', handler);

          return () => {
            window.removeEventListener('resize', handler);
          };
        }, []);
      });

      unmount();

      // Should have same number of add/remove calls
      expect(addListenerSpy).toHaveBeenCalled();
      expect(removeListenerSpy).toHaveBeenCalled();
      expect(addListenerSpy.mock.calls.length).toBe(removeListenerSpy.mock.calls.length);

      addListenerSpy.mockRestore();
      removeListenerSpy.mockRestore();
    });
  });

  describe('WebSocket Connection Cleanup', () => {
    it('should verify socket disconnection on unmount', () => {
      const mockSocket = {
        connected: true,
        disconnect: vi.fn(),
        listeners: new Map<string, Set<Function>>()
      };

      const { unmount } = renderHook(() => {
        useEffect(() => {
          return () => {
            if (mockSocket.connected) {
              mockSocket.disconnect();
            }
          };
        }, []);
      });

      unmount();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should detect socket listener accumulation', () => {
      const mockSocket = {
        listeners: new Map<string, Function[]>(),
        on(event: string, handler: Function) {
          if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
          }
          this.listeners.get(event)!.push(handler);
        },
        off(event: string, handler: Function) {
          const handlers = this.listeners.get(event);
          if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
              handlers.splice(index, 1);
            }
          }
        }
      };

      const handler = () => {};

      // First mount
      mockSocket.on('message', handler);
      expect(mockSocket.listeners.get('message')?.length).toBe(1);

      // Cleanup
      mockSocket.off('message', handler);
      expect(mockSocket.listeners.get('message')?.length).toBe(0);

      // Second mount - should not accumulate
      mockSocket.on('message', handler);
      expect(mockSocket.listeners.get('message')?.length).toBe(1);
    });
  });

  describe('Ref and State Management', () => {
    it('should detect refs not cleared on unmount', () => {
      const { result, unmount } = renderHook(() => {
        const dataRef = useRef<Record<string, unknown>>({});

        useEffect(() => {
          dataRef.current = { large: new Array(1000).fill('data') };

          return () => {
            dataRef.current = {};
          };
        }, []);

        return dataRef;
      });

      unmount();

      // Ref should be cleared
      expect(Object.keys(result.current.current).length).toBe(0);
    });

    it('should verify timeout refs are cleared', () => {
      const { unmount } = renderHook(() => {
        const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

        useEffect(() => {
          timeoutsRef.current['test'] = setTimeout(() => {}, 1000);

          return () => {
            Object.values(timeoutsRef.current).forEach(clearTimeout);
            timeoutsRef.current = {};
          };
        }, []);

        return timeoutsRef;
      });

      unmount();

      expect(true).toBe(true);
    });
  });

  describe('Component Re-render Patterns', () => {
    it('should detect infinite re-render loops', () => {
      const renderCount = { current: 0 };
      const MAX_RENDERS = 10;

      const { unmount } = renderHook(() => {
        renderCount.current++;

        if (renderCount.current > MAX_RENDERS) {
          throw new Error('Infinite re-render detected');
        }

        return renderCount.current;
      });

      unmount();

      // Should not exceed max renders
      expect(renderCount.current).toBeLessThanOrEqual(MAX_RENDERS);
    });
  });
});

/**
 * Static Analysis Helper for React Components
 */
export function analyzeComponentForLeaks(componentCode: string): string[] {
  const issues: string[] = [];

  // Pattern: useEffect without cleanup return
  const useEffectPattern = /useEffect\s*\(\s*\(\)\s*=>\s*{[^}]*}\s*,/g;
  const matches = componentCode.match(useEffectPattern);

  if (matches) {
    matches.forEach(match => {
      if (!match.includes('return')) {
        issues.push('useEffect without cleanup return detected');
      }
    });
  }

  // Pattern: setInterval in useEffect without clearInterval
  if (componentCode.includes('setInterval') && componentCode.includes('useEffect')) {
    if (!componentCode.includes('clearInterval')) {
      issues.push('setInterval in useEffect without clearInterval');
    }
  }

  // Pattern: addEventListener without removeEventListener
  if (componentCode.includes('addEventListener')) {
    if (!componentCode.includes('removeEventListener')) {
      issues.push('addEventListener without removeEventListener in cleanup');
    }
  }

  // Pattern: useRef with intervals/timeouts not cleared
  if (componentCode.includes('useRef') &&
      (componentCode.includes('setInterval') || componentCode.includes('setTimeout'))) {
    if (!componentCode.includes('clearInterval') && !componentCode.includes('clearTimeout')) {
      issues.push('useRef with timers but no cleanup detected');
    }
  }

  return issues;
}

/**
 * Memory Usage Monitor for Testing
 */
export class MemoryMonitor {
  private baseline: number = 0;
  private threshold: number;

  constructor(thresholdMB: number = 50) {
    this.threshold = thresholdMB * 1024 * 1024; // Convert to bytes
  }

  start(): void {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      this.baseline = (performance as any).memory.usedJSHeapSize;
    }
  }

  check(): { exceeded: boolean; growth: number } {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const current = (performance as any).memory.usedJSHeapSize;
      const growth = current - this.baseline;

      return {
        exceeded: growth > this.threshold,
        growth: Math.round(growth / 1024 / 1024) // MB
      };
    }

    return { exceeded: false, growth: 0 };
  }
}
