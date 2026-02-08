/**
 * Likes Schemas
 * Type definitions for likes endpoints
 */

import { LikeType } from '@prisma/client';

export interface LikeUserBody {
  targetUserId: string;
  likeType?: LikeType;
}

export interface LikeResponseBody {
  responseId: string;
}

export interface ListLikesQuery {
  limit?: number;
  offset?: number;
  likeType?: LikeType;
}
