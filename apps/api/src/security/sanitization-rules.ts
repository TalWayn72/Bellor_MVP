/**
 * Sanitization Rules
 * Low-level sanitization utilities: HTML stripping, entity encoding,
 * control character removal, injection detection, and password validation.
 */

import { DANGEROUS_PATTERNS } from '../config/security.config.js';

/**
 * Strip HTML tags from input
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/');
}

/**
 * Encode HTML entities for safe output
 */
export function encodeHtmlEntities(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Strip null bytes and control characters
 */
export function stripControlChars(input: string): string {
  // Remove null bytes and most control characters but keep newlines and tabs
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Check input against dangerous patterns
 * Returns the first matched threat category or null if clean
 */
export function detectInjection(input: string): string | null {
  for (const [category, patterns] of Object.entries(DANGEROUS_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(input)) {
        return category;
      }
    }
  }
  return null;
}

/**
 * Check for prototype pollution in object keys
 */
export function checkPrototypePollution(obj: unknown): boolean {
  if (obj === null || typeof obj !== 'object') return false;

  const dangerous = ['__proto__', 'constructor', 'prototype'];

  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (dangerous.includes(key)) return true;
    if (checkPrototypePollution((obj as Record<string, unknown>)[key])) return true;
  }

  return false;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (password.length > 128) errors.push('Password must be at most 128 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number');
  if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) errors.push('Password must contain at least one special character');

  return { valid: errors.length === 0, errors };
}
