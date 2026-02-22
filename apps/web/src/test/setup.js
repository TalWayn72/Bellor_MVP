/**
 * Vitest Test Setup
 * Global configuration for all tests
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

// Clean up DOM after each test to prevent state contamination.
// Force GC after each TEST (cleans up React fiber trees between tests)
// and after each FILE (cleans up module-level objects between files in the same fork).
// global.gc() works in pool:'forks' child processes (inherits --expose-gc from NODE_OPTIONS).
afterEach(() => {
  cleanup();
  if (typeof global.gc === 'function') global.gc();
});

// Force a full GC after all tests in a file complete, BEFORE the next file loads
// in the same fork process. This prevents cross-file memory accumulation.
afterAll(() => {
  if (typeof global.gc === 'function') global.gc();
});

// Extend expect with axe matchers
expect.extend(toHaveNoViolations);

// Mock window.matchMedia for components that use media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});
