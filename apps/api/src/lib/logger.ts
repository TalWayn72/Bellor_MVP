/**
 * Bellor Comprehensive Logging System
 * Barrel file - re-exports all logger modules
 *
 * Split into:
 * - logger-types.ts    - LogLevel enum, LogEntry interface, LOG_DIR
 * - logger-formatter.ts - formatLogEntry function
 * - logger-core.ts     - Logger class, singleton instance
 * - logger-helpers.ts  - sanitizeForLog, validateAndParseDate
 */

// Types and configuration
export { LogLevel, LOG_DIR } from './logger-types.js';
export type { LogEntry } from './logger-types.js';

// Formatter
export { formatLogEntry } from './logger-formatter.js';

// Core logger instance
export { logger } from './logger-core.js';

// Helper utilities
export { sanitizeForLog, validateAndParseDate } from './logger-helpers.js';

// Default export - the logger instance
export { default } from './logger-core.js';
