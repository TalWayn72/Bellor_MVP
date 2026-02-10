/**
 * Storage Service Unit Tests
 *
 * @see PRD.md Section 14 - Development Guidelines
 * @see PRD.md Section 4.4.1 - File Upload & Storage
 * @see OPEN_ISSUES.md ISSUE-007 - Drawing vs Photos separation
 *
 * Target Coverage: 80%
 * Priority: High
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to properly set up the mock before module resolution
const mockSharpInstance = vi.hoisted(() => ({
  resize: vi.fn().mockReturnThis(),
  toFormat: vi.fn().mockReturnThis(),
  toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-image')),
}));

// Mock modules before importing the service
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://mock-presigned-url.com'),
}));

vi.mock('sharp', () => ({
  default: vi.fn(() => mockSharpInstance),
}));

vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../config/env.js', () => ({
  env: {
    R2_ENDPOINT: null, // Test local storage by default
    R2_ACCESS_KEY_ID: null,
    R2_SECRET_ACCESS_KEY: null,
    R2_BUCKET: 'test-bucket',
    CDN_URL: null,
    PORT: 3000,
  },
}));

// Import after mocking
import { storageService } from './storage.service.js';
import sharp from 'sharp';

describe('[P2][infra] StorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockSharpInstance.resize.mockReturnThis();
    mockSharpInstance.toFormat.mockReturnThis();
    mockSharpInstance.toBuffer.mockResolvedValue(Buffer.from('mock-image'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // CONFIGURATION TESTS
  // ============================================
  describe('isConfigured', () => {
    it('should return true (supports local fallback)', () => {
      expect(storageService.isConfigured()).toBe(true);
    });
  });

  describe('isCloudConfigured', () => {
    it('should return false when R2 is not configured', () => {
      expect(storageService.isCloudConfigured()).toBe(false);
    });
  });

  // ============================================
  // PROFILE IMAGE UPLOAD TESTS
  // ============================================
  describe('uploadProfileImage', () => {
    const mockBuffer = Buffer.from('test-image-data');
    const mockContentType = 'image/jpeg';
    const mockFileName = 'profile.jpg';
    const mockUserId = 'user-123';

    it('should upload profile image successfully', async () => {
      const result = await storageService.uploadProfileImage(
        mockBuffer,
        mockContentType,
        mockFileName,
        mockUserId
      );

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('contentType');
      expect(result).toHaveProperty('size');
      expect(result.key).toContain('profiles/');
      expect(result.key).toContain(mockUserId);
    });

    it('should reject invalid file types', async () => {
      await expect(
        storageService.uploadProfileImage(
          mockBuffer,
          'application/pdf',
          'file.pdf',
          mockUserId
        )
      ).rejects.toThrow('Invalid file type');
    });

    it('should optimize image with sharp', async () => {
      await storageService.uploadProfileImage(
        mockBuffer,
        mockContentType,
        mockFileName,
        mockUserId
      );

      expect(sharp).toHaveBeenCalled();
    });
  });

  // ============================================
  // DRAWING UPLOAD TESTS (ISSUE-007)
  // ============================================
  describe('uploadFile (for drawings)', () => {
    const mockBuffer = Buffer.from('drawing-data');
    const mockContentType = 'image/png';
    const mockFileName = 'drawing.png';
    const mockUserId = 'user-456';

    it('should upload drawing to separate folder', async () => {
      const result = await storageService.uploadFile(
        mockBuffer,
        mockContentType,
        mockFileName,
        mockUserId,
        'drawings'
      );

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('key');
      expect(result.key).toContain('drawings/');
      expect(result.key).toContain(mockUserId);
      // Ensure it's NOT in profiles folder
      expect(result.key).not.toContain('profiles/');
    });

    it('should NOT save drawing to profiles folder', async () => {
      const result = await storageService.uploadFile(
        mockBuffer,
        mockContentType,
        mockFileName,
        mockUserId,
        'drawings'
      );

      // Critical: drawings must be separate from profiles
      expect(result.key.startsWith('drawings/')).toBe(true);
      expect(result.key.startsWith('profiles/')).toBe(false);
    });

    it('should optimize drawing images', async () => {
      await storageService.uploadFile(
        mockBuffer,
        mockContentType,
        mockFileName,
        mockUserId,
        'drawings'
      );

      expect(sharp).toHaveBeenCalled();
    });

    it('should accept custom folder for different upload types', async () => {
      const folders = ['drawings', 'responses', 'stories'];

      for (const folder of folders) {
        const result = await storageService.uploadFile(
          mockBuffer,
          mockContentType,
          mockFileName,
          mockUserId,
          folder
        );

        expect(result.key).toContain(`${folder}/`);
      }
    });

    it('should reject invalid image MIME types for drawings', async () => {
      // Test with invalid image type (image/ prefix but not allowed)
      await expect(
        storageService.uploadFile(
          mockBuffer,
          'image/xyz-invalid', // Invalid image type
          'image.xyz',
          mockUserId,
          'drawings'
        )
      ).rejects.toThrow('Invalid file type');
    });

    it('should accept non-image files without validation', async () => {
      // Non-image files pass through without image validation
      const result = await storageService.uploadFile(
        mockBuffer,
        'application/json', // Non-image type
        'data.json',
        mockUserId,
        'data'
      );

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('key');
    });
  });

  // ============================================
  // AUDIO UPLOAD TESTS
  // ============================================
  describe('uploadAudio', () => {
    const mockBuffer = Buffer.from('audio-data');
    const mockContentType = 'audio/mpeg';
    const mockFileName = 'recording.mp3';
    const mockUserId = 'user-789';

    it('should upload audio file successfully', async () => {
      const result = await storageService.uploadAudio(
        mockBuffer,
        mockContentType,
        mockFileName,
        mockUserId
      );

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('key');
      expect(result.key).toContain('audio/');
    });

    it('should reject invalid audio types', async () => {
      await expect(
        storageService.uploadAudio(
          mockBuffer,
          'video/mp4',
          'video.mp4',
          mockUserId
        )
      ).rejects.toThrow('Invalid file type');
    });
  });

  // ============================================
  // FILE DELETION TESTS
  // ============================================
  describe('deleteFile', () => {
    it('should delete file without throwing', async () => {
      await expect(
        storageService.deleteFile('test-key')
      ).resolves.not.toThrow();
    });
  });

  describe('deleteFiles', () => {
    it('should delete multiple files', async () => {
      await expect(
        storageService.deleteFiles(['key1', 'key2', 'key3'])
      ).resolves.not.toThrow();
    });
  });

  // ============================================
  // SEPARATION VALIDATION TESTS (CRITICAL)
  // ============================================
  describe('Drawing vs Profile separation (ISSUE-007)', () => {
    const mockBuffer = Buffer.from('image-data');
    const mockUserId = 'user-test';

    it('should store drawings and profiles in different locations', async () => {
      const profileResult = await storageService.uploadProfileImage(
        mockBuffer,
        'image/jpeg',
        'photo.jpg',
        mockUserId
      );

      const drawingResult = await storageService.uploadFile(
        mockBuffer,
        'image/png',
        'drawing.png',
        mockUserId,
        'drawings'
      );

      // Profile should be in profiles folder
      expect(profileResult.key).toMatch(/^profiles\//);

      // Drawing should be in drawings folder
      expect(drawingResult.key).toMatch(/^drawings\//);

      // They should have different paths
      expect(profileResult.key).not.toBe(drawingResult.key);
    });

    it('should generate unique keys for each upload', async () => {
      const result1 = await storageService.uploadFile(
        mockBuffer,
        'image/png',
        'drawing.png',
        mockUserId,
        'drawings'
      );

      const result2 = await storageService.uploadFile(
        mockBuffer,
        'image/png',
        'drawing.png',
        mockUserId,
        'drawings'
      );

      // Each upload should have a unique key
      expect(result1.key).not.toBe(result2.key);
    });
  });
});
