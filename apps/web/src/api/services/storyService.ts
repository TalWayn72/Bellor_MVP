/**
 * Story Service
 * Handles all story-related API calls (24-hour ephemeral content)
 */

import { apiClient } from '../client/apiClient';
import { validateUserId, validateRequiredId, validateDataObject } from '../utils/validation';
import { isDemoUser, getDemoStories } from '@/data/demoData';
import { transformStory } from '@/utils';

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

interface PaginationParams {
  limit?: number;
  offset?: number;
}

interface Story {
  id: string;
  user_id?: string;
  media_url?: string;
  media_type?: string;
  caption?: string;
  duration?: number;
  [key: string]: unknown;
}

interface StoryFeedResponse {
  stories: Story[];
  pagination?: Pagination;
}

interface MyStoriesResponse {
  stories: Story[];
}

interface StoryStatsResponse {
  stats: unknown;
}

interface CreateStoryData {
  mediaUrl: string;
  mediaType: string;
  caption?: string;
  duration?: number;
}

interface CreateStoryResponse {
  story: Story;
}

interface StoriesByUserResponse {
  stories: Story[];
}

interface StoryByIdResponse {
  story: Story;
}

interface ViewStoryResponse {
  message: string;
}

interface DeleteStoryResponse {
  message: string;
}

interface CleanupResponse {
  deletedCount: number;
}

function transformStories(stories: unknown[]): Story[] {
  if (!Array.isArray(stories)) return [];
  return stories.map(transformStory) as Story[];
}

export const storyService = {
  async getFeed(params: PaginationParams = {}): Promise<StoryFeedResponse> {
    const response = await apiClient.get('/stories/feed', { params });
    const result = response.data as StoryFeedResponse;
    return { ...result, stories: transformStories(result.stories || []) };
  },

  async getMyStories(): Promise<MyStoriesResponse> {
    const response = await apiClient.get('/stories/my');
    const result = response.data as MyStoriesResponse;
    return { ...result, stories: transformStories(result.stories || []) };
  },

  async getStats(): Promise<StoryStatsResponse> {
    const response = await apiClient.get('/stories/stats');
    return response.data as StoryStatsResponse;
  },

  async createStory(data: CreateStoryData): Promise<CreateStoryResponse> {
    validateDataObject(data, 'createStory');

    const response = await apiClient.post('/stories', data);
    return response.data as CreateStoryResponse;
  },

  async getStoriesByUser(userId: string): Promise<StoriesByUserResponse> {
    if (isDemoUser(userId)) {
      const stories = (getDemoStories() as Story[]).filter(s => s.user_id === userId);
      return { stories };
    }

    validateUserId(userId, 'getStoriesByUser');

    const response = await apiClient.get(`/stories/user/${userId}`);
    const result = response.data as StoriesByUserResponse;
    return { ...result, stories: transformStories(result.stories || []) };
  },

  async getStoryById(storyId: string): Promise<StoryByIdResponse> {
    validateRequiredId(storyId, 'storyId', 'getStoryById');

    const response = await apiClient.get(`/stories/${storyId}`);
    const result = response.data as StoryByIdResponse;
    return { ...result, story: transformStory(result.story) as Story };
  },

  async viewStory(storyId: string): Promise<ViewStoryResponse> {
    validateRequiredId(storyId, 'storyId', 'viewStory');

    const response = await apiClient.post(`/stories/${storyId}/view`);
    return response.data as ViewStoryResponse;
  },

  async deleteStory(storyId: string): Promise<DeleteStoryResponse> {
    validateRequiredId(storyId, 'storyId', 'deleteStory');

    const response = await apiClient.delete(`/stories/${storyId}`);
    return response.data as DeleteStoryResponse;
  },

  async cleanup(): Promise<CleanupResponse> {
    const response = await apiClient.post('/stories/cleanup');
    return response.data as CleanupResponse;
  },
};
