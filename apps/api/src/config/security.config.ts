/**
 * Bellor Security Configuration
 * HTTP security headers, rate limiting, auth security, request limits
 * Validation rules delegated to security-validation.config.ts
 */

// Re-export validation rules for backward compatibility
export {
  INPUT_RULES,
  DANGEROUS_PATTERNS,
  FILE_SECURITY,
  type FieldSecurityRule,
} from './security-validation.config.js';

// ---- Rate Limiting ----

export const RATE_LIMITS = {
  global: {
    max: 100,
    timeWindow: '1 minute',
  },
  auth: {
    login: { max: 5, timeWindow: '15 minutes' },
    register: { max: 3, timeWindow: '1 hour' },
    refresh: { max: 20, timeWindow: '1 minute' },
    changePassword: { max: 3, timeWindow: '1 hour' },
  },
  api: {
    search: { max: 60, timeWindow: '1 minute' },
    chat: { max: 30, timeWindow: '1 minute' },
    profile: { max: 20, timeWindow: '1 minute' },
    upload: { max: 10, timeWindow: '1 minute' },
    like: { max: 30, timeWindow: '1 minute' },
  },
  bruteForce: {
    maxAttempts: 5,
    lockoutMinutes: 15,
    trackingPrefix: 'bf:',
  },
};

// ---- Security Headers ----

export const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' wss: https:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'cross-origin',
};

export const HSTS_HEADER = 'max-age=31536000; includeSubDomains; preload';

// ---- Auth Security ----

export const AUTH_SECURITY = {
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  },
  jwt: {
    algorithm: 'HS256' as const,
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    minSecretLength: 32,
  },
  session: {
    cookieFlags: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict' as const,
    },
  },
};

// ---- Request Limits ----

export const REQUEST_LIMITS = {
  defaultBodySize: 1 * 1024 * 1024,    // 1MB
  uploadBodySize: 15 * 1024 * 1024,    // 15MB
  maxJsonDepth: 10,
  maxArrayLength: 100,
  maxFieldCount: 50,
  maxHeaderSize: 8192,
};

// ---- Logging ----

export const SECURITY_LOG_EVENTS = {
  AUTH_LOGIN_SUCCESS: 'auth.login.success',
  AUTH_LOGIN_FAILURE: 'auth.login.failure',
  AUTH_REGISTER: 'auth.register',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_TOKEN_REFRESH: 'auth.token.refresh',
  AUTH_PASSWORD_CHANGE: 'auth.password.change',
  AUTH_BRUTE_FORCE_LOCKOUT: 'auth.bruteforce.lockout',
  INPUT_VALIDATION_FAILURE: 'input.validation.failure',
  INPUT_INJECTION_BLOCKED: 'input.injection.blocked',
  UPLOAD_REJECTED: 'upload.rejected',
  UPLOAD_SUCCESS: 'upload.success',
  RATE_LIMIT_EXCEEDED: 'rate.limit.exceeded',
  ACCESS_DENIED: 'access.denied',
  SUSPICIOUS_ACTIVITY: 'suspicious.activity',
} as const;
