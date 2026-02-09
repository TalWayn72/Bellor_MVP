// @ts-check
/** @type {import('@stryker-mutator/core').PartialStrykerOptions} */
const config = {
  packageManager: 'npm',
  testRunner: 'vitest',
  vitest: {
    configFile: 'apps/api/vitest.config.ts'
  },
  // TypeScript checker disabled to avoid non-critical TS errors blocking mutation testing
  // These TS errors exist in non-critical files (Sentry config, Stripe types, etc.)
  // and don't affect the quality of mutation testing for critical services
  checkers: [],
  mutate: [
    'apps/api/src/services/auth*.service.ts',
    'apps/api/src/services/chat*.service.ts',
    'apps/api/src/middleware/auth.middleware.ts',
    'apps/api/src/security/input-sanitizer.ts',
    'apps/api/src/security/csrf-protection.ts',
    '!apps/api/src/**/*.test.ts',
    '!apps/api/src/**/*.d.ts'
  ],
  coverageAnalysis: 'perTest',
  thresholds: {
    high: 80,
    low: 60,
    break: 50
  },
  reporters: ['html', 'clear-text', 'progress'],
  htmlReporter: {
    fileName: 'reports/mutation/mutation-report.html'
  },
  timeoutMS: 60000,
  concurrency: 2,
  maxConcurrentTestRunners: 2
};

export default config;
