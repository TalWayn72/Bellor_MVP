/**
 * P2 Supporting Tests - Profile, Admin, Infra
 * Run with: npx vitest run apps/api/src/test/tiers/p2.test.ts
 *
 * These tests cover supporting features and infrastructure.
 */

// Profile
import '../../services/users-profile.service.test.js';
import '../../services/users-data.service.test.js';
import '../../services/users-getby.service.test.js';
import '../../services/users-list.service.test.js';
import '../../services/users-search.service.test.js';
import '../../services/users-language.service.test.js';

// Social (supporting)
import '../../services/achievements.service.test.js';

// Infra
import '../../services/storage.service.test.js';
import '../../lib/app-error.test.js';
import '../../lib/cache.test.js';
import '../../lib/circuit-breaker.test.js';
import '../../lib/email.test.js';
import '../../lib/logger.test.js';
import '../../lib/memory-monitor.test.js';
import '../../lib/metrics.test.js';
import '../../config/rate-limits.test.js';
import '../../config/sentry.config.test.js';
import '../../utils/demoId.util.test.js';
