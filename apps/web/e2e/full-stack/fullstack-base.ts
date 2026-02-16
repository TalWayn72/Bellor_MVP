/**
 * Base test fixture for full-stack E2E tests
 *
 * Three-layer token strategy:
 * 1. Server-side refresh: calls /auth/refresh before each test
 * 2. Server-side login fallback: if refresh fails (token revoked), re-login via API
 * 3. Browser-side: init script refreshes via XHR on every page.goto()
 */
import { test as base, expect, BrowserContext } from '@playwright/test';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000';

/** Cached tokens from login fallback (avoids repeated logins / rate limits) */
const loginCache: Record<string, { accessToken: string; refreshToken: string; ts: number }> = {};

/** Demo credentials for login fallback */
const DEMO_PW = 'Demo123!';

/** Browser-side init script: refreshes expired JWT via synchronous XHR */
const TOKEN_REFRESH_SCRIPT = () => {
  const refreshToken = localStorage.getItem('bellor_refresh_token');
  if (!refreshToken) return;
  const accessToken = localStorage.getItem('bellor_access_token');
  if (accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      if (payload.exp && payload.exp > Math.floor(Date.now() / 1000) + 60) return;
    } catch { /* malformed → refresh */ }
  }
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/v1/auth/refresh', false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ refreshToken }));
    if (xhr.status === 200) {
      const resp = JSON.parse(xhr.responseText);
      const t = resp.data?.accessToken || resp.accessToken;
      if (t) localStorage.setItem('bellor_access_token', t);
    }
  } catch { /* let app handle */ }
};

interface TokenResult { accessToken: string; refreshToken?: string }

/**
 * Server-side token acquisition: refresh first, login fallback if revoked.
 * The login fallback handles cases where another test (e.g. auth-login)
 * overwrites the user's refresh token in Redis.
 */
async function acquireToken(context: BrowserContext): Promise<TokenResult | null> {
  try {
    const state = await context.storageState();
    for (const origin of state.origins || []) {
      const ls = origin.localStorage || [];
      const rtEntry = ls.find((i) => i.name === 'bellor_refresh_token');
      const userEntry = ls.find((i) => i.name === 'bellor_user');

      // Layer 1: try refresh
      if (rtEntry?.value) {
        const resp = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rtEntry.value }),
        });
        if (resp.ok) {
          const d = await resp.json();
          const at = d.data?.accessToken || d.accessToken;
          if (at) return { accessToken: at };
        }
      }

      // Layer 2: login fallback (cached to avoid rate limits)
      if (userEntry?.value) {
        const email = JSON.parse(userEntry.value).email as string;
        const cached = loginCache[email];
        if (cached && Date.now() - cached.ts < 12 * 60 * 1000) {
          return { accessToken: cached.accessToken, refreshToken: cached.refreshToken };
        }
        const loginResp = await fetch(`${API_BASE}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: DEMO_PW }),
        });
        if (loginResp.ok) {
          const ld = await loginResp.json();
          const data = ld.data || ld;
          loginCache[email] = { accessToken: data.accessToken, refreshToken: data.refreshToken, ts: Date.now() };
          return { accessToken: data.accessToken, refreshToken: data.refreshToken };
        }
      }
    }
  } catch { /* server unreachable */ }
  return null;
}

export async function addAutoRefresh(context: BrowserContext): Promise<BrowserContext> {
  await context.addInitScript(TOKEN_REFRESH_SCRIPT);
  return context;
}

export const test = base.extend({
  page: async ({ page, context }, use) => {
    const result = await acquireToken(context);
    if (result) {
      await page.addInitScript((tokens: TokenResult) => {
        localStorage.setItem('bellor_access_token', tokens.accessToken);
        if (tokens.refreshToken) localStorage.setItem('bellor_refresh_token', tokens.refreshToken);
      }, result);
    }
    await page.addInitScript(TOKEN_REFRESH_SCRIPT);
    await use(page);
  },
});

export { expect };
export type { Page } from '@playwright/test';
