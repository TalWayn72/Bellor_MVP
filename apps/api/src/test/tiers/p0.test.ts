/**
 * P0 Critical Tests - Auth, Safety, Payments
 * Run with: npm run test:p0:api
 *
 * These tests cover revenue-critical, safety-critical,
 * and legally-required functionality.
 */

// Auth
import '../../services/auth-login.service.test.js';
import '../../services/auth-register.service.test.js';
import '../../services/auth-password.service.test.js';
import '../../services/auth-tokens.service.test.js';
import '../../services/google-oauth.service.test.js';
import '../../middleware/auth.middleware.test.js';
import '../../middleware/token-validation.test.js';

// Safety
import '../../security/auth-hardening.test.js';
import '../../security/csrf-protection.test.js';
import '../../security/input-sanitizer.test.js';
import '../../middleware/security.middleware.test.js';
import '../../services/reports.service.test.js';

// Payments
import '../../services/subscriptions.service.test.js';

// Critical profile (GDPR deletion)
import '../../services/users-delete.service.test.js';
