/**
 * Logger Core
 * Main Logger class with singleton pattern and file transport
 */

import fs from 'fs';
import path from 'path';
import { LogLevel, LOG_DIR } from './logger-types.js';
import type { LogEntry } from './logger-types.js';
import { formatLogEntry } from './logger-formatter.js';

function serializeError(err: Error) {
  return { name: err.name, message: err.message, stack: err.stack };
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

  private writeToFile(filePath: string, content: string) {
    try {
      fs.appendFileSync(filePath, content, 'utf8');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  log(entry: LogEntry) {
    const formatted = formatLogEntry(entry);

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

  error(
    category: string, message: string,
    error?: Error, context?: Record<string, unknown>,
  ) {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      category,
      message,
      error: error ? serializeError(error) : undefined,
      context,
    });
  }

  fatal(
    category: string, message: string,
    error?: Error, context?: Record<string, unknown>,
  ) {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.FATAL,
      category,
      message,
      error: error ? serializeError(error) : undefined,
      context,
    });
  }

  request(entry: Omit<LogEntry, 'timestamp' | 'level'>) {
    this.log({
      ...entry,
      timestamp: new Date().toISOString(),
      level:
        entry.response?.statusCode && entry.response.statusCode >= 400
          ? entry.response.statusCode >= 500
            ? LogLevel.ERROR
            : LogLevel.WARN
          : LogLevel.INFO,
    });
  }
}

export const logger = Logger.getInstance();
export default logger;
