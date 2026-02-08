/**
 * Bellor Comprehensive Logging System
 * Writes detailed logs to files for debugging and monitoring
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log directory - relative to project root
const LOG_DIR = path.join(__dirname, '..', '..', 'logs');

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

class Logger {
  private static instance: Logger;
  private currentLogFile: string;
  private requestLogFile: string;
  private errorLogFile: string;

  private constructor() {
    const today = new Date().toISOString().split('T')[0];
    this.currentLogFile = path.join(LOG_DIR, `app-${today}.log`);
    this.requestLogFile = path.join(LOG_DIR, `requests-${today}.log`);
    this.errorLogFile = path.join(LOG_DIR, `errors-${today}.log`);
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatEntry(entry: LogEntry): string {
    const lines: string[] = [];
    lines.push(`\n${'='.repeat(80)}`);
    lines.push(`[${entry.timestamp}] [${entry.level}] [${entry.category}]`);
    lines.push(`Message: ${entry.message}`);

    if (entry.request) {
      lines.push(`\n--- REQUEST ---`);
      lines.push(`ID: ${entry.request.id}`);
      lines.push(`${entry.request.method} ${entry.request.url}`);
      if (entry.request.userId) {
        lines.push(`User ID: ${entry.request.userId}`);
      }
      if (entry.request.params && Object.keys(entry.request.params).length > 0) {
        lines.push(`Params: ${JSON.stringify(entry.request.params, null, 2)}`);
      }
      if (entry.request.query && Object.keys(entry.request.query).length > 0) {
        lines.push(`Query: ${JSON.stringify(entry.request.query, null, 2)}`);
      }
      if (entry.request.body && Object.keys(entry.request.body).length > 0) {
        lines.push(`Body: ${JSON.stringify(entry.request.body, null, 2)}`);
      }
    }

    if (entry.response) {
      lines.push(`\n--- RESPONSE ---`);
      lines.push(`Status: ${entry.response.statusCode}`);
      if (entry.response.duration) {
        lines.push(`Duration: ${entry.response.duration}ms`);
      }
      if (entry.response.body) {
        lines.push(`Body: ${JSON.stringify(entry.response.body, null, 2)}`);
      }
    }

    if (entry.error) {
      lines.push(`\n--- ERROR ---`);
      lines.push(`Name: ${entry.error.name}`);
      lines.push(`Message: ${entry.error.message}`);
      if (entry.error.stack) {
        lines.push(`Stack:\n${entry.error.stack}`);
      }
    }

    if (entry.data) {
      lines.push(`\n--- DATA ---`);
      lines.push(JSON.stringify(entry.data, null, 2));
    }

    if (entry.context && Object.keys(entry.context).length > 0) {
      lines.push(`\n--- CONTEXT ---`);
      lines.push(JSON.stringify(entry.context, null, 2));
    }

    lines.push(`${'='.repeat(80)}\n`);
    return lines.join('\n');
  }

  private writeToFile(filePath: string, content: string) {
    try {
      fs.appendFileSync(filePath, content, 'utf8');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  log(entry: LogEntry) {
    const formatted = this.formatEntry(entry);

    // Always write to main log
    this.writeToFile(this.currentLogFile, formatted);

    // Also write to console for immediate visibility
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
      console.error(formatted);
      this.writeToFile(this.errorLogFile, formatted);
    } else if (entry.level === LogLevel.WARN) {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }

    // Request logs go to separate file
    if (entry.request) {
      this.writeToFile(this.requestLogFile, formatted);
    }
  }

  debug(category: string, message: string, data?: Record<string, unknown>) {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      category,
      message,
      data,
    });
  }

  info(category: string, message: string, data?: Record<string, unknown>) {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category,
      message,
      data,
    });
  }

  warn(category: string, message: string, data?: Record<string, unknown>) {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      category,
      message,
      data,
    });
  }

  error(category: string, message: string, error?: Error, context?: Record<string, unknown>) {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      category,
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      context,
    });
  }

  fatal(category: string, message: string, error?: Error, context?: Record<string, unknown>) {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.FATAL,
      category,
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      context,
    });
  }

  request(entry: Omit<LogEntry, 'timestamp' | 'level'>) {
    this.log({
      ...entry,
      timestamp: new Date().toISOString(),
      level: entry.response?.statusCode && entry.response.statusCode >= 400
        ? (entry.response.statusCode >= 500 ? LogLevel.ERROR : LogLevel.WARN)
        : LogLevel.INFO,
    });
  }
}

export const logger = Logger.getInstance();

// Helper to sanitize sensitive data from logs
export function sanitizeForLog(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;

  const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken', 'authorization', 'secret'];
  const sanitized: Record<string, unknown> = { ...(obj as Record<string, unknown>) };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveFields.some(f => key.toLowerCase().includes(f))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  }

  return sanitized;
}

// Date validation helper with logging
export function validateAndParseDate(dateStr: string | undefined, fieldName: string): Date | null {
  if (!dateStr) {
    logger.debug('DATE_VALIDATION', `${fieldName} is empty/undefined`, { dateStr });
    return null;
  }

  // Check format: yyyy-MM-dd
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    logger.warn('DATE_VALIDATION', `${fieldName} has invalid format`, {
      dateStr,
      expectedFormat: 'yyyy-MM-dd',
      actualLength: dateStr.length,
    });
    return null;
  }

  // Parse and validate
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    logger.warn('DATE_VALIDATION', `${fieldName} is not a valid date`, { dateStr });
    return null;
  }

  // Check reasonable range (1900 to today)
  const year = parsed.getFullYear();
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) {
    logger.warn('DATE_VALIDATION', `${fieldName} year out of range`, {
      dateStr,
      year,
      validRange: '1900-' + currentYear,
    });
    return null;
  }

  logger.debug('DATE_VALIDATION', `${fieldName} validated successfully`, { dateStr, parsed: parsed.toISOString() });
  return parsed;
}

export default logger;
