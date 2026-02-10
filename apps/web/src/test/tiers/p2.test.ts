/**
 * P2 Supporting Frontend Tests - Profile, Admin, Infra
 * Run with: npx vitest run apps/web/src/test/tiers/p2.test.ts
 */

// Profile pages
import '../../pages/Settings.test.jsx';
import '../../pages/EditProfile.test.jsx';
import '../../pages/UserProfile.test.jsx';
import '../../pages/Profile.test.jsx';
import '../../pages/FilterSettings.test.jsx';
import '../../pages/NotificationSettings.test.jsx';
import '../../pages/PrivacySettings.test.jsx';
import '../../pages/ThemeSettings.test.jsx';

// Admin pages
import '../../pages/Analytics.test.jsx';
import '../../pages/AdminDashboard.test.jsx';
import '../../pages/AdminUserManagement.test.jsx';
import '../../pages/AdminReportManagement.test.jsx';
import '../../pages/AdminActivityMonitoring.test.jsx';
import '../../pages/AdminChatMonitoring.test.jsx';
import '../../pages/AdminPreRegistration.test.jsx';
import '../../pages/AdminSystemSettings.test.jsx';

// Social (supporting)
import '../../pages/Achievements.test.jsx';
import '../../pages/ProfileBoost.test.jsx';

// Infrastructure
import '../../components/navigation/DrawerMenu.test.jsx';
import '../../api/services/userService.test.js';
import '../../utils/platform.test.ts';
import '../../utils/userTransformer.test.js';
import '../../config/sentry.test.ts';
import '../../data/demoData.test.js';
