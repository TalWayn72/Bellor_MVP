/**
 * Vitest Test Setup
 * Global configuration for all tests
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

// ─────────────────────────────────────────────────────────────────────────────
// Global OOM prevention mocks (applied before EVERY test file via setupFiles)
//
// lucide-react: 41MB on disk; Vite's Babel pipeline expands it to ~2-3GB in
// memory per fork because it processes every icon SVG. Mocking it globally
// prevents the library from being loaded at all.
//
// @/components/states: imports LoadingState → lucide-react (transitive OOM).
// Mocked globally so test files don't need to know about this transitive dep.
//
// Both mocks use a Proxy so they handle ALL named exports automatically —
// any icon/component gets a no-op () => null React component.
// Per-file vi.mock() calls override these global defaults when needed.
// ─────────────────────────────────────────────────────────────────────────────
// Inline factories: vi.mock() is hoisted above const declarations, so
// factory logic must live inside the factory function (no outer variables).
vi.mock('lucide-react', () => {
  const c = () => null;
  return new Proxy({ __esModule: true, default: c }, { get: (t, k) => (k in t ? t[k] : c) });
});
vi.mock('@/components/states', () => {
  const c = () => null;
  return new Proxy({ __esModule: true, default: c }, { get: (t, k) => (k in t ? t[k] : c) });
});

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
