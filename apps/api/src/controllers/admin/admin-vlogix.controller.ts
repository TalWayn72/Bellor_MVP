/**
 * Admin Vlogix AI handlers
 */

import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const vlogixUserResponsesParamsSchema = z.object({
  userId: z.string().min(1),
});

const vlogixUserResponsesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
});

export async function listVlogixUserResponses(
  request: FastifyRequest<{
    Params: { userId: string };
    Querystring: { limit?: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { userId } = vlogixUserResponsesParamsSchema.parse(request.params);
    const { limit } = vlogixUserResponsesQuerySchema.parse(request.query);

    const responses = await prisma.response.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        missionId: true,
        responseType: true,
        content: true,
        textContent: true,
        createdAt: true,
      },
    });

    return reply.send({ success: true, data: responses });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid Vlogix response query', details: error.errors },
      });
    }

    request.log.error({ error }, 'Failed to list Vlogix user responses');
    return reply.code(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to list Vlogix user responses' },
    });
  }
}
