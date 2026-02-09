/**
 * Security Events Routes
 * Receives client-side security events (auth redirects, access denied) for server logging
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { securityLogger } from '../../security/logger.js';
import { optionalAuthMiddleware } from '../../middleware/auth.middleware.js';

const clientEventSchema = z.object({
  eventType: z.enum(['auth_redirect', 'admin_denied', 'token_cleared', 'auth_check_failed', 'render_crash']),
  attemptedRoute: z.string().max(200),
  redirectedTo: z.string().max(200),
  reason: z.string().max(500),
  userId: z.string().max(100).optional(),
  userFields: z.record(z.unknown()).optional(),
  timestamp: z.string().optional(),
});

export default async function securityEventsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', optionalAuthMiddleware);

  app.post('/client-event', async (request: FastifyRequest, reply: FastifyReply) => {
    const result = clientEventSchema.safeParse(request.body);
    if (!result.success) {
      return reply.code(400).send({ success: false, error: 'Invalid event data' });
    }

    const { eventType, attemptedRoute, redirectedTo, reason, userId, userFields } = result.data;

    const details = {
      attemptedRoute,
      redirectedTo,
      reason,
      reportedUserId: userId,
      authenticatedUserId: request.user?.userId,
      userFields,
    };

    if (eventType === 'admin_denied') {
      securityLogger.clientAdminDenied(request, details);
    } else if (eventType === 'render_crash') {
      securityLogger.suspiciousActivity(request, `Client render crash: ${reason}`);
    } else if (eventType === 'token_cleared' || eventType === 'auth_check_failed') {
      securityLogger.clientAuthRedirect(request, { ...details, severity: 'warning' });
    } else {
      securityLogger.clientAuthRedirect(request, details);
    }

    return reply.code(200).send({ success: true });
  });
}
