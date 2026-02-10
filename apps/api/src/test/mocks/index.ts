/**
 * Mocks barrel export
 * Import order matters: email and cache must be mocked before prisma
 */
import './email.mock.js';
import './cache.mock.js';
import './prisma.mock.js';
import './redis.mock.js';
import './lifecycle.js';
