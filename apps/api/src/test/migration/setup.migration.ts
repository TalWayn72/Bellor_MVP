/**
 * Migration Test Setup
 * Setup file specifically for migration tests (no mocks, real database)
 */
import { beforeAll } from 'vitest';

// Set test environment
process.env.NODE_ENV = 'test';

// Global test setup for migration tests
beforeAll(() => {
  // Ensure test environment
  process.env.NODE_ENV = 'test';
});
