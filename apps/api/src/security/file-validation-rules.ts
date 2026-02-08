/**
 * File Validation Rules
 * Magic bytes definitions and helper functions for file type detection
 */

import { FILE_SECURITY } from '../config/security.config.js';

/**
 * Check if a buffer starts with specific magic bytes
 */
export function matchesMagicBytes(buffer: Buffer, expected: number[], offset = 0): boolean {
  if (buffer.length < offset + expected.length) return false;
  return expected.every((byte, i) => buffer[offset + i] === byte);
}

/**
 * Check for double extension attacks
 */
export function hasDoubleExtension(filename: string): boolean {
  const parts = filename.split('.');
  if (parts.length <= 2) return false;

  const dangerousExts = FILE_SECURITY.blockedExtensions.map(e => e.replace('.', ''));
  // Check if any middle extension is dangerous
  for (let i = 1; i < parts.length - 1; i++) {
    if (dangerousExts.includes(parts[i].toLowerCase())) return true;
  }
  return false;
}

/**
 * Sanitize filename - remove path traversal and dangerous characters
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '')        // Remove path traversal
    .replace(/[/\\:*?"<>|]/g, '') // Remove dangerous characters
    .replace(/\x00/g, '')        // Remove null bytes
    .replace(/^\.+/, '')         // Remove leading dots
    .trim();
}

/**
 * Detect actual file type from magic bytes
 */
export function detectFileType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (matchesMagicBytes(buffer, [0xFF, 0xD8, 0xFF])) return 'image/jpeg';

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (matchesMagicBytes(buffer, [0x89, 0x50, 0x4E, 0x47])) return 'image/png';

  // WebP: starts with RIFF, then WEBP at offset 8
  if (matchesMagicBytes(buffer, [0x52, 0x49, 0x46, 0x46]) &&
      matchesMagicBytes(buffer, [0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp';

  // GIF: 47 49 46 38
  if (matchesMagicBytes(buffer, [0x47, 0x49, 0x46, 0x38])) return 'image/gif';

  // SVG (text-based, check for opening tag)
  const textStart = buffer.slice(0, 500).toString('utf8').trim().toLowerCase();
  if (textStart.includes('<svg') || textStart.includes('<?xml')) return 'image/svg+xml';

  // HEIC/HEIF: ftyp at offset 4
  if (matchesMagicBytes(buffer, [0x66, 0x74, 0x79, 0x70], 4)) {
    const brand = buffer.slice(8, 12).toString('ascii');
    if (['heic', 'heix', 'hevc', 'mif1'].includes(brand)) return 'image/heic';
    if (['isom', 'mp41', 'mp42', 'M4V '].includes(brand)) return 'video/mp4';
    if (['qt  '].includes(brand)) return 'video/quicktime';
  }

  // MP3: ID3 tag or MPEG sync
  if (matchesMagicBytes(buffer, [0x49, 0x44, 0x33])) return 'audio/mpeg';
  if (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0) return 'audio/mpeg';

  // WAV: RIFF....WAVE
  if (matchesMagicBytes(buffer, [0x52, 0x49, 0x46, 0x46]) &&
      matchesMagicBytes(buffer, [0x57, 0x41, 0x56, 0x45], 8)) return 'audio/wav';

  // OGG: OggS
  if (matchesMagicBytes(buffer, [0x4F, 0x67, 0x67, 0x53])) return 'audio/ogg';

  // WebM: starts with EBML header (1A 45 DF A3)
  if (matchesMagicBytes(buffer, [0x1A, 0x45, 0xDF, 0xA3])) return 'video/webm';

  // PDF (should be blocked)
  if (matchesMagicBytes(buffer, [0x25, 0x50, 0x44, 0x46])) return 'application/pdf';

  // EXE/DLL (MZ header)
  if (matchesMagicBytes(buffer, [0x4D, 0x5A])) return 'application/x-executable';

  // ZIP
  if (matchesMagicBytes(buffer, [0x50, 0x4B, 0x03, 0x04])) return 'application/zip';

  return null;
}
