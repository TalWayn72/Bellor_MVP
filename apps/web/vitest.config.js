import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const isCI = !!process.env.CI;
// Set by the test-web-a11y CI job to prevent a11y files from being excluded
const isA11yJob = !!process.env.VITEST_A11Y_ONLY;

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    exclude: [
      'src/test/tiers/**',
      // a11y tests (axe-core ~3GB each) run in a dedicated CI job.
      // Excluded from shard runs but NOT from the a11y job (controlled via VITEST_A11Y_ONLY).
      ...(isA11yJob ? [] : ['src/test/a11y/**']),
    ],
    // pool:'forks': each shard runs in a child process with NODE_OPTIONS heap limit.
    // 44 shards (max 2 files/shard) + maxForks=1 (sequential) prevents accumulation.
    // EditProfile.test.jsx alone needs ~5469MB (lucide-react transitive dep).
    // 6000MB heap: 5469MB EditProfile < 6000MB limit; 6000MB fork + 500MB main = 6.5GB (< 7GB).
    pool: isCI ? 'forks' : 'threads',
    poolOptions: {
      forks: {
        // maxForks=1: sequential execution prevents concurrent memory spikes.
        maxForks: process.env.VITEST_MAX_FORKS ? parseInt(process.env.VITEST_MAX_FORKS) : 1,
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
