import { FastifyInstance } from 'fastify';
import { storageService } from '../../services/storage.service.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { RATE_LIMITS } from '../../config/rate-limits.js';
import {
  handleProfileImageUpload, handleStoryMediaUpload, handleAudioUpload,
  handleDrawingUpload, handleVideoUpload, handleResponseMediaUpload,
} from './uploads/upload-handlers.js';
import { handlePresignedUrl, handleDeleteProfileImage } from './uploads/upload-presigned.js';

export default async function uploadsRoutes(app: FastifyInstance) {
  /** GET /uploads/status */
  app.get('/status', async () => ({
    success: true,
    data: { configured: storageService.isConfigured() },
  }));

  /** POST /uploads/profile-image */
  app.post('/profile-image', { config: { rateLimit: RATE_LIMITS.upload.files }, preHandler: authMiddleware }, handleProfileImageUpload);

  /** DELETE /uploads/profile-image */
  app.delete('/profile-image', {
    preHandler: authMiddleware,
    schema: {
      description: 'Remove a profile image',
      tags: ['uploads'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['url'],
        properties: { url: { type: 'string' } },
      },
    },
  }, handleDeleteProfileImage);

  /** POST /uploads/story-media */
  app.post('/story-media', { config: { rateLimit: RATE_LIMITS.upload.files }, preHandler: authMiddleware }, handleStoryMediaUpload);

  /** POST /uploads/audio */
  app.post('/audio', { config: { rateLimit: RATE_LIMITS.upload.files }, preHandler: authMiddleware }, handleAudioUpload);

  /** POST /uploads/drawing */
  app.post('/drawing', { config: { rateLimit: RATE_LIMITS.upload.files }, preHandler: authMiddleware }, handleDrawingUpload);

  /** POST /uploads/video */
  app.post('/video', { config: { rateLimit: RATE_LIMITS.upload.files }, preHandler: authMiddleware }, handleVideoUpload);

  /** POST /uploads/response-media */
  app.post('/response-media', { config: { rateLimit: RATE_LIMITS.upload.files }, preHandler: authMiddleware }, handleResponseMediaUpload);

  /** GET /uploads/presigned-url */
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
  }, handlePresignedUrl);
}
