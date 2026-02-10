/**
 * Async Test Helpers
 * Utilities for handling async operations in tests
 */

/** Wait for all pending async operations to complete */
export const flushPromises = () => new Promise(resolve => setImmediate(resolve));
