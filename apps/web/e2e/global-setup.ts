/**
 * Global setup for full-stack E2E tests
 *
 * Runs before all tests:
 * 1. Verifies Docker services are running
 * 2. Clears rate limits in Redis
 * 3. Creates authenticated storage states via API login (not UI)
 */
import { FullConfig } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createAuthStateViaAPI } from './setup-auth-state.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000';
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

  // Step 1.5: Clear rate limits in Redis to prevent test flakiness
  console.log('Step 1.5: Clearing rate limits in Redis...');
  try {
    const { execSync } = await import('child_process');
    const redisPw = process.env.REDIS_PASSWORD;
    const authFlag = redisPw ? `-a ${redisPw} --no-auth-warning` : '';
    const delCmd = `redis-cli ${authFlag} KEYS 'fastify-rate-limit*' | xargs -r redis-cli ${authFlag} DEL`;
    const containers = ['bellor-redis', 'bellor_redis'];
    let cleared = false;
    for (const container of containers) {
      try {
        execSync(`docker exec ${container} sh -c "${delCmd}"`, {
          stdio: 'pipe',
          timeout: 5000,
        });
        cleared = true;
        break;
      } catch { /* try next container name */ }
    }
    if (!cleared) {
      execSync(`bash -c "${delCmd}"`, { stdio: 'pipe', timeout: 5000 });
      cleared = true;
    }
    console.log('  ✓ Rate limits cleared\n');
  } catch {
    console.log('  ⚠ Could not clear rate limits (non-critical)\n');
  }

  // Step 2: Create authenticated storage states via API
  console.log('Step 2: Creating authenticated sessions via API...');

  const fs = await import('fs');
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  await createAuthStateViaAPI({
    email: 'demo_sarah@bellor.app',
    password: 'Demo123!',
    storageStatePath: resolve(AUTH_DIR, 'user.json'),
    label: 'demo user (Sarah)',
  });

  await createAuthStateViaAPI({
    email: 'demo_david@bellor.app',
    password: 'Demo123!',
    storageStatePath: resolve(AUTH_DIR, 'user2.json'),
    label: 'demo user (David)',
  });

  await createAuthStateViaAPI({
    email: 'admin@bellor.app',
    password: 'Demo123!',
    storageStatePath: resolve(AUTH_DIR, 'admin.json'),
    label: 'admin',
  });

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

export default globalSetup;
