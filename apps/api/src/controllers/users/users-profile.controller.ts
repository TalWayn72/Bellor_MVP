/**
 * Users Profile Controller
 * Handles user profile update operations
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { UsersService } from '../../services/users.service.js';
import { logger } from '../../lib/logger.js';
import { securityLogger } from '../../security/logger.js';
import { updateProfileSchema } from './users-schemas.js';

export class UsersProfileController {
  /** PATCH /users/:id - Update user profile */
  static async updateUserProfile(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const requestBody = request.body as Record<string, unknown>;

    logger.info('USER_UPDATE', `Starting profile update for user ${id}`, {
      userId: id, requestUserId: request.user?.userId,
      fieldsProvided: Object.keys(requestBody || {}),
      dateFields: { birthDate: requestBody?.birthDate, date_of_birth: requestBody?.date_of_birth },
    });

    try {
      if (request.user?.userId !== id) {
        logger.warn('USER_UPDATE', 'Forbidden: user trying to update another profile', { userId: id, requestUserId: request.user?.userId });
        securityLogger.accessDenied(request, 'users.updateUserProfile');
        return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'You can only update your own profile' } });
      }

      logger.debug('USER_UPDATE', 'Validating input with Zod schema', { body: requestBody });
      const body = updateProfileSchema.parse(request.body);
      logger.debug('USER_UPDATE', 'Zod validation passed', { validatedBody: body });

      const updatedUser = await UsersService.updateUserProfile(id, body);
      logger.info('USER_UPDATE', `Profile updated successfully for user ${id}`, { userId: id, updatedFields: Object.keys(body) });
      return reply.code(200).send({ success: true, data: updatedUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('USER_UPDATE', 'Zod validation failed', { userId: id, errors: error.errors, receivedBody: requestBody });
        return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } });
      }
      if (error instanceof Error && error.message === 'User not found') {
        logger.warn('USER_UPDATE', 'User not found', { userId: id });
        return reply.code(404).send({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      }
      logger.error('USER_UPDATE', `Failed to update profile for user ${id}`, error as Error, { userId: id, requestBody });
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while updating profile' } });
    }
  }
}
