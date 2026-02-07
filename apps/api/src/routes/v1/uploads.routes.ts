import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { storageService } from '../../services/storage.service.js';
import { prisma } from '../../lib/prisma.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validateUploadedFile } from '../../middleware/upload.middleware.js';
import { securityLogger } from '../../security/logger.js';

// Validation schemas
const presignedUrlQuerySchema = z.object({
  folder: z.enum(['profiles', 'stories', 'audio', 'responses']),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
});

export default async function uploadsRoutes(app: FastifyInstance) {
  /**
   * Check if storage is configured
   */
  app.get('/status', async () => {
    return {
      success: true,
      data: {
        configured: storageService.isConfigured(),
      },
    };
  });

  /**
   * POST /uploads/profile-image
   * Upload a profile image
   */
  app.post('/profile-image', {
    preHandler: authMiddleware,
  }, async (request, reply) => {
    if (!storageService.isConfigured()) {
      return reply.code(503).send({
        success: false,
        error: { code: 'STORAGE_NOT_CONFIGURED', message: 'Storage service is not configured' },
      });
    }

    const data = await request.file();
    if (!data) {
      return reply.code(400).send({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      });
    }

    try {
      const buffer = await data.toBuffer();

      // Security: Validate uploaded file
      const validation = validateUploadedFile(buffer, data.filename, data.mimetype, 'image', request);
      if (!validation.valid) {
        return reply.code(400).send({
          success: false,
          error: { code: 'INVALID_FILE', message: validation.error || 'File validation failed' },
        });
      }

      const result = await storageService.uploadProfileImage(
        buffer,
        data.mimetype,
        validation.sanitizedFilename,
        request.user!.userId
      );

      securityLogger.uploadSuccess(request, 'image', buffer.length);

      // Update user's profile images
      const user = await prisma.user.findUnique({
        where: { id: request.user!.userId },
        select: { profileImages: true },
      });

      const profileImages = user?.profileImages || [];
      profileImages.push(result.url);

      await prisma.user.update({
        where: { id: request.user!.userId },
        data: { profileImages },
      });

      return {
        success: true,
        data: {
          url: result.url,
          key: result.key,
        },
      };
    } catch (error) {
      app.log.error({ error }, 'Profile image upload failed');
      return reply.code(400).send({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Upload failed',
        },
      });
    }
  });

  /**
   * DELETE /uploads/profile-image
   * Remove a profile image
   */
  app.delete('/profile-image', {
    preHandler: authMiddleware,
    schema: {
      description: 'Remove a profile image',
      tags: ['uploads'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { url } = request.body as { url: string };

    try {
      // Remove from user's profile images
      const user = await prisma.user.findUnique({
        where: { id: request.user!.userId },
        select: { profileImages: true },
      });

      const profileImages = (user?.profileImages || []).filter(img => img !== url);

      await prisma.user.update({
        where: { id: request.user!.userId },
        data: { profileImages },
      });

      // Try to delete from storage (extract key from URL)
      // Note: This is a best-effort deletion
      try {
        const urlObj = new URL(url);
        const key = urlObj.pathname.replace(/^\//, '');
        await storageService.deleteFile(key);
      } catch (e) {
        app.log.warn({ error: e, url }, 'Failed to delete file from storage');
      }

      return { success: true, data: { removed: url } };
    } catch (error) {
      app.log.error({ error }, 'Profile image deletion failed');
      return reply.code(400).send({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: error instanceof Error ? error.message : 'Deletion failed',
        },
      });
    }
  });

  /**
   * POST /uploads/story-media
   * Upload media for a story
   */
  app.post('/story-media', {
    preHandler: authMiddleware,
  }, async (request, reply) => {
    if (!storageService.isConfigured()) {
      return reply.code(503).send({
        success: false,
        error: { code: 'STORAGE_NOT_CONFIGURED', message: 'Storage service is not configured' },
      });
    }

    const data = await request.file();
    if (!data) {
      return reply.code(400).send({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      });
    }

    try {
      const buffer = await data.toBuffer();

      // Security: Validate uploaded file
      const validation = validateUploadedFile(buffer, data.filename, data.mimetype, 'image', request);
      if (!validation.valid) {
        return reply.code(400).send({
          success: false,
          error: { code: 'INVALID_FILE', message: validation.error || 'File validation failed' },
        });
      }

      const result = await storageService.uploadStoryMedia(
        buffer,
        data.mimetype,
        validation.sanitizedFilename,
        request.user!.userId
      );

      securityLogger.uploadSuccess(request, 'image', buffer.length);

      return {
        success: true,
        data: {
          url: result.url,
          key: result.key,
          thumbnailUrl: result.thumbnailUrl,
          contentType: result.contentType,
          size: result.size,
        },
      };
    } catch (error) {
      app.log.error({ error }, 'Story media upload failed');
      return reply.code(400).send({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Upload failed',
        },
      });
    }
  });

  /**
   * POST /uploads/audio
   * Upload audio content
   */
  app.post('/audio', {
    preHandler: authMiddleware,
  }, async (request, reply) => {
    if (!storageService.isConfigured()) {
      return reply.code(503).send({
        success: false,
        error: { code: 'STORAGE_NOT_CONFIGURED', message: 'Storage service is not configured' },
      });
    }

    const data = await request.file();
    if (!data) {
      return reply.code(400).send({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      });
    }

    try {
      const buffer = await data.toBuffer();

      // Security: Validate uploaded file
      const validation = validateUploadedFile(buffer, data.filename, data.mimetype, 'audio', request);
      if (!validation.valid) {
        return reply.code(400).send({
          success: false,
          error: { code: 'INVALID_FILE', message: validation.error || 'File validation failed' },
        });
      }

      const result = await storageService.uploadAudio(
        buffer,
        data.mimetype,
        validation.sanitizedFilename,
        request.user!.userId
      );

      securityLogger.uploadSuccess(request, 'audio', buffer.length);

      return {
        success: true,
        data: {
          url: result.url,
          key: result.key,
          contentType: result.contentType,
          size: result.size,
        },
      };
    } catch (error) {
      app.log.error({ error }, 'Audio upload failed');
      return reply.code(400).send({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Upload failed',
        },
      });
    }
  });

  /**
   * POST /uploads/drawing
   * Upload a drawing/art (separate from profile images)
   * Used for onboarding sketches and user art
   */
  app.post('/drawing', {
    preHandler: authMiddleware,
  }, async (request, reply) => {
    if (!storageService.isConfigured()) {
      return reply.code(503).send({
        success: false,
        error: { code: 'STORAGE_NOT_CONFIGURED', message: 'Storage service is not configured' },
      });
    }

    const data = await request.file();
    if (!data) {
      return reply.code(400).send({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      });
    }

    try {
      const buffer = await data.toBuffer();

      // Security: Validate uploaded file
      const validation = validateUploadedFile(buffer, data.filename, data.mimetype, 'image', request);
      if (!validation.valid) {
        return reply.code(400).send({
          success: false,
          error: { code: 'INVALID_FILE', message: validation.error || 'File validation failed' },
        });
      }

      // Upload to drawings folder (separate from profiles)
      const result = await storageService.uploadFile(
        buffer,
        data.mimetype,
        validation.sanitizedFilename,
        request.user!.userId,
        'drawings' // Separate folder for drawings
      );

      securityLogger.uploadSuccess(request, 'image', buffer.length);

      // Update user's drawing URL (NOT profile images!)
      await prisma.user.update({
        where: { id: request.user!.userId },
        data: { drawingUrl: result.url },
      });

      return {
        success: true,
        data: {
          url: result.url,
          key: result.key,
        },
      };
    } catch (error) {
      app.log.error({ error }, 'Drawing upload failed');
      return reply.code(400).send({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Upload failed',
        },
      });
    }
  });

  /**
   * POST /uploads/video
   * Upload video content (for responses/tasks)
   */
  app.post('/video', {
    preHandler: authMiddleware,
  }, async (request, reply) => {
    if (!storageService.isConfigured()) {
      return reply.code(503).send({
        success: false,
        error: { code: 'STORAGE_NOT_CONFIGURED', message: 'Storage service is not configured' },
      });
    }

    const data = await request.file();
    if (!data) {
      return reply.code(400).send({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      });
    }

    try {
      const buffer = await data.toBuffer();

      // Security: Validate uploaded file
      const validation = validateUploadedFile(buffer, data.filename, data.mimetype, 'video', request);
      if (!validation.valid) {
        return reply.code(400).send({
          success: false,
          error: { code: 'INVALID_FILE', message: validation.error || 'File validation failed' },
        });
      }

      // Upload to videos folder
      const result = await storageService.uploadFile(
        buffer,
        data.mimetype,
        validation.sanitizedFilename,
        request.user!.userId,
        'videos'
      );

      securityLogger.uploadSuccess(request, 'video', buffer.length);

      return {
        success: true,
        data: {
          url: result.url,
          key: result.key,
          contentType: data.mimetype,
          size: buffer.length,
        },
      };
    } catch (error) {
      app.log.error({ error }, 'Video upload failed');
      return reply.code(400).send({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Upload failed',
        },
      });
    }
  });

  /**
   * POST /uploads/response-media
   * Upload media for mission responses (images, etc.)
   * Separate from profile images to avoid mixing content
   */
  app.post('/response-media', {
    preHandler: authMiddleware,
  }, async (request, reply) => {
    if (!storageService.isConfigured()) {
      return reply.code(503).send({
        success: false,
        error: { code: 'STORAGE_NOT_CONFIGURED', message: 'Storage service is not configured' },
      });
    }

    const data = await request.file();
    if (!data) {
      return reply.code(400).send({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      });
    }

    try {
      const buffer = await data.toBuffer();

      // Security: Validate uploaded file
      const validation = validateUploadedFile(buffer, data.filename, data.mimetype, 'image', request);
      if (!validation.valid) {
        return reply.code(400).send({
          success: false,
          error: { code: 'INVALID_FILE', message: validation.error || 'File validation failed' },
        });
      }

      // Upload to responses folder (NOT profiles!)
      const result = await storageService.uploadFile(
        buffer,
        data.mimetype,
        validation.sanitizedFilename,
        request.user!.userId,
        'responses'
      );

      securityLogger.uploadSuccess(request, 'image', buffer.length);

      return {
        success: true,
        data: {
          url: result.url,
          key: result.key,
          contentType: data.mimetype,
          size: buffer.length,
        },
      };
    } catch (error) {
      app.log.error({ error }, 'Response media upload failed');
      return reply.code(400).send({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Upload failed',
        },
      });
    }
  });

  /**
   * GET /uploads/presigned-url
   * Get a presigned URL for direct browser upload
   */
  app.get('/presigned-url', {
    preHandler: authMiddleware,
    schema: {
      description: 'Get presigned URL for direct browser upload',
      tags: ['uploads'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['folder', 'fileName', 'contentType'],
        properties: {
          folder: { type: 'string', enum: ['profiles', 'stories', 'audio', 'responses'] },
          fileName: { type: 'string' },
          contentType: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    if (!storageService.isConfigured()) {
      return reply.code(503).send({
        success: false,
        error: { code: 'STORAGE_NOT_CONFIGURED', message: 'Storage service is not configured' },
      });
    }

    try {
      const query = presignedUrlQuerySchema.parse(request.query);

      const result = await storageService.getPresignedUploadUrl(
        query.folder,
        query.fileName,
        query.contentType,
        request.user!.userId
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      app.log.error({ error }, 'Presigned URL generation failed');
      return reply.code(400).send({
        success: false,
        error: {
          code: 'PRESIGN_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate presigned URL',
        },
      });
    }
  });
};
