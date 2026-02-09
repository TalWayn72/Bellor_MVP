/**
 * Stories Type Definitions
 * Types, interfaces, and constants for the stories system
 */

import { MediaType } from '@prisma/client';

export interface CreateStoryInput {
  userId: string;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
}

// Story duration in hours
export const STORY_DURATION_HOURS = 24;
