/**
 * Response Utils
 * Shared includes, types, and helper constants for response queries
 */

import { ResponseType } from '@prisma/client';

export interface CreateResponseInput {
  userId: string;
  missionId?: string;
  responseType: ResponseType;
  content: string;
  textContent?: string;
  thumbnailUrl?: string;
  duration?: number;
  isPublic?: boolean;
}

export interface ListResponsesParams {
  limit: number;
  offset: number;
  userId?: string;
  missionId?: string;
  responseType?: ResponseType;
  isPublic?: boolean;
}

/** Standard user select for response includes */
export const RESPONSE_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  profileImages: true,
} as const;

/** Standard mission select for response includes */
export const RESPONSE_MISSION_SELECT = {
  id: true,
  title: true,
  missionType: true,
} as const;

/** Standard include for response queries */
export const RESPONSE_INCLUDE = {
  user: { select: RESPONSE_USER_SELECT },
  mission: { select: RESPONSE_MISSION_SELECT },
} as const;
