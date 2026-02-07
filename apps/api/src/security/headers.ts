/**
 * Security Headers
 * Configures HTTP security headers for the Fastify application.
 * OWASP recommended headers.
 */

import { FastifyReply, FastifyRequest } from 'fastify';
import { SECURITY_HEADERS, HSTS_HEADER } from '../config/security.config.js';
import { env } from '../config/env.js';

/**
 * Apply security headers to every response
 */
export async function applySecurityHeaders(
  _request: FastifyRequest,
  reply: FastifyReply,
  payload: unknown
): Promise<unknown> {
  // Apply all configured security headers
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    reply.header(header, value);
  }

  // HSTS only in production (requires HTTPS)
  if (env.NODE_ENV === 'production') {
    reply.header('Strict-Transport-Security', HSTS_HEADER);
  }

  // Remove server identification headers
  reply.removeHeader('X-Powered-By');
  reply.header('Server', 'Bellor');

  return payload;
}

/**
 * Get security headers as a plain object (for nginx config generation)
 */
export function getSecurityHeadersMap(): Record<string, string> {
  const headers = { ...SECURITY_HEADERS };

  if (env.NODE_ENV === 'production') {
    headers['Strict-Transport-Security'] = HSTS_HEADER;
  }

  return headers;
}
