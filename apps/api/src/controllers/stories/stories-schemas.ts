/**
 * Stories Schemas
 * Type definitions for stories endpoints
 */

import { MediaType } from '@prisma/client';

export interface CreateStoryBody {
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
}

export interface ListStoriesQuery {
  limit?: number;
  offset?: number;
}
