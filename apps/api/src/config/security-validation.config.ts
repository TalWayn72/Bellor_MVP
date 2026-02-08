/**
 * Security Validation Configuration
 * Input validation rules, injection patterns
 */

// ---- Input Validation ----

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

// ---- Dangerous Patterns ----

/** Patterns that indicate injection attempts */
export const DANGEROUS_PATTERNS = {
  xss: [
    /<script[\s>]/i, /javascript\s*:/i, /on\w+\s*=/i, /\beval\s*\(/i,
    /\bdocument\s*\./i, /\bwindow\s*\./i, /\balert\s*\(/i, /\bprompt\s*\(/i,
    /\bconfirm\s*\(/i, /<iframe[\s>]/i, /<object[\s>]/i, /<embed[\s>]/i,
    /<link[\s>]/i, /<meta[\s>]/i, /<svg[\s>]/i, /<math[\s>]/i,
    /data\s*:\s*text\/html/i, /vbscript\s*:/i, /expression\s*\(/i,
    /url\s*\(\s*['"]?\s*javascript/i,
  ],
  sql: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/i,
    /('|")\s*(OR|AND)\s+.*=.*/i, /;\s*(DROP|DELETE|UPDATE|INSERT)/i,
    /--\s*$/, /\/\*.*\*\//, /\bWAITFOR\s+DELAY\b/i,
    /\bBENCHMARK\s*\(/i, /\bSLEEP\s*\(/i,
  ],
  nosql: [
    /\$(?:gt|gte|lt|lte|ne|in|nin|and|or|not|nor|regex|where|exists|type|mod|all|size|match)\b/i,
    /\{\s*"\$\w+"/,
  ],
  command: [
    /[;&|`$](?![\p{Emoji_Presentation}])/u, /\$\(/, /`[^`]*`/,
  ],
  template: [
    /\{\{.*\}\}/, /\$\{.*\}/, /<%.*%>/, /\{%.*%\}/,
  ],
  prototypePollution: [
    /__proto__/, /constructor\s*\[/, /prototype\s*\[/, /Object\.assign\s*\(\s*\{\}/,
  ],
  base64: [
    /^(?:[A-Za-z0-9+/]{4}){10,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
  ],
  dataUri: [
    /data\s*:\s*\w+\/\w+/i,
  ],
};

// ---- File Upload Security ----

export const FILE_SECURITY = {
  image: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    blockedMimeTypes: ['image/svg+xml', 'image/gif', 'image/bmp', 'image/tiff'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'],
    maxSize: 10 * 1024 * 1024,
    maxWidth: 4096,
    maxHeight: 4096,
    maxProfileImages: 6,
    magicBytes: {
      jpeg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47],
      webp: { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
      heic: { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] },
    },
  },
  audio: {
    allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm', 'audio/x-m4a'],
    allowedExtensions: ['.mp3', '.wav', '.ogg', '.m4a', '.webm'],
    maxSize: 5 * 1024 * 1024,
    maxDurationSeconds: 60,
    magicBytes: {
      mp3: [0x49, 0x44, 0x33],
      mp3_ff: [0xFF, 0xFB],
      wav: [0x52, 0x49, 0x46, 0x46],
      ogg: [0x4F, 0x67, 0x67, 0x53],
    },
  },
  video: {
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    allowedExtensions: ['.mp4', '.webm', '.mov'],
    maxSize: 100 * 1024 * 1024,
  },
  blockedExtensions: [
    '.exe', '.bat', '.cmd', '.com', '.msi', '.dll', '.scr', '.pif',
    '.vbs', '.vbe', '.js', '.jse', '.wsf', '.wsh', '.ps1', '.psm1',
    '.sh', '.bash', '.csh', '.ksh', '.php', '.php3', '.php4', '.php5',
    '.phtml', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.cgi',
    '.svg', '.html', '.htm', '.xhtml', '.xml', '.xsl', '.xslt',
    '.swf', '.jar', '.class', '.war', '.ear',
  ],
  rateLimit: {
    maxUploadsPerMinute: 10,
    maxUploadsPerHour: 50,
  },
};
