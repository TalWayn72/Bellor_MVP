/**
 * Database helpers for full-stack E2E tests
 * Manages test data seeding, cleanup, and credential access
 */
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000';
const API_ROOT = resolve(__dirname, '../../../../api');

/** Seeded demo user credentials */
export const SEEDED_USERS = {
  admin: { email: 'admin@bellor.app', password: 'Demo123!' },
  sarah: { email: 'demo_sarah@bellor.app', password: 'Demo123!' },
  david: { email: 'demo_david@bellor.app', password: 'Demo123!' },
  maya: { email: 'demo_maya@bellor.app', password: 'Demo123!' },
  noam: { email: 'demo_noam@bellor.app', password: 'Demo123!' },
  shira: { email: 'demo_shira@bellor.app', password: 'Demo123!' },
  michael: { email: 'demo_michael@bellor.app', password: 'Demo123!' },
} as const;

/** Get credentials for a seeded demo user */
export function getSeededUserCredentials(name: keyof typeof SEEDED_USERS) {
  return SEEDED_USERS[name];
}

/** Run prisma db seed to populate baseline data */
export function seedTestDatabase(): void {
  try {
    execSync('npx prisma db seed', {
      cwd: API_ROOT,
      stdio: 'pipe',
      timeout: 60000,
    });
  } catch (error) {
    console.error('Failed to seed database:', error);
    throw error;
  }
}

/** Check if the API server is running */
export async function isApiHealthy(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/** Create a new test user via the real registration API */
export async function createTestUserViaAPI(data: {
  email: string;
  password: string;
  nickname: string;
  birthDate: string;
}) {
  const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Registration failed: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json();
}

/** Login via API and get tokens */
export async function loginViaAPI(email: string, password: string) {
  const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  return response.json();
}

/** Cleanup test-created users (emails matching e2e-* pattern) */
export async function cleanupTestUsers(adminToken: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/v1/admin/cleanup-test-users`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ emailPattern: 'e2e-' }),
    });
  } catch {
    // Cleanup is best-effort - don't fail tests if cleanup fails
    console.warn('Test user cleanup failed (non-critical)');
  }
}

/** Generate a unique test email */
export function generateTestEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@bellor.app`;
}
