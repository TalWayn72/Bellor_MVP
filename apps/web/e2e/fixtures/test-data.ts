/**
 * E2E Test Data Constants
 * Static test user data and configuration
 */

export const testUser = {
  email: 'e2e-test@bellor.app',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  birthDate: '1990-01-15',
};

export const newTestUser = {
  email: `e2e-${Date.now()}@bellor.app`,
  password: 'NewTestPass123!',
  firstName: 'New',
  lastName: 'Tester',
  birthDate: '1995-05-20',
};

export const STORAGE_STATE_PATH = 'playwright/.auth/user.json';
