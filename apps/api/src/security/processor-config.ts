/**
 * Image Processor Configuration
 * Type definitions, defaults, and preset image processing functions
 */

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

export const DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
  maxWidth: FILE_SECURITY.image.maxWidth,
  maxHeight: FILE_SECURITY.image.maxHeight,
  quality: 85,
  format: 'webp',
  stripMetadata: true,
};

/** Profile image processing preset */
export const PROFILE_IMAGE_OPTIONS: ImageProcessingOptions = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 85,
  format: 'webp',
  stripMetadata: true,
};

/** Story image processing preset */
export const STORY_IMAGE_OPTIONS: ImageProcessingOptions = {
  maxWidth: 1080,
  maxHeight: 1920,
  quality: 85,
  format: 'webp',
  stripMetadata: true,
};

/** Default thumbnail options */
export const THUMBNAIL_DEFAULTS = {
  width: 200,
  height: 200,
  quality: 70,
  format: 'webp' as const,
};
