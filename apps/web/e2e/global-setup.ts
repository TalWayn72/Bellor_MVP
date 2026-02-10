/**
 * Global setup for full-stack E2E tests
 *
 * Runs before all tests:
 * 1. Verifies Docker services are running
 * 2. Seeds the database with demo data
 * 3. Creates authenticated storage states for test users
 */
import { chromium, FullConfig } from '@playwright/test';
import { resolve } from 'path';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000';
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const AUTH_DIR = resolve(__dirname, '../playwright/.auth');

async function globalSetup(_config: FullConfig) {
  console.log('\n🔧 Full-stack E2E: Global Setup Starting...\n');

  // Step 1: Verify API is running
  console.log('Step 1: Checking API health...');
  const apiHealthy = await checkApiHealth();
  if (!apiHealthy) {
    throw new Error(
      'API server is not running at ' + API_BASE +
      '\nRun: npm run dev:api (and ensure Docker is up: npm run docker:up)',
    );
  }
  console.log('  ✓ API is healthy\n');

  // Step 2: Create authenticated storage states
  console.log('Step 2: Creating authenticated sessions...');
  const browser = await chromium.launch();

  try {
    // Login as regular demo user
    await createAuthState(browser, {
      email: 'demo_sarah@bellor.app',
      password: 'Demo123!',
      storageStatePath: resolve(AUTH_DIR, 'user.json'),
      label: 'demo user (Sarah)',
    });

    // Login as second demo user (for two-user chat tests)
    await createAuthState(browser, {
      email: 'demo_david@bellor.app',
      password: 'Demo123!',
      storageStatePath: resolve(AUTH_DIR, 'user2.json'),
      label: 'demo user (David)',
    });

    // Login as admin
    await createAuthState(browser, {
      email: 'admin@bellor.app',
      password: 'Demo123!',
      storageStatePath: resolve(AUTH_DIR, 'admin.json'),
      label: 'admin',
    });
  } finally {
    await browser.close();
  }

  console.log('\n✅ Global Setup Complete!\n');
}

async function checkApiHealth(): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (response.ok) return true;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

async function createAuthState(
  browser: import('@playwright/test').Browser,
  options: {
    email: string;
    password: string;
    storageStatePath: string;
    label: string;
  },
): Promise<void> {
  const { email, password, storageStatePath, label } = options;
  console.log(`  Creating auth state for ${label}...`);

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login
    await page.goto(`${BASE_URL}/Login`);
    await page.waitForLoadState('networkidle');

    // Fill login form (supports Hebrew/English labels)
    const emailInput = page.locator(
      'input[type="email"], input[placeholder*="email" i], input[placeholder*="אימייל" i]',
    ).first();
    const passwordInput = page.locator(
      'input[type="password"], input[placeholder*="password" i], input[placeholder*="סיסמ" i]',
    ).first();

    await emailInput.fill(email);
    await passwordInput.fill(password);

    // Submit
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("login"), button:has-text("התחבר"), button:has-text("כניסה")',
    ).first();
    await submitButton.click();

    // Wait for redirect to authenticated area
    await page.waitForURL(/\/(Home|SharedSpace|Feed)/, { timeout: 15000 });

    // Ensure auth dir exists
    const fs = await import('fs');
    fs.mkdirSync(resolve(storageStatePath, '..'), { recursive: true });

    // Save storage state
    await context.storageState({ path: storageStatePath });
    console.log(`  ✓ Saved auth state for ${label}`);
  } catch (error) {
    console.error(`  ✗ Failed to create auth state for ${label}:`, error);
    throw error;
  } finally {
    await context.close();
  }
}

export default globalSetup;
