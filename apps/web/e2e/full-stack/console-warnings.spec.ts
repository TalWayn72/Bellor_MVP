/**
 * Full-Stack E2E: Console Warning Detection
 * Comprehensive scan of ALL routes for React warnings, prop leaks, and auth race conditions.
 */
import { test } from './fullstack-base.js';
import {
  FULLSTACK_AUTH,
  assertPageHealthy,
  collectConsoleMessages,
  waitForPageLoad,
} from '../fixtures/index.js';

// ── Route lists ──────────────────────────────────────────────────────
const AUTHENTICATED_ROUTES = [
  '/SharedSpace', '/Profile', '/EditProfile', '/Settings',
  '/Notifications', '/TemporaryChats', '/Discover', '/Matches',
  '/Stories', '/CreateStory', '/Premium', '/ProfileBoost',
  '/ReferralProgram', '/SafetyCenter', '/UserVerification',
  '/Achievements', '/Analytics', '/Feedback', '/EmailSupport',
  '/FAQ', '/FilterSettings', '/NotificationSettings',
  '/PrivacySettings', '/ThemeSettings', '/BlockedUsers',
  '/FollowingList', '/HelpSupport', '/Home', '/Creation',
  '/WriteTask', '/AudioTask', '/VideoTask', '/DateIdeas',
  '/VirtualEvents', '/CompatibilityQuiz', '/IceBreakers',
];

const ADMIN_ROUTES = [
  '/AdminDashboard', '/AdminUserManagement', '/AdminReportManagement',
  '/AdminChatMonitoring', '/AdminActivityMonitoring',
  '/AdminPreRegistration', '/AdminSystemSettings',
];

const PUBLIC_ROUTES = [
  '/Welcome', '/Login', '/Splash', '/Onboarding',
  '/TermsOfService', '/PrivacyPolicy',
];

// ── Authenticated route scan ─────────────────────────────────────────
test.describe('[P1][infra] Console Warning Detection - Authenticated Routes', () => {
  test.use({ storageState: FULLSTACK_AUTH.user });

  test('should have clean console on all authenticated routes', async ({ page }) => {
    for (const route of AUTHENTICATED_ROUTES) {
      await assertPageHealthy(page, route, { settleMs: 2000 });
    }
  });

  test('should have clean console during page transitions', async ({ page }) => {
    const cc = collectConsoleMessages(page);
    const transitionRoutes = ['/SharedSpace', '/Profile', '/Settings', '/Notifications', '/TemporaryChats'];

    for (const route of transitionRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page);
    }
    await page.waitForTimeout(2000);
    cc.assertClean();
  });
});

// ── Admin route scan ─────────────────────────────────────────────────
test.describe('[P1][infra] Console Warning Detection - Admin Routes', () => {
  test.use({ storageState: FULLSTACK_AUTH.admin });

  test('should have clean console on all admin routes', async ({ page }) => {
    for (const route of ADMIN_ROUTES) {
      await assertPageHealthy(page, route, { settleMs: 2000 });
    }
  });
});

// ── Public route scan ────────────────────────────────────────────────
test.describe('[P1][infra] Console Warning Detection - Public Routes', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should have clean console on all public routes', async ({ page }) => {
    for (const route of PUBLIC_ROUTES) {
      await assertPageHealthy(page, route, { settleMs: 2000 });
    }
  });
});
