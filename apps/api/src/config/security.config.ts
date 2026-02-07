/**
 * Bellor Security Configuration
 * Central configuration for all security controls.
 * OWASP Top 10 / ASVS Level 2 compliant.
 */

// ─── Input Validation ────────────────────────────────────────────

export interface FieldSecurityRule {
  maxLength: number;
  allowedPattern: RegExp;
  description: string;
}

export const INPUT_RULES: Record<string, FieldSecurityRule> = {
  firstName: {
    maxLength: 50,
    allowedPattern: /^[\p{L}\s'\-]+$/u,
    description: 'Letters, spaces, hyphens, apostrophes',
  },
  lastName: {
    maxLength: 50,
    allowedPattern: /^[\p{L}\s'\-]+$/u,
    description: 'Letters, spaces, hyphens, apostrophes',
  },
  bio: {
    maxLength: 500,
    allowedPattern: /^[\p{L}\p{N}\p{P}\p{S}\p{Z}\p{Emoji_Presentation}\p{Emoji}\u200d\ufe0f]+$/u,
    description: 'Text, emojis, basic punctuation',
  },
  chatMessage: {
    maxLength: 2000,
    allowedPattern: /^[\p{L}\p{N}\p{P}\p{S}\p{Z}\p{Emoji_Presentation}\p{Emoji}\u200d\ufe0f]+$/u,
    description: 'Text, emojis, basic punctuation',
  },
  search: {
    maxLength: 100,
    allowedPattern: /^[\p{L}\p{N}\s]+$/u,
    description: 'Alphanumeric and spaces',
  },
  hobby: {
    maxLength: 100,
    allowedPattern: /^[\p{L}\p{N}\p{P}\p{S}\p{Z}\p{Emoji_Presentation}\p{Emoji}\u200d\ufe0f]+$/u,
    description: 'Text, emojis, basic punctuation',
  },
  email: {
    maxLength: 254,
    allowedPattern: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    description: 'Valid email format',
  },
};

// ─── Dangerous Patterns ──────────────────────────────────────────

/** Patterns that indicate injection attempts */
export const DANGEROUS_PATTERNS = {
  // XSS patterns
  xss: [
    /<script[\s>]/i,
    /javascript\s*:/i,
    /on\w+\s*=/i,
    /\beval\s*\(/i,
    /\bdocument\s*\./i,
    /\bwindow\s*\./i,
    /\balert\s*\(/i,
    /\bprompt\s*\(/i,
    /\bconfirm\s*\(/i,
    /<iframe[\s>]/i,
    /<object[\s>]/i,
    /<embed[\s>]/i,
    /<link[\s>]/i,
    /<meta[\s>]/i,
    /<svg[\s>]/i,
    /<math[\s>]/i,
    /data\s*:\s*text\/html/i,
    /vbscript\s*:/i,
    /expression\s*\(/i,
    /url\s*\(\s*['"]?\s*javascript/i,
  ],

  // SQL injection patterns
  sql: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/i,
    /('|")\s*(OR|AND)\s+.*=.*/i,
    /;\s*(DROP|DELETE|UPDATE|INSERT)/i,
    /--\s*$/,
    /\/\*.*\*\//,
    /\bWAITFOR\s+DELAY\b/i,
    /\bBENCHMARK\s*\(/i,
    /\bSLEEP\s*\(/i,
  ],

  // NoSQL injection patterns
  nosql: [
    /\$(?:gt|gte|lt|lte|ne|in|nin|and|or|not|nor|regex|where|exists|type|mod|all|size|match)\b/i,
    /\{\s*"\$\w+"/,
  ],

  // Command injection patterns
  command: [
    /[;&|`$](?![\p{Emoji_Presentation}])/u,
    /\$\(/,
    /`[^`]*`/,
  ],

  // Template injection patterns
  template: [
    /\{\{.*\}\}/,
    /\$\{.*\}/,
    /<%.*%>/,
    /\{%.*%\}/,
  ],

  // Prototype pollution patterns
  prototypePollution: [
    /__proto__/,
    /constructor\s*\[/,
    /prototype\s*\[/,
    /Object\.assign\s*\(\s*\{\}/,
  ],

  // Base64 encoded content
  base64: [
    /^(?:[A-Za-z0-9+/]{4}){10,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
  ],

  // Data URIs
  dataUri: [
    /data\s*:\s*\w+\/\w+/i,
  ],
};

// ─── File Upload Security ────────────────────────────────────────

export const FILE_SECURITY = {
  image: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    blockedMimeTypes: ['image/svg+xml', 'image/gif', 'image/bmp', 'image/tiff'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'],
    maxSize: 10 * 1024 * 1024, // 10MB
    maxWidth: 4096,
    maxHeight: 4096,
    maxProfileImages: 6,
    /** Magic bytes for image formats */
    magicBytes: {
      jpeg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47],
      webp: { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // "WEBP" at offset 8
      heic: { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }, // "ftyp" at offset 4
    },
  },

  audio: {
    allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm', 'audio/x-m4a'],
    allowedExtensions: ['.mp3', '.wav', '.ogg', '.m4a', '.webm'],
    maxSize: 5 * 1024 * 1024, // 5MB
    maxDurationSeconds: 60,
    magicBytes: {
      mp3: [0x49, 0x44, 0x33], // "ID3"
      mp3_ff: [0xFF, 0xFB],    // MPEG sync
      wav: [0x52, 0x49, 0x46, 0x46], // "RIFF"
      ogg: [0x4F, 0x67, 0x67, 0x53], // "OggS"
    },
  },

  video: {
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    allowedExtensions: ['.mp4', '.webm', '.mov'],
    maxSize: 100 * 1024 * 1024, // 100MB
  },

  /** Files that should ALWAYS be rejected regardless of claimed type */
  blockedExtensions: [
    '.exe', '.bat', '.cmd', '.com', '.msi', '.dll', '.scr', '.pif',
    '.vbs', '.vbe', '.js', '.jse', '.wsf', '.wsh', '.ps1', '.psm1',
    '.sh', '.bash', '.csh', '.ksh', '.php', '.php3', '.php4', '.php5',
    '.phtml', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.cgi',
    '.svg', '.html', '.htm', '.xhtml', '.xml', '.xsl', '.xslt',
    '.swf', '.jar', '.class', '.war', '.ear',
  ],

  /** Rate limiting for uploads */
  rateLimit: {
    maxUploadsPerMinute: 10,
    maxUploadsPerHour: 50,
  },
};

// ─── Rate Limiting ───────────────────────────────────────────────

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

// ─── Security Headers ────────────────────────────────────────────

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

// ─── Auth Security ───────────────────────────────────────────────

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

// ─── Request Limits ──────────────────────────────────────────────

export const REQUEST_LIMITS = {
  defaultBodySize: 1 * 1024 * 1024,    // 1MB
  uploadBodySize: 15 * 1024 * 1024,    // 15MB
  maxJsonDepth: 10,
  maxArrayLength: 100,
  maxFieldCount: 50,
  maxHeaderSize: 8192,
};

// ─── Logging ─────────────────────────────────────────────────────

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
