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
    // server.deps.external: Prevents Vite from transforming lucide-react (41MB → ~3GB V8)
    // even when it is transitively imported. vi.mock('lucide-react') still intercepts
    // the import at runtime. Without this, EditProfile.test.jsx OOMs even with 8GB heap.
    server: {
      deps: {
        external: [/lucide-react/],
      },
    },
    // pool:'forks': each shard runs in a child process with NODE_OPTIONS heap limit.
    // 44 shards (max 2 files/shard) + maxForks=1 (sequential) prevents accumulation.
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
      // Redirect lucide-react to a tiny stub at the Vite resolve level.
      // This prevents Vite from ever finding/transforming the real 41MB package.
      // The stub exports a Proxy where every icon is () => null.
      'lucide-react': path.resolve(__dirname, './src/test/lucide-react-stub.js'),
    },
  },
});
