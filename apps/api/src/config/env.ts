import { z } from 'zod';

// Treat empty strings in .env as undefined so optional fields don't fail URL validation.
const optionalUrl = () =>
  z.preprocess((v) => (v === '' ? undefined : v), z.string().url().optional());
const optionalString = () =>
  z.preprocess((v) => (v === '' ? undefined : v), z.string().optional());

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Storage (Cloudflare R2 / AWS S3)
  R2_ENDPOINT: optionalUrl(),
  R2_ACCESS_KEY_ID: optionalString(),
  R2_SECRET_ACCESS_KEY: optionalString(),
  R2_BUCKET: optionalString(),
  CDN_URL: optionalUrl(),

  // Email (Resend)
  RESEND_API_KEY: optionalString(),
  EMAIL_FROM: z.string().default('Bellor <noreply@bellor.com>'),

  // SMS (Twilio)
  TWILIO_ACCOUNT_SID: optionalString(),
  TWILIO_AUTH_TOKEN: optionalString(),
  TWILIO_PHONE_NUMBER: optionalString(),

  // OAuth
  GOOGLE_CLIENT_ID: optionalString(),
  GOOGLE_CLIENT_SECRET: optionalString(),
  GOOGLE_REDIRECT_URI: z.preprocess(
    (v) => (v === '' || v === undefined ? 'http://localhost:3000/api/v1/oauth/google/callback' : v),
    z.string().url(),
  ),
  APPLE_CLIENT_ID: optionalString(),
  APPLE_TEAM_ID: optionalString(),
  APPLE_KEY_ID: optionalString(),

  // Monitoring
  SENTRY_DSN: optionalUrl(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('\n');

      throw new Error(`Environment validation failed:\n${missingVars}`);
    }
    throw error;
  }
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
