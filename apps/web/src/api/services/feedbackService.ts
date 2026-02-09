/**
 * Feedback Service - Frontend API client
 */

import { apiClient } from '../client/apiClient';

interface FeedbackInput {
  type: string;
  title: string;
  description: string;
  rating?: number;
}

export const feedbackService = {
  async submitFeedback(data: FeedbackInput) {
    const response = await apiClient.post('/api/v1/feedback', data);
    return response.data;
  },
};
