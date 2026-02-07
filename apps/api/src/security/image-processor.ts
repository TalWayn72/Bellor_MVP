/**
 * Image Processor
 * Secure image processing: EXIF stripping, re-encoding, dimension validation.
 * Uses sharp for all image operations.
 */

import sharp from 'sharp';
import { FILE_SECURITY } from '../config/security.config.js';

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  stripMetadata?: boolean;
}

const DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
  maxWidth: FILE_SECURITY.image.maxWidth,
  maxHeight: FILE_SECURITY.image.maxHeight,
  quality: 85,
  format: 'webp',
  stripMetadata: true,
};

/**
 * Validate image dimensions without fully decoding
 * Protects against decompression bombs
 */
export async function validateImageDimensions(buffer: Buffer): Promise<{
  valid: boolean;
  width?: number;
  height?: number;
  error?: string;
}> {
  try {
    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      return { valid: false, error: 'Unable to read image dimensions' };
    }

    if (metadata.width > FILE_SECURITY.image.maxWidth ||
        metadata.height > FILE_SECURITY.image.maxHeight) {
      return {
        valid: false,
        width: metadata.width,
        height: metadata.height,
        error: `Image dimensions ${metadata.width}x${metadata.height} exceed maximum ${FILE_SECURITY.image.maxWidth}x${FILE_SECURITY.image.maxHeight}`,
      };
    }

    // Check for decompression bomb (pixel count)
    const totalPixels = metadata.width * metadata.height;
    const maxPixels = FILE_SECURITY.image.maxWidth * FILE_SECURITY.image.maxHeight;
    if (totalPixels > maxPixels) {
      return {
        valid: false,
        error: `Image pixel count (${totalPixels}) exceeds maximum (${maxPixels})`,
      };
    }

    return { valid: true, width: metadata.width, height: metadata.height };
  } catch (error) {
    return { valid: false, error: 'Failed to read image metadata — file may be corrupted or malicious' };
  }
}

/**
 * Process an image securely:
 * 1. Validate dimensions
 * 2. Strip all metadata (EXIF, GPS, device info)
 * 3. Re-encode to target format (neutralizes hidden payloads)
 * 4. Resize if exceeding limits
 */
export async function processImage(
  buffer: Buffer,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Step 1: Validate dimensions
  const dimCheck = await validateImageDimensions(buffer);
  if (!dimCheck.valid) {
    throw new Error(dimCheck.error);
  }

  // Step 2-4: Process with sharp
  let pipeline = sharp(buffer);

  // Strip all metadata (EXIF, IPTC, XMP, GPS, etc.)
  if (opts.stripMetadata) {
    pipeline = pipeline.rotate(); // Auto-rotate based on EXIF, then strip
  }

  // Resize if needed (fit within bounds, don't enlarge)
  pipeline = pipeline.resize(opts.maxWidth, opts.maxHeight, {
    fit: 'inside',
    withoutEnlargement: true,
  });

  // Re-encode to target format (this neutralizes any hidden payloads)
  switch (opts.format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: opts.quality, mozjpeg: true });
      break;
    case 'png':
      pipeline = pipeline.png({ quality: opts.quality, compressionLevel: 9 });
      break;
    case 'webp':
    default:
      pipeline = pipeline.webp({ quality: opts.quality });
      break;
  }

  const outputBuffer = await pipeline.toBuffer();
  const outputMetadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    width: outputMetadata.width || 0,
    height: outputMetadata.height || 0,
    format: opts.format,
    size: outputBuffer.length,
  };
}

/**
 * Process a profile image with standard settings
 */
export async function processProfileImage(buffer: Buffer): Promise<ProcessedImage> {
  return processImage(buffer, {
    maxWidth: 800,
    maxHeight: 800,
    quality: 85,
    format: 'webp',
    stripMetadata: true,
  });
}

/**
 * Process a story image with standard settings
 */
export async function processStoryImage(buffer: Buffer): Promise<ProcessedImage> {
  return processImage(buffer, {
    maxWidth: 1080,
    maxHeight: 1920,
    quality: 85,
    format: 'webp',
    stripMetadata: true,
  });
}

/**
 * Generate a thumbnail from an image
 */
export async function generateThumbnail(
  buffer: Buffer,
  width = 200,
  height = 200
): Promise<ProcessedImage> {
  return processImage(buffer, {
    maxWidth: width,
    maxHeight: height,
    quality: 70,
    format: 'webp',
    stripMetadata: true,
  });
}
