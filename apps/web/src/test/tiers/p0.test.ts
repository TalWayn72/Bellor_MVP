/**
 * P0 Critical Frontend Tests - Auth, Safety, Payments
 * Run with: npm run test:p0:web
 */

// Auth pages
import '../../pages/Login.test.jsx';
import '../../pages/Onboarding.test.jsx';
import '../../pages/Splash.test.jsx';
import '../../pages/OAuthCallback.test.jsx';
import '../../pages/Welcome.test.jsx';

// Auth components & context
import '../../components/auth/ProtectedRoute.test.jsx';
import '../../components/providers/UserProvider.test.jsx';
import '../../lib/AuthContext.test.jsx';

// Safety pages
import '../../pages/SafetyCenter.test.jsx';
import '../../pages/BlockedUsers.test.jsx';
import '../../pages/UserVerification.test.jsx';

// Safety components & security
import '../../components/secure/SecureTextInput.test.tsx';
import '../../components/secure/SecureTextArea.test.tsx';
import '../../security/input-sanitizer.test.ts';
import '../../security/paste-guard.test.ts';
import '../../security/securityEventReporter.test.ts';
import '../../hooks/useSecureInput.test.ts';

// Payments
import '../../pages/Premium.test.jsx';

// Critical infrastructure
import '../../api/client/apiClient.test.ts';
import '../../api/utils/validation.test.js';
import '../../utils/authFieldValidator.test.js';
