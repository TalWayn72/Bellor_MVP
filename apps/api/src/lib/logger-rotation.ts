/**
 * Logger Rotation Utilities
 * Handles log file rotation by size and cleanup by age
 */

import fs from 'fs';
import path from 'path';

const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_RETENTION_DAYS = 7;

/** Remove log files older than MAX_RETENTION_DAYS */
export function cleanupOldLogs(logDir: string) {
  try {
    const files = fs.readdirSync(logDir);
    const now = Date.now();
    const maxAge = MAX_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (!file.endsWith('.log')) continue;
      const filePath = path.join(logDir, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
      }
    }
  } catch {
    // Ignore cleanup errors on startup
  }
}

/** Rotate file if it exceeds MAX_LOG_SIZE */
export function rotateIfNeeded(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) return;
    const stat = fs.statSync(filePath);
    if (stat.size < MAX_LOG_SIZE) return;

    const rotated = `${filePath}.${Date.now()}`;
    fs.renameSync(filePath, rotated);
  } catch {
    // Ignore rotation errors
  }
}
