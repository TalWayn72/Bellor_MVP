import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.d.ts',
        'src/app.ts',
        'src/test/**',
        // Infrastructure & real-time (require integration/E2E testing)
        'src/websocket/**',
        'src/jobs/**',
        'src/lib/prisma.ts',
        'src/lib/redis.ts',
        // External service integrations
        'src/routes/v1/oauth.routes.ts',
        'src/routes/v1/uploads.routes.ts',
        'src/services/google-auth.service.ts',
        'src/services/storage.service.ts',
        'src/services/analytics.service.ts',
        'src/services/health.service.ts',
        // Controllers are thin HTTP wrappers; business logic tested via services
        'src/controllers/**',
      ],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 70,
        statements: 75,
      },
    },
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
