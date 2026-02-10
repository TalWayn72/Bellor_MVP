/**
 * Test Setup - Bellor API
 * Orchestrates test environment with modular mocks and utilities
 *
 * @see PRD.md Section 14 - Development Guidelines
 * Target: 80%+ test coverage for robust system supporting 10K+ concurrent users
 */

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://bellor:bellor_dev@localhost:5432/bellor_test';
process.env.JWT_SECRET = 'test-jwt-secret-min-32-chars-for-testing-12345678';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-chars-for-testing-87654321';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.FRONTEND_URL = 'http://localhost:5173';

// Load all mocks (order matters: email/cache before prisma)
import './mocks/index.js';

// Re-export all factories and helpers for backward compatibility
export * from './factories/index.js';
export * from './helpers/index.js';
