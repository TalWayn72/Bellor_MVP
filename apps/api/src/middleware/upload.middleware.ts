/**
 * Upload Security Middleware
 * Validates file uploads before they reach route handlers.
 * Performs magic bytes checking, MIME validation, size limits, and rate limiting.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { validateFile, sanitizeFilename } from '../security/file-validator.js';
import { checkUploadRateLimit } from '../security/rate-limiter.js';
import { securityLogger } from '../security/logger.js';

type FileCategory = 'image' | 'audio' | 'video';

/**
 * Create an upload validation middleware for a specific file category
 */
export function createUploadValidator(category: FileCategory) {
  return async function uploadValidator(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    // Check authentication
    if (!request.user) {
      return reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    // Check upload rate limit
    const userId = request.user.userId || request.user.id;
    const rateCheck = await checkUploadRateLimit(userId);

    if (!rateCheck.allowed) {
      securityLogger.rateLimitExceeded(request);
      return reply.code(429).send({
        success: false,
        error: {
          code: 'UPLOAD_RATE_LIMIT',
          message: 'Too many uploads. Please try again later.',
        },
      });
    }

    // File validation happens in the route handler after the file is received
    // This middleware primarily handles rate limiting and pre-checks
    // The actual file content validation is done via validateUploadedFile()
  };
}

/**
 * Validate an uploaded file buffer
 * Call this in the route handler after receiving the file
 */
export function validateUploadedFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  category: FileCategory,
  request: FastifyRequest
): { valid: boolean; sanitizedFilename: string; error?: string } {
  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(filename);

  // Validate file
  const result = validateFile(buffer, sanitizedFilename, mimeType, category);

  if (!result.valid) {
    securityLogger.uploadRejected(request, result.error || 'Validation failed', filename);
    return { valid: false, sanitizedFilename, error: result.error };
  }

  securityLogger.uploadSuccess(request, category, buffer.length);
  return { valid: true, sanitizedFilename };
}
