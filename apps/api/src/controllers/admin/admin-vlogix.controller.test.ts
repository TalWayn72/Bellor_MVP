import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { listVlogixUserResponses } from './admin-vlogix.controller.js';
import { prisma } from '../../lib/prisma.js';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    response: {
      findMany: vi.fn(),
    },
  },
}));

describe('[P1][admin] Vlogix admin controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists selected user responses ordered newest first with a default limit', async () => {
    const responses = [
      {
        id: 'response-1',
        missionId: 'mission-1',
        responseType: 'TEXT',
        content: 'Response content',
        textContent: 'Response text',
        createdAt: new Date('2026-05-18T12:00:00Z'),
      },
    ];
    (prisma.response.findMany as Mock).mockResolvedValue(responses);

    const request = {
      params: { userId: 'user-1' },
      query: {},
    };
    const reply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    await listVlogixUserResponses(request as never, reply as never);

    expect(prisma.response.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        missionId: true,
        responseType: true,
        content: true,
        textContent: true,
        createdAt: true,
      },
    });
    expect(reply.send).toHaveBeenCalledWith({
      success: true,
      data: responses,
    });
  });
});
