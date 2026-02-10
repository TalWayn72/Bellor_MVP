/**
 * Test Lifecycle Hooks
 * Global setup/teardown for all backend tests
 */
import { beforeAll, afterAll, afterEach, vi } from 'vitest';

beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.resetAllMocks();
});
