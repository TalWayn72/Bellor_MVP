/**
 * Global teardown for full-stack E2E tests
 *
 * Runs after all tests:
 * 1. Cleans up test-created users
 * 2. Logs test session summary
 */
import { FullConfig } from '@playwright/test';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000';

async function globalTeardown(_config: FullConfig) {
  console.log('\n🧹 Full-stack E2E: Global Teardown Starting...\n');

  // Cleanup is best-effort - don't fail if API is down
  try {
    // Login as admin to get token for cleanup
    const loginResponse = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@bellor.app',
        password: 'Demo123!',
      }),
    });

    if (loginResponse.ok) {
      const { accessToken } = await loginResponse.json();

      // Attempt to clean up test-created users
      await fetch(`${API_BASE}/api/v1/admin/cleanup-test-users`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ emailPattern: 'e2e-' }),
      });

      console.log('  ✓ Test user cleanup completed');
    }
  } catch {
    console.warn('  ⚠ Cleanup skipped (API unavailable)');
  }

  console.log('\n✅ Global Teardown Complete!\n');
}

export default globalTeardown;
