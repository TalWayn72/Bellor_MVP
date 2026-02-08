/**
 * Input Sanitizer
 * Sanitizes and validates text input to prevent injection attacks.
 * Covers: XSS, SQLi, NoSQLi, command injection, template injection, prototype pollution.
 */

import { INPUT_RULES, type FieldSecurityRule } from '../config/security.config.js';
import {
  stripHtml,
  encodeHtmlEntities,
  stripControlChars,
  detectInjection,
  checkPrototypePollution,
  validatePasswordStrength,
} from './sanitization-rules.js';

// Re-export utilities for backward compatibility
export {
  stripHtml,
  encodeHtmlEntities,
  stripControlChars,
  detectInjection,
  checkPrototypePollution,
  validatePasswordStrength,
};

export interface SanitizeResult {
  clean: string;
  blocked: boolean;
  reason?: string;
}

/**
 * Sanitize a single text input field
 */
export function sanitizeInput(input: string, fieldName?: string): SanitizeResult {
  if (typeof input !== 'string') {
    return { clean: '', blocked: true, reason: 'Input must be a string' };
  }

  // Strip control characters
  let clean = stripControlChars(input);

  // Check for injection patterns
  const injection = detectInjection(clean);
  if (injection) {
    return { clean: '', blocked: true, reason: `Blocked: ${injection} pattern detected` };
  }

  // Strip HTML tags
  clean = stripHtml(clean);

  // Apply field-specific rules if field name provided
  if (fieldName && INPUT_RULES[fieldName]) {
    const rule: FieldSecurityRule = INPUT_RULES[fieldName];

    // Enforce length limit
    if (clean.length > rule.maxLength) {
      clean = clean.substring(0, rule.maxLength);
    }
  }

  // Trim whitespace
  clean = clean.trim();

  return { clean, blocked: false };
}

/**
 * Sanitize an object's string values recursively
 */
export function sanitizeObject(
  obj: Record<string, unknown>,
  fieldRules?: Record<string, string>
): { clean: Record<string, unknown>; blocked: boolean; reason?: string } {
  // Check for prototype pollution
  if (checkPrototypePollution(obj)) {
    return { clean: {}, blocked: true, reason: 'Prototype pollution attempt detected' };
  }

  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      const fieldName = fieldRules?.[key] || key;
      const result = sanitizeInput(value, fieldName);
      if (result.blocked) {
        return { clean: {}, blocked: true, reason: `Field "${key}": ${result.reason}` };
      }
      clean[key] = result.clean;
    } else if (Array.isArray(value)) {
      const cleanArray: unknown[] = [];
      for (const item of value) {
        if (typeof item === 'string') {
          const result = sanitizeInput(item);
          if (result.blocked) {
            return { clean: {}, blocked: true, reason: result.reason };
          }
          cleanArray.push(result.clean);
        } else {
          cleanArray.push(item);
        }
      }
      clean[key] = cleanArray;
    } else {
      clean[key] = value;
    }
  }

  return { clean, blocked: false };
}
