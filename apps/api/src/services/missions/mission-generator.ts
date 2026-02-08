/**
 * Mission Generator
 * Mission generation/selection logic - finding today's mission
 */

import { prisma } from '../../lib/prisma.js';
import { cacheGet, cacheSet, CacheKey, CacheTTL } from '../../lib/cache.js';

/** Standard include for mission queries */
export const MISSION_INCLUDE = {
  _count: {
    select: { responses: true },
  },
} as const;

/**
 * Get today's active mission (or find an available one)
 */
export async function getTodaysMission() {
  const cached = await cacheGet<any>(CacheKey.missionToday());
  if (cached) return cached;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  // Find today's daily mission
  let mission = await prisma.mission.findFirst({
    where: {
      missionType: 'DAILY',
      activeFrom: { gte: startOfDay },
      activeUntil: { lte: endOfDay },
    },
    include: MISSION_INCLUDE,
  });

  // If no daily mission exists, find any active mission
  if (!mission) {
    mission = await prisma.mission.findFirst({
      where: {
        OR: [
          { activeFrom: null, activeUntil: null },
          { activeFrom: { lte: now }, activeUntil: { gte: now } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: MISSION_INCLUDE,
    });
  }

  if (mission) {
    await cacheSet(CacheKey.missionToday(), mission, CacheTTL.MISSION_TODAY);
  }

  return mission;
}
