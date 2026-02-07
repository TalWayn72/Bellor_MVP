/**
 * Client-side Input Sanitizer
 * Provides real-time input validation and sanitization for React components.
 * This is a defense-in-depth layer — server-side validation is the primary defense.
 */

export interface InputSecurityConfig {
  maxLength: number;
  allowedCharPattern?: RegExp;
  blockHtmlTags: boolean;
  blockScriptPatterns: boolean;
  stripControlChars: boolean;
}

/** Default configs per field type */
export const FIELD_CONFIGS: Record<string, InputSecurityConfig> = {
  name: {
    maxLength: 50,
    allowedCharPattern: /^[\p{L}\s'\-]+$/u,
    blockHtmlTags: true,
    blockScriptPatterns: true,
    stripControlChars: true,
  },
  bio: {
    maxLength: 500,
    blockHtmlTags: true,
    blockScriptPatterns: true,
    stripControlChars: true,
  },
  message: {
    maxLength: 2000,
    blockHtmlTags: true,
    blockScriptPatterns: true,
    stripControlChars: true,
  },
  search: {
    maxLength: 100,
    allowedCharPattern: /^[\p{L}\p{N}\s]+$/u,
    blockHtmlTags: true,
    blockScriptPatterns: true,
    stripControlChars: true,
  },
  email: {
    maxLength: 254,
    blockHtmlTags: true,
    blockScriptPatterns: true,
    stripControlChars: true,
  },
  hobby: {
    maxLength: 100,
    blockHtmlTags: true,
    blockScriptPatterns: true,
    stripControlChars: true,
  },
};

/** Dangerous patterns to block */
const DANGEROUS_PATTERNS = [
  /<script[\s>]/i,
  /javascript\s*:/i,
  /on\w+\s*=/i,
  /data\s*:\s*text\/html/i,
  /<iframe[\s>]/i,
  /<object[\s>]/i,
  /<embed[\s>]/i,
  /<svg[\s>]/i,
];

/**
 * Check if text contains dangerous HTML/script patterns
 */
export function containsDangerousPatterns(text: string): boolean {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Strip HTML tags from text
 */
export function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Strip control characters
 */
export function stripControlChars(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Sanitize input text based on configuration
 * Returns sanitized text and whether it was modified
 */
export function sanitizeText(
  text: string,
  config: InputSecurityConfig
): { text: string; modified: boolean; blocked: boolean } {
  let result = text;
  let modified = false;

  // Strip control characters
  if (config.stripControlChars) {
    const cleaned = stripControlChars(result);
    if (cleaned !== result) {
      result = cleaned;
      modified = true;
    }
  }

  // Check for dangerous patterns
  if (config.blockScriptPatterns && containsDangerousPatterns(result)) {
    return { text: '', modified: true, blocked: true };
  }

  // Strip HTML tags
  if (config.blockHtmlTags) {
    const stripped = stripHtmlTags(result);
    if (stripped !== result) {
      result = stripped;
      modified = true;
    }
  }

  // Enforce max length
  if (result.length > config.maxLength) {
    result = result.substring(0, config.maxLength);
    modified = true;
  }

  return { text: result, modified, blocked: false };
}

/**
 * Get the config for a specific field type
 */
export function getFieldConfig(fieldType: string): InputSecurityConfig {
  return FIELD_CONFIGS[fieldType] || FIELD_CONFIGS.message;
}
