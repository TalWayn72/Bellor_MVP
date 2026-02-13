import { Redis } from 'ioredis';
import { env } from '../config/env.js';

const isProduction = env.NODE_ENV === 'production';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  connectTimeout: 5000,
  commandTimeout: isProduction ? 3000 : 10000,
  retryStrategy(times) {
    if (times > 10) return null;
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: isProduction,
});
