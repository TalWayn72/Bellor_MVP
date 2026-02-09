/**
 * Vitest Configuration for Migration Tests
 * Separate config for migration tests that use real database
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/test/migration/**/*.test.ts'],
    setupFiles: ['./src/test/migration/setup.migration.ts'],
    testTimeout: 60000, // 60 seconds for database operations
    hookTimeout: 60000,
    pool: 'forks', // Run tests in separate processes
    poolOptions: {
      forks: {
        singleFork: false, // Allow parallel execution
      },
    },
  },
});
