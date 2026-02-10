/**
 * Auth state creation helper for E2E global setup
 * Creates storageState files by calling the login API directly,
 * then injecting tokens into a browser context's localStorage.
 */
import { chromium } from '@playwright/test';
import { resolve } from 'path';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000';
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

interface AuthStateOptions {
  email: string;
  password: string;
  storageStatePath: string;
  label: string;
}

export async function createAuthStateViaAPI(options: AuthStateOptions): Promise<void> {
  const { email, password, storageStatePath, label } = options;
  console.log(`  Creating auth state for ${label}...`);

  // Step A: Login via API to get real tokens
  const loginResponse = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!loginResponse.ok) {
    const errorText = await loginResponse.text();
    throw new Error(`API login failed for ${label}: ${loginResponse.status} - ${errorText}`);
  }

  const loginJson = await loginResponse.json();
  const loginData = loginJson.data || loginJson;

  const { accessToken, refreshToken, user } = loginData;
  if (!accessToken || accessToken === 'undefined') {
    throw new Error(`No access token returned for ${label}. Response: ${JSON.stringify(loginJson)}`);
  }

  // Step B: Create a browser context and inject tokens into localStorage
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: 'commit' });

    await page.evaluate(
      ({ accessToken: at, refreshToken: rt, user: u }) => {
        localStorage.setItem('bellor_access_token', at);
        localStorage.setItem('bellor_refresh_token', rt);
        localStorage.setItem('bellor_user', JSON.stringify(u));
        localStorage.setItem(`tutorial_seen_${u.id}`, 'true');
      },
      { accessToken, refreshToken, user },
    );

    const storedToken = await page.evaluate(() =>
      localStorage.getItem('bellor_access_token'),
    );

    if (!storedToken || storedToken === 'undefined') {
      throw new Error(`Failed to store tokens in localStorage for ${label}`);
    }

    const fs = await import('fs');
    fs.mkdirSync(resolve(storageStatePath, '..'), { recursive: true });
    await context.storageState({ path: storageStatePath });

    console.log(`  ✓ Saved auth state for ${label} (token: ${storedToken.substring(0, 20)}...)`);
  } finally {
    await context.close();
    await browser.close();
  }
}
