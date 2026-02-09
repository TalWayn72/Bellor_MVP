/**
 * Logger Helpers
 * Utility functions for sanitizing log data and validating dates
 */

import { logger } from './logger-core.js';

// Helper to sanitize sensitive data from logs
export function sanitizeForLog(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;

  const sensitiveFields = [
    'password',
    'token',
    'refreshToken',
    'accessToken',
    'authorization',
    'secret',
  ];
  const sanitized: Record<string, unknown> = {
    ...(obj as Record<string, unknown>),
  };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveFields.some((f) => key.toLowerCase().includes(f))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  }

  return sanitized;
}

// Date validation helper with logging
export function validateAndParseDate(
  dateStr: string | undefined,
  fieldName: string,
): Date | null {
  if (!dateStr) {
    logger.debug('DATE_VALIDATION', `${fieldName} is empty/undefined`, {
      dateStr,
    });
    return null;
  }

  // Check format: yyyy-MM-dd
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    logger.warn('DATE_VALIDATION', `${fieldName} has invalid format`, {
      dateStr,
      expectedFormat: 'yyyy-MM-dd',
      actualLength: dateStr.length,
    });
    return null;
  }

  // Parse and validate
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    logger.warn('DATE_VALIDATION', `${fieldName} is not a valid date`, {
      dateStr,
    });
    return null;
  }

  // Check reasonable range (1900 to today)
  const year = parsed.getFullYear();
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) {
    logger.warn('DATE_VALIDATION', `${fieldName} year out of range`, {
      dateStr,
      year,
      validRange: '1900-' + currentYear,
    });
    return null;
  }

  logger.debug('DATE_VALIDATION', `${fieldName} validated successfully`, {
    dateStr,
    parsed: parsed.toISOString(),
  });
  return parsed;
}
