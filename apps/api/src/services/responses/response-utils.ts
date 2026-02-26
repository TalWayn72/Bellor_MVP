/**
 * Response Utils
 * Shared includes, types, and helper constants for response queries
 */

import { ResponseType } from '@prisma/client';
import { sanitizeImageUrl, sanitizeImageUrls } from '../storage/storage-utils.js';

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

/** Sanitize media URLs in a response (content, thumbnailUrl, user.profileImages) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeResponseUrls<T extends Record<string, any>>(response: T): T {
  const r = response as Record<string, any>;
  if (r.content) r.content = sanitizeImageUrl(r.content);
  if (r.thumbnailUrl) r.thumbnailUrl = sanitizeImageUrl(r.thumbnailUrl);
  if (r.user?.profileImages) {
    r.user.profileImages = sanitizeImageUrls(r.user.profileImages);
  }
  return response;
}
