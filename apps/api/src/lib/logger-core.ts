/**
 * Logger Core
 * Main Logger class with singleton pattern, file transport, and log rotation
 */

import fs from 'fs';
import path from 'path';
import { LogLevel, LOG_DIR } from './logger-types.js';
import type { LogEntry } from './logger-types.js';
import { formatLogEntry } from './logger-formatter.js';
import { cleanupOldLogs, rotateIfNeeded } from './logger-rotation.js';

function serializeError(err: Error) {
  return { name: err.name, message: err.message, stack: err.stack };
}

class Logger {
  private static instance: Logger;
  private currentDate: string;
  private currentLogFile: string;
  private requestLogFile: string;
  private errorLogFile: string;

  private constructor() {
    this.currentDate = new Date().toISOString().split('T')[0];
    this.currentLogFile = path.join(LOG_DIR, `app-${this.currentDate}.log`);
    this.requestLogFile = path.join(LOG_DIR, `requests-${this.currentDate}.log`);
    this.errorLogFile = path.join(LOG_DIR, `errors-${this.currentDate}.log`);
    cleanupOldLogs(LOG_DIR);
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private refreshDateIfNeeded() {
    const today = new Date().toISOString().split('T')[0];
    if (today !== this.currentDate) {
      this.currentDate = today;
      this.currentLogFile = path.join(LOG_DIR, `app-${today}.log`);
      this.requestLogFile = path.join(LOG_DIR, `requests-${today}.log`);
      this.errorLogFile = path.join(LOG_DIR, `errors-${today}.log`);
    }
  }

  private writeToFile(filePath: string, content: string) {
    try {
      rotateIfNeeded(filePath);
      fs.appendFileSync(filePath, content, 'utf8');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  log(entry: LogEntry) {
    this.refreshDateIfNeeded();
    const formatted = formatLogEntry(entry);

    this.writeToFile(this.currentLogFile, formatted);

    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
      console.error(formatted);
      this.writeToFile(this.errorLogFile, formatted);
    } else if (entry.level === LogLevel.WARN) {
      console.warn(formatted);
    } else {
      // eslint-disable-next-line no-console
      console.log(formatted);
    }

    if (entry.request) {
      this.writeToFile(this.requestLogFile, formatted);
    }
  }

  debug(category: string, message: string, data?: Record<string, unknown>) {
    this.log({ timestamp: new Date().toISOString(), level: LogLevel.DEBUG, category, message, data });
  }

  info(category: string, message: string, data?: Record<string, unknown>) {
    this.log({ timestamp: new Date().toISOString(), level: LogLevel.INFO, category, message, data });
  }

  warn(category: string, message: string, data?: Record<string, unknown>) {
    this.log({ timestamp: new Date().toISOString(), level: LogLevel.WARN, category, message, data });
  }

  error(category: string, message: string, error?: Error, context?: Record<string, unknown>) {
    this.log({
      timestamp: new Date().toISOString(), level: LogLevel.ERROR, category, message,
      error: error ? serializeError(error) : undefined, context,
    });
  }

  fatal(category: string, message: string, error?: Error, context?: Record<string, unknown>) {
    this.log({
      timestamp: new Date().toISOString(), level: LogLevel.FATAL, category, message,
      error: error ? serializeError(error) : undefined, context,
    });
  }

  request(entry: Omit<LogEntry, 'timestamp' | 'level'>) {
    this.log({
      ...entry,
      timestamp: new Date().toISOString(),
      level: entry.response?.statusCode && entry.response.statusCode >= 400
        ? entry.response.statusCode >= 500 ? LogLevel.ERROR : LogLevel.WARN
        : LogLevel.INFO,
    });
  }
}

export const logger = Logger.getInstance();
export default logger;
