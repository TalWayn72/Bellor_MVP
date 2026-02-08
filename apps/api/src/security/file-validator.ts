/**
 * File Validator
 * Core validation functions for uploaded files.
 */

import { FILE_SECURITY } from '../config/security.config.js';
import path from 'path';
import { detectFileType, hasDoubleExtension } from './file-validation-rules.js';

// Re-export for backward compatibility
export { detectFileType, sanitizeFilename } from './file-validation-rules.js';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: string;
}

/**
 * Validate an image file
 */
export function validateImageFile(
  buffer: Buffer,
  filename: string,
  claimedMimeType: string
): FileValidationResult {
  if (buffer.length > FILE_SECURITY.image.maxSize) {
    return { valid: false, error: `Image exceeds maximum size of ${FILE_SECURITY.image.maxSize / 1024 / 1024}MB` };
  }
  if (buffer.length === 0) {
    return { valid: false, error: 'Empty file' };
  }

  const ext = path.extname(filename).toLowerCase();
  if (FILE_SECURITY.blockedExtensions.includes(ext)) {
    return { valid: false, error: `File extension "${ext}" is not allowed` };
  }
  if (!FILE_SECURITY.image.allowedExtensions.includes(ext)) {
    return { valid: false, error: `Image extension "${ext}" is not allowed. Allowed: ${FILE_SECURITY.image.allowedExtensions.join(', ')}` };
  }
  if (hasDoubleExtension(filename)) {
    return { valid: false, error: 'Double extension detected' };
  }
  if (FILE_SECURITY.image.blockedMimeTypes.includes(claimedMimeType)) {
    return { valid: false, error: `MIME type "${claimedMimeType}" is blocked` };
  }
  if (!FILE_SECURITY.image.allowedMimeTypes.includes(claimedMimeType)) {
    return { valid: false, error: `MIME type "${claimedMimeType}" is not allowed for images` };
  }

  const detectedType = detectFileType(buffer);
  if (!detectedType) {
    return { valid: false, error: 'Unable to detect file type from content' };
  }
  if (!FILE_SECURITY.image.allowedMimeTypes.includes(detectedType)) {
    return { valid: false, error: `Actual file content is "${detectedType}", not an allowed image type` };
  }
  if (detectedType.split('/')[0] !== claimedMimeType.split('/')[0]) {
    return { valid: false, error: 'Claimed MIME type does not match actual file content' };
  }

  return { valid: true, detectedType };
}

/**
 * Validate an audio file
 */
export function validateAudioFile(
  buffer: Buffer,
  filename: string,
  claimedMimeType: string
): FileValidationResult {
  if (buffer.length > FILE_SECURITY.audio.maxSize) {
    return { valid: false, error: `Audio exceeds maximum size of ${FILE_SECURITY.audio.maxSize / 1024 / 1024}MB` };
  }
  if (buffer.length === 0) {
    return { valid: false, error: 'Empty file' };
  }

  const ext = path.extname(filename).toLowerCase();
  if (FILE_SECURITY.blockedExtensions.includes(ext)) {
    return { valid: false, error: `File extension "${ext}" is not allowed` };
  }
  if (!FILE_SECURITY.audio.allowedExtensions.includes(ext)) {
    return { valid: false, error: `Audio extension "${ext}" is not allowed. Allowed: ${FILE_SECURITY.audio.allowedExtensions.join(', ')}` };
  }
  if (hasDoubleExtension(filename)) {
    return { valid: false, error: 'Double extension detected' };
  }
  if (!FILE_SECURITY.audio.allowedMimeTypes.includes(claimedMimeType)) {
    return { valid: false, error: `MIME type "${claimedMimeType}" is not allowed for audio` };
  }

  const detectedType = detectFileType(buffer);
  if (detectedType) {
    const isAudio = detectedType.startsWith('audio/');
    const isVideoContainer = detectedType.startsWith('video/');
    if (!isAudio && !isVideoContainer) {
      return { valid: false, error: `Actual file content is "${detectedType}", not audio` };
    }
  }

  return { valid: true, detectedType: detectedType || claimedMimeType };
}

/**
 * Generic file validation
 */
export function validateFile(
  buffer: Buffer,
  filename: string,
  claimedMimeType: string,
  expectedType: 'image' | 'audio' | 'video'
): FileValidationResult {
  switch (expectedType) {
    case 'image':
      return validateImageFile(buffer, filename, claimedMimeType);
    case 'audio':
      return validateAudioFile(buffer, filename, claimedMimeType);
    case 'video': {
      if (buffer.length > FILE_SECURITY.video.maxSize) {
        return { valid: false, error: `Video exceeds maximum size of ${FILE_SECURITY.video.maxSize / 1024 / 1024}MB` };
      }
      const ext = path.extname(filename).toLowerCase();
      if (!FILE_SECURITY.video.allowedExtensions.includes(ext)) {
        return { valid: false, error: `Video extension "${ext}" is not allowed` };
      }
      if (!FILE_SECURITY.video.allowedMimeTypes.includes(claimedMimeType)) {
        return { valid: false, error: `MIME type "${claimedMimeType}" is not allowed for video` };
      }
      return { valid: true };
    }
    default:
      return { valid: false, error: 'Unknown file type category' };
  }
}
