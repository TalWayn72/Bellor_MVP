import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { MissionsService } from '../services/missions.service.js';

// Validation schemas
const createMissionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  missionType: z.enum(['DAILY', 'WEEKLY', 'SPECIAL', 'ICE_BREAKER']),
  difficulty: z.number().int().min(1).max(5).optional().default(1),
  xpReward: z.number().int().min(0).optional().default(10),
  activeFrom: z.string().datetime().optional().transform(s => s ? new Date(s) : undefined),
  activeUntil: z.string().datetime().optional().transform(s => s ? new Date(s) : undefined),
});

const updateMissionSchema = createMissionSchema.partial();

const listMissionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  type: z.enum(['DAILY', 'WEEKLY', 'SPECIAL', 'ICE_BREAKER']).optional(),
  isActive: z.coerce.boolean().optional(),
});

export class MissionsController {
  /**
   * POST /missions
   * Create a new mission (admin only)
   */
  static async createMission(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createMissionSchema.parse(request.body);

      const mission = await MissionsService.createMission(data);

      return reply.code(201).send({
        success: true,
        data: mission,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: error.errors,
          },
        });
      }

      request.log.error({ error }, 'Error creating mission');
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while creating the mission',
        },
      });
    }
  }

  /**
   * GET /missions
   * List missions with pagination
   */
  static async listMissions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = listMissionsQuerySchema.parse(request.query);

      const result = await MissionsService.listMissions({
        limit: query.limit,
        offset: query.offset,
        type: query.type,
        isActive: query.isActive,
      });

      return reply.code(200).send({
        success: true,
        data: result.missions,
        pagination: result.pagination,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors,
          },
        });
      }

      request.log.error({ error }, 'Error listing missions');
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching missions',
        },
      });
    }
  }

  /**
   * GET /missions/today
   * Get today's active mission
   */
  static async getTodaysMission(request: FastifyRequest, reply: FastifyReply) {
    try {
      const mission = await MissionsService.getTodaysMission();

      if (!mission) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NO_ACTIVE_MISSION',
            message: 'No active mission for today',
          },
        });
      }

      return reply.code(200).send({
        success: true,
        data: mission,
      });
    } catch (error) {
      request.log.error({ error }, 'Error getting today\'s mission');
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching today\'s mission',
        },
      });
    }
  }

  /**
   * GET /missions/:id
   * Get mission by ID
   */
  static async getMissionById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      const mission = await MissionsService.getMissionById(id);

      return reply.code(200).send({
        success: true,
        data: mission,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Mission not found') {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'MISSION_NOT_FOUND',
            message: 'Mission not found',
          },
        });
      }

      request.log.error({ error }, 'Error getting mission');
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching the mission',
        },
      });
    }
  }

  /**
   * PATCH /missions/:id
   * Update a mission (admin only)
   */
  static async updateMission(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const data = updateMissionSchema.parse(request.body);

      const mission = await MissionsService.updateMission(id, data);

      return reply.code(200).send({
        success: true,
        data: mission,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: error.errors,
          },
        });
      }

      request.log.error({ error }, 'Error updating mission');
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating the mission',
        },
      });
    }
  }

  /**
   * DELETE /missions/:id
   * Delete a mission (admin only)
   */
  static async deleteMission(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      await MissionsService.deleteMission(id);

      return reply.code(200).send({
        success: true,
        message: 'Mission deleted successfully',
      });
    } catch (error) {
      request.log.error({ error }, 'Error deleting mission');
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while deleting the mission',
        },
      });
    }
  }
}
