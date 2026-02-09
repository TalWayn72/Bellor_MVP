/**
 * Logger Types and Configuration
 * Log levels, entry interfaces, and log directory setup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log directory - relative to project root
export const LOG_DIR = path.join(__dirname, '..', '..', 'logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  request?: {
    id: string;
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: Record<string, unknown>;
    query?: Record<string, unknown>;
    params?: Record<string, unknown>;
    userId?: string;
  };
  response?: {
    statusCode: number;
    body?: Record<string, unknown>;
    duration?: number;
  };
  context?: Record<string, unknown>;
}
