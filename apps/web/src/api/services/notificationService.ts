/**
 * Notification Service
 * Handles all notification-related API calls
 */

import { apiClient } from '../client/apiClient';
import { validateRequiredId } from '../utils/validation';
import { isDemoId } from '@/data/demoData';

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

interface NotificationListParams {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}

interface Notification {
  id: string;
  type?: string;
  is_read: boolean;
  [key: string]: unknown;
}

interface NotificationListResponse {
  notifications: Notification[];
  pagination?: Pagination;
}

interface UnreadCountResponse {
  count: number;
}

interface MarkAsReadResponse {
  notification: Notification;
  demo?: boolean;
}

interface MarkAllReadResponse {
  count: number;
}

interface DeleteNotificationResponse {
  message: string;
}

interface DeleteReadResponse {
  count: number;
}

export const notificationService = {
  async getNotifications(params: NotificationListParams = {}): Promise<NotificationListResponse> {
    const response = await apiClient.get('/notifications', { params });
    return response.data as NotificationListResponse;
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data as UnreadCountResponse;
  },

  async markAsRead(notificationId: string): Promise<MarkAsReadResponse> {
    if (isDemoId(notificationId)) {
      return { notification: { id: notificationId, is_read: true }, demo: true };
    }

    validateRequiredId(notificationId, 'notificationId', 'markAsRead');

    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data as MarkAsReadResponse;
  },

  async markAllAsRead(): Promise<MarkAllReadResponse> {
    const response = await apiClient.post('/notifications/read-all');
    return response.data as MarkAllReadResponse;
  },

  async deleteNotification(notificationId: string): Promise<DeleteNotificationResponse> {
    validateRequiredId(notificationId, 'notificationId', 'deleteNotification');

    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data as DeleteNotificationResponse;
  },

  async deleteReadNotifications(): Promise<DeleteReadResponse> {
    const response = await apiClient.delete('/notifications/read');
    return response.data as DeleteReadResponse;
  },
};
