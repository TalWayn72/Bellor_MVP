/**
 * Security Module — Barrel Exports
 * Central export point for all security utilities.
 */

// Input sanitization
export {
  sanitizeInput,
  sanitizeObject,
  stripHtml,
  encodeHtmlEntities,
  stripControlChars,
  detectInjection,
  checkPrototypePollution,
  validatePasswordStrength,
} from './input-sanitizer.js';

// File validation
export {
  validateFile,
  validateImageFile,
  validateAudioFile,
  detectFileType,
  sanitizeFilename,
} from './file-validator.js';

// Image processing
export {
  processImage,
  processProfileImage,
  processStoryImage,
  generateThumbnail,
  validateImageDimensions,
} from './image-processor.js';

// Audio processing
export {
  validateAudioSecurity,
  stripAudioMetadata,
} from './audio-processor.js';

// Security headers
export {
  applySecurityHeaders,
  getSecurityHeadersMap,
} from './headers.js';

// Security logging
export {
  logSecurityEvent,
  securityLogger,
} from './logger.js';

// Auth hardening
export {
  bruteForceProtection,
  handleFailedLogin,
  handleSuccessfulLogin,
  isLockedOut,
  clearFailedAttempts,
  getRemainingAttempts,
} from './auth-hardening.js';

// CSRF protection
export {
  csrfProtection,
  generateCsrfToken,
  setCsrfCookie,
} from './csrf-protection.js';

// Rate limiting
export {
  getAuthRateLimitConfig,
  getApiRateLimitConfig,
  checkUploadRateLimit,
} from './rate-limiter.js';
