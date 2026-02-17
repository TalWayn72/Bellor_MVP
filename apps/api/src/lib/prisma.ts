import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { env } from '../config/env.js';

const isProduction = env.NODE_ENV === 'production';

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: isProduction ? 3 : 10,
  idleTimeoutMillis: isProduction ? 10000 : 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 30000,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
