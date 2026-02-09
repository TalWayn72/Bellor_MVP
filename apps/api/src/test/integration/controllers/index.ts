/**
 * Controller Integration Tests - Barrel Export
 * Comprehensive integration tests for all critical API controllers
 *
 * Coverage:
 * - users.controller: 20 tests (CRUD, search, authorization)
 * - auth.controller: 24 tests (registration, login, password management)
 * - chat.controller: 20 tests (messaging, read receipts, access control)
 * - stories.controller: 18 tests (24-hour ephemeral content)
 * - responses.controller: 18 tests (mission responses)
 * - reports.controller: 18 tests (content moderation)
 * - device-tokens.controller: 17 tests (push notifications)
 * - subscriptions-admin.controller: 15 tests (payment, Stripe webhooks)
 * - users-data.controller: 15 tests (GDPR, data export)
 * - upload.controller: 17 tests (file uploads, security)
 *
 * Total: ~182 integration tests
 *
 * @see PRD.md Section 10 - Phase 6 Testing
 */

export * from './users.controller.integration.test.js';
export * from './auth.controller.integration.test.js';
export * from './chat.controller.integration.test.js';
export * from './stories.controller.integration.test.js';
export * from './responses.controller.integration.test.js';
export * from './reports.controller.integration.test.js';
export * from './device-tokens.controller.integration.test.js';
export * from './subscriptions-admin.controller.integration.test.js';
export * from './users-data.controller.integration.test.js';
export * from './upload.controller.integration.test.js';
