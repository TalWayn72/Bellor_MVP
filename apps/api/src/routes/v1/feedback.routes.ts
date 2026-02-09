/**
 * Feedback Routes
 * API endpoints for user feedback submissions
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { FeedbackService } from '../../services/feedback.service.js';

const createFeedbackSchema = z.object({
  type: z.enum(['improvement', 'bug', 'feature', 'other']),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  rating: z.number().int().min(1).max(5).optional(),
});

export default async function feedbackRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware);

  // Create feedback (any authenticated user)
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const result = createFeedbackSchema.safeParse(request.body);
    if (!result.success) {
      return reply.code(400).send({ success: false, error: 'Invalid feedback data' });
    }

    const feedback = await FeedbackService.createFeedback({
      userId: request.user!.userId,
      ...result.data,
    });

    return reply.code(201).send({ success: true, feedback });
  });

  // List feedback (admin only)
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user?.isAdmin) {
      return reply.code(403).send({ success: false, error: 'Admin access required' });
    }

    const { status, limit, offset } = request.query as Record<string, string>;
    const feedbacks = await FeedbackService.listFeedback({
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    return reply.code(200).send({ success: true, ...feedbacks });
  });
}
