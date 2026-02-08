/**
 * Shared test helpers for Auth Integration Tests
 *
 * Contains shared app setup used across all auth integration test files.
 */

import { FastifyInstance } from 'fastify';
import { buildTestApp } from '../build-test-app.js';

let _app: FastifyInstance | null = null;

/**
 * Get or create the shared test app instance.
 * This ensures all integration test files share the same Fastify app.
 */
export async function getTestApp(): Promise<FastifyInstance> {
  if (!_app) {
    _app = await buildTestApp();
  }
  return _app;
}

/**
 * Close the shared test app instance.
 */
export async function closeTestApp(): Promise<void> {
  if (_app) {
    await _app.close();
    _app = null;
  }
}
