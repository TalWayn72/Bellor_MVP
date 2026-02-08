/**
 * Logger Utilities
 * Date validation, sanitizeForLog, helper functions
 */

import { LogLevel, type LogEntry } from './logger.js';

// Re-export for backward compatibility when needed
export { LogLevel };

// Helper to sanitize sensitive data from logs
export function sanitizeForLog(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const sensitiveFields = [
    'password', 'token', 'refreshToken', 'accessToken', 'authorization', 'secret',
  ];
  const sanitized = { ...obj };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveFields.some(f => key.toLowerCase().includes(f))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Date validation helper with logging
 */
export function validateAndParseDate(
  dateStr: string | undefined,
  fieldName: string,
  logFn: {
    debug: (cat: string, msg: string, data?: any) => void;
    warn: (cat: string, msg: string, data?: any) => void;
  }
): Date | null {
  if (!dateStr) {
    logFn.debug('DATE_VALIDATION', `${fieldName} is empty/undefined`, { dateStr });
    return null;
  }

  // Check format: yyyy-MM-dd
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    logFn.warn('DATE_VALIDATION', `${fieldName} has invalid format`, {
      dateStr,
      expectedFormat: 'yyyy-MM-dd',
      actualLength: dateStr.length,
    });
    return null;
  }

  // Parse and validate
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    logFn.warn('DATE_VALIDATION', `${fieldName} is not a valid date`, { dateStr });
    return null;
  }

  // Check reasonable range (1900 to today)
  const year = parsed.getFullYear();
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) {
    logFn.warn('DATE_VALIDATION', `${fieldName} year out of range`, {
      dateStr,
      year,
      validRange: '1900-' + currentYear,
    });
    return null;
  }

  logFn.debug('DATE_VALIDATION', `${fieldName} validated successfully`, {
    dateStr,
    parsed: parsed.toISOString(),
  });
  return parsed;
}

/**
 * Format a log entry into a human-readable string
 */
export function formatLogEntry(entry: LogEntry): string {
  const lines: string[] = [];
  lines.push(`\n${'='.repeat(80)}`);
  lines.push(`[${entry.timestamp}] [${entry.level}] [${entry.category}]`);
  lines.push(`Message: ${entry.message}`);

  if (entry.request) {
    lines.push(`\n--- REQUEST ---`);
    lines.push(`ID: ${entry.request.id}`);
    lines.push(`${entry.request.method} ${entry.request.url}`);
    if (entry.request.userId) {
      lines.push(`User ID: ${entry.request.userId}`);
    }
    if (entry.request.params && Object.keys(entry.request.params).length > 0) {
      lines.push(`Params: ${JSON.stringify(entry.request.params, null, 2)}`);
    }
    if (entry.request.query && Object.keys(entry.request.query).length > 0) {
      lines.push(`Query: ${JSON.stringify(entry.request.query, null, 2)}`);
    }
    if (entry.request.body && Object.keys(entry.request.body).length > 0) {
      lines.push(`Body: ${JSON.stringify(entry.request.body, null, 2)}`);
    }
  }

  if (entry.response) {
    lines.push(`\n--- RESPONSE ---`);
    lines.push(`Status: ${entry.response.statusCode}`);
    if (entry.response.duration) {
      lines.push(`Duration: ${entry.response.duration}ms`);
    }
    if (entry.response.body) {
      lines.push(`Body: ${JSON.stringify(entry.response.body, null, 2)}`);
    }
  }

  if (entry.error) {
    lines.push(`\n--- ERROR ---`);
    lines.push(`Name: ${entry.error.name}`);
    lines.push(`Message: ${entry.error.message}`);
    if (entry.error.stack) {
      lines.push(`Stack:\n${entry.error.stack}`);
    }
  }

  if (entry.data) {
    lines.push(`\n--- DATA ---`);
    lines.push(JSON.stringify(entry.data, null, 2));
  }

  if (entry.context && Object.keys(entry.context).length > 0) {
    lines.push(`\n--- CONTEXT ---`);
    lines.push(JSON.stringify(entry.context, null, 2));
  }

  lines.push(`${'='.repeat(80)}\n`);
  return lines.join('\n');
}
