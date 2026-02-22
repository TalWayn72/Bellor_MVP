import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const isCI = !!process.env.CI;

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    exclude: [
      'src/test/tiers/**',
      // a11y tests (axe-core ~3GB each) run in a dedicated CI job — always excluded from shards
      'src/test/a11y/**',
    ],
    // In CI: pool:'forks' gives each test file its own child process.
    // Child processes inherit --expose-gc (unlike Worker threads), so global.gc()
    // in setup.js actually works. Also prevents cross-file memory accumulation.
    pool: isCI ? 'forks' : 'threads',
    poolOptions: {
      forks: {
        // Allow VITEST_MAX_FORKS env var to override (used by a11y job to run sequentially)
        maxForks: process.env.VITEST_MAX_FORKS ? parseInt(process.env.VITEST_MAX_FORKS) : 2,
        minForks: 1,
      },
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },
    testTimeout: isCI ? 30000 : 60000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/**/*.test.{js,jsx,ts,tsx}',
        'src/**/*.d.ts',
        'src/test/**',
        'src/components/ui/**',
      ],
      thresholds: {
        lines: 45,
        functions: 45,
        branches: 40,
        statements: 45,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
