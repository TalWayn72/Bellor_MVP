/**
 * Paste Guard Detection Logic
 * Functions for detecting malicious content in pasted text.
 */

import type { PasteGuardConfig } from './paste-guard.types';
import { DEFAULT_PASTE_GUARD_CONFIG } from './paste-guard.types';

/**
 * Check if a string contains binary data patterns
 */
function containsBinaryData(text: string): boolean {
  // Check for null bytes and non-printable characters
  // eslint-disable-next-line no-control-regex
  const binaryPattern = /[\x00-\x08\x0E-\x1F\x7F-\x9F]/;
  return binaryPattern.test(text);
}

/**
 * Check if a string contains Base64 encoded content (long blocks)
 */
function containsBase64Content(text: string): boolean {
  // Match long Base64 strings (at least 40 chars of Base64 with padding)
  const base64Pattern = /(?:[A-Za-z0-9+/]{4}){10,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/;
  return base64Pattern.test(text);
}

/**
 * Check if a string contains Data URIs
 */
function containsDataURI(text: string): boolean {
  return /data\s*:\s*\w+\/\w+/i.test(text);
}

/**
 * Strip control characters from text
 */
function stripControlCharacters(text: string): string {
  // Remove control chars but keep newlines, tabs, and spaces
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validate and clean pasted text
 * Returns cleaned text or null if blocked
 */
export function validatePastedText(
  text: string,
  config: PasteGuardConfig = DEFAULT_PASTE_GUARD_CONFIG
): { text: string; blocked: boolean; reason?: string } {
  // Check paste length
  if (text.length > config.maxPasteLength) {
    return {
      text: text.substring(0, config.maxPasteLength),
      blocked: false,
      reason: 'Paste truncated to maximum length',
    };
  }

  // Check for binary data
  if (config.blockBinaryPaste && containsBinaryData(text)) {
    return { text: '', blocked: true, reason: 'Binary data detected in paste' };
  }

  // Check for Data URIs
  if (config.blockDataURIs && containsDataURI(text)) {
    return { text: '', blocked: true, reason: 'Data URI detected in paste' };
  }

  // Check for Base64 content
  if (config.blockBase64Content && containsBase64Content(text)) {
    return { text: '', blocked: true, reason: 'Encoded content detected in paste' };
  }

  // Strip control characters
  let cleaned = text;
  if (config.stripControlChars) {
    cleaned = stripControlCharacters(cleaned);
  }

  return { text: cleaned, blocked: false };
}
