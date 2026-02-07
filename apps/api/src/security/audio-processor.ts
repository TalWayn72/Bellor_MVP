/**
 * Audio Processor
 * Validates audio files: format checking, duration limits, metadata stripping.
 */

import { FILE_SECURITY } from '../config/security.config.js';
import { detectFileType } from './file-validator.js';

export interface AudioValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: string;
  estimatedDuration?: number;
}

/**
 * Estimate audio duration from file size and format
 * This is a rough estimate — exact duration requires decoding
 */
function estimateAudioDuration(buffer: Buffer, mimeType: string): number {
  // Rough bitrate estimates
  const bitrates: Record<string, number> = {
    'audio/mpeg': 128000,     // 128 kbps typical MP3
    'audio/wav': 1411200,     // 44.1kHz 16-bit stereo
    'audio/ogg': 96000,       // 96 kbps typical OGG
    'audio/mp4': 128000,      // 128 kbps typical AAC
    'audio/webm': 96000,      // 96 kbps typical WebM audio
    'audio/x-m4a': 128000,
  };

  const bitrate = bitrates[mimeType] || 128000;
  return (buffer.length * 8) / bitrate; // Duration in seconds
}

/**
 * Validate an audio file for security
 */
export function validateAudioSecurity(
  buffer: Buffer,
  claimedMimeType: string,
  filename: string
): AudioValidationResult {
  // Check if buffer is empty
  if (buffer.length === 0) {
    return { valid: false, error: 'Empty file' };
  }

  // Check file size
  if (buffer.length > FILE_SECURITY.audio.maxSize) {
    return {
      valid: false,
      error: `Audio file exceeds maximum size of ${FILE_SECURITY.audio.maxSize / 1024 / 1024}MB`,
    };
  }

  // Detect actual type from magic bytes
  const detectedType = detectFileType(buffer);

  if (detectedType) {
    // Ensure it's actually an audio file (or a container that could hold audio)
    const isAudio = detectedType.startsWith('audio/');
    const isVideoContainer = detectedType === 'video/mp4' || detectedType === 'video/webm';

    if (!isAudio && !isVideoContainer) {
      return {
        valid: false,
        error: `File content detected as "${detectedType}", not a valid audio format`,
      };
    }

    // Block executable content
    if (detectedType === 'application/x-executable' ||
        detectedType === 'application/zip' ||
        detectedType === 'application/pdf') {
      return {
        valid: false,
        error: 'File content does not match an audio format',
      };
    }
  }

  // Estimate duration
  const estimatedDuration = estimateAudioDuration(buffer, claimedMimeType);
  if (estimatedDuration > FILE_SECURITY.audio.maxDurationSeconds) {
    return {
      valid: false,
      estimatedDuration,
      error: `Estimated audio duration (${Math.round(estimatedDuration)}s) exceeds maximum of ${FILE_SECURITY.audio.maxDurationSeconds}s`,
    };
  }

  return {
    valid: true,
    detectedType: detectedType || claimedMimeType,
    estimatedDuration,
  };
}

/**
 * Strip metadata from audio buffer
 * For simple formats this returns the buffer as-is (metadata stripping
 * requires format-specific libraries like ffmpeg).
 * For production use, integrate with ffmpeg for full re-encoding.
 */
export function stripAudioMetadata(buffer: Buffer): Buffer {
  // For MP3 files with ID3 tags, we can strip the ID3 header
  if (buffer.length > 10 &&
      buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    // ID3v2 tag present — calculate tag size
    const size = (buffer[6] << 21) | (buffer[7] << 14) | (buffer[8] << 7) | buffer[9];
    const headerSize = size + 10;

    if (headerSize < buffer.length) {
      // Return buffer without ID3 header
      return buffer.slice(headerSize);
    }
  }

  // For other formats, return as-is
  // Production recommendation: use ffmpeg for full re-encoding
  return buffer;
}
