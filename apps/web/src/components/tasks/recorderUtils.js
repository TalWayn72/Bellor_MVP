/**
 * Shared utilities for MediaRecorder components (Video + Audio)
 * Handles cross-browser MIME type detection and file extension mapping
 */

// Video MIME types in preference order (MP4 first for iOS compatibility)
const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

// Audio MIME types in preference order (webm first for Chrome/Firefox, mp4 fallback for Safari/iOS)
const AUDIO_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

/**
 * Get the best supported MIME type for recording
 * @param {'video' | 'audio'} kind
 * @returns {string} Best supported MIME type
 */
export function getRecorderMimeType(kind) {
  const candidates = kind === 'video' ? VIDEO_MIME_TYPES : AUDIO_MIME_TYPES;

  if (typeof MediaRecorder === 'undefined') {
    return candidates[candidates.length - 1];
  }

  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }

  // Fallback - let browser choose
  return '';
}

/**
 * Get file extension from MIME type
 * @param {string} mimeType
 * @returns {string} File extension including dot
 */
export function getFileExtension(mimeType) {
  const base = mimeType.split(';')[0].trim();
  const map = {
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'audio/mp4': '.m4a',
    'audio/webm': '.webm',
    'audio/ogg': '.ogg',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
  };
  return map[base] || '.webm';
}
