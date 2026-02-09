/**
 * Logger Formatter
 * Formats log entries into human-readable strings
 */

import type { LogEntry } from './logger-types.js';

export function formatLogEntry(entry: LogEntry): string {
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
