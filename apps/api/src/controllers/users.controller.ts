import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { UsersService } from '../services/users.service.js';
import { logger } from '../lib/logger.js';
import { securityLogger } from '../security/logger.js';
import { listUsersQuerySchema, updateProfileSchema, updateLanguageSchema, searchQuerySchema } from './users/users-schemas.js';
import { UsersDataController } from './users/users-data.controller.js';

// Re-export sub-modules for backward compatibility
export { UsersDataController } from './users/users-data.controller.js';
export * from './users/users-schemas.js';

export class UsersController {
  // Delegate data/GDPR handlers
  static getUserStats = UsersDataController.getUserStats;
  static exportUserData = UsersDataController.exportUserData;
  static deleteUserGDPR = UsersDataController.deleteUserGDPR;

  /** GET /users - List users with pagination and filters */
  static async listUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = listUsersQuerySchema.parse(request.query);
      const result = await UsersService.listUsers({
        limit: query.limit, offset: query.offset,
        sortBy: query.sortBy, sortOrder: query.sortOrder,
        isBlocked: query.isBlocked, isPremium: query.isPremium,
        language: query.language,
      });
      return reply.code(200).send({ success: true, data: result.users, pagination: result.pagination });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: error.errors } });
      }
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while fetching users' } });
    }
  }

  /** GET /users/:id - Get user by ID */
  static async getUserById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const user = await UsersService.getUserById(id);
      return reply.code(200).send({ success: true, data: user });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return reply.code(404).send({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      }
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while fetching user' } });
    }
  }

  /** PATCH /users/:id - Update user profile */
  static async updateUserProfile(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const requestBody = request.body as Record<string, any>;

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

  /** PATCH /users/:id/language - Update user language preference */
  static async updateUserLanguage(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      if (request.user?.userId !== id) {
        securityLogger.accessDenied(request, 'users.updateUserLanguage');
        return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'You can only update your own language preference' } });
      }
      const body = updateLanguageSchema.parse(request.body);
      const updatedUser = await UsersService.updateUserLanguage(id, body.language);
      return reply.code(200).send({ success: true, data: updatedUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid language', details: error.errors } });
      }
      if (error instanceof Error && error.message === 'User not found') {
        return reply.code(404).send({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      }
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while updating language' } });
    }
  }

  /** GET /users/search - Search users by name or email */
  static async searchUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = searchQuerySchema.parse(request.query);
      const result = await UsersService.searchUsers({ query: query.q, limit: query.limit, offset: query.offset });
      return reply.code(200).send({ success: true, data: result.users, pagination: result.pagination });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: error.errors } });
      }
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while searching users' } });
    }
  }

  /** DELETE /users/:id - Deactivate user (soft delete) */
  static async deactivateUser(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      if (request.user?.userId !== id) {
        securityLogger.accessDenied(request, 'users.deactivateUser');
        return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'You can only deactivate your own account' } });
      }
      const result = await UsersService.deactivateUser(id);
      return reply.code(200).send({ success: true, data: result });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return reply.code(404).send({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      }
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred while deactivating user' } });
    }
  }
}
