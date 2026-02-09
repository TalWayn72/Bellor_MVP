import { FastifyRequest, FastifyReply } from 'fastify';
import { UsersService } from '../../services/users.service.js';
import { securityLogger } from '../../security/logger.js';

function notFoundError(reply: FastifyReply) {
  return reply.code(404).send({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
}

function forbiddenError(reply: FastifyReply, msg: string) {
  return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: msg } });
}

function serverError(reply: FastifyReply, msg: string) {
  return reply.code(500).send({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: msg } });
}

/** Privacy/GDPR/stats/export handlers for users */
export class UsersDataController {
  /** GET /users/:id/stats - Get user statistics */
  static async getUserStats(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      if (request.user?.userId !== id) {
        securityLogger.accessDenied(request, 'usersData.getUserStats');
        return forbiddenError(reply, 'You can only view your own statistics');
      }
      const stats = await UsersService.getUserStats(id);
      return reply.code(200).send({ success: true, data: stats });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return notFoundError(reply);
      }
      return serverError(reply, 'An error occurred while fetching user statistics');
    }
  }

  /** GET /users/:id/export - GDPR Data Export */
  static async exportUserData(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      if (request.user?.userId !== id) {
        securityLogger.accessDenied(request, 'usersData.exportUserData');
        return forbiddenError(reply, 'You can only export your own data');
      }
      const exportData = await UsersService.exportUserData(id);
      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', `attachment; filename="bellor-data-export-${id}.json"`);
      return reply.code(200).send({
        success: true, exportedAt: new Date().toISOString(), data: exportData,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return notFoundError(reply);
      }
      return serverError(reply, 'An error occurred while exporting data');
    }
  }

  /** DELETE /users/:id/gdpr - GDPR Right to Erasure */
  static async deleteUserGDPR(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      if (request.user?.userId !== id) {
        securityLogger.accessDenied(request, 'usersData.deleteUserGDPR');
        return forbiddenError(reply, 'You can only delete your own data');
      }
      await UsersService.deleteUserGDPR(id);
      return reply.code(200).send({
        success: true,
        message: 'All your data has been permanently deleted in accordance with GDPR Article 17',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return notFoundError(reply);
      }
      return serverError(reply, 'An error occurred while deleting data');
    }
  }
}
