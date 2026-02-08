/**
 * Admin Service
 * Handles admin-specific API calls
 * Analytics methods are in ./admin/adminAnalytics.ts
 */

import { apiClient } from '../client/apiClient';
import { adminAnalyticsService } from './admin/adminAnalytics';

interface AdminUserListParams {
  limit?: number;
  offset?: number;
  search?: string;
  isBlocked?: boolean;
  isPremium?: boolean;
  isAdmin?: boolean;
  sortBy?: string;
  sortOrder?: string;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

interface AdminUserListResponse {
  users: unknown[];
  pagination: Pagination;
}

interface UserActionData {
  userId: string;
  action: string;
  reason?: string;
}

interface ReportActionData {
  reportId: string;
  action: string;
  notes?: string;
}

interface AdminReportListParams {
  limit?: number;
  offset?: number;
  status?: string;
  reason?: string;
}

interface AdminReportListResponse {
  reports: unknown[];
  pagination: Pagination;
}

interface AchievementData {
  name: string;
  description: string;
  icon?: string;
  xpReward?: number;
  [key: string]: unknown;
}

export const adminService = {
  // ============ Re-export Analytics ============
  ...adminAnalyticsService,

  // ============ User Management ============

  async listUsers(params: AdminUserListParams = {}): Promise<AdminUserListResponse> {
    const response = await apiClient.get('/admin/users', { params });
    return response.data as AdminUserListResponse;
  },

  async userAction(data: UserActionData): Promise<unknown> {
    const response = await apiClient.post('/admin/users/action', data);
    return response.data;
  },

  async blockUser(userId: string, reason: string): Promise<unknown> {
    return this.userAction({ userId, action: 'block', reason });
  },

  async unblockUser(userId: string): Promise<unknown> {
    return this.userAction({ userId, action: 'unblock' });
  },

  async makeAdmin(userId: string): Promise<unknown> {
    return this.userAction({ userId, action: 'make_admin' });
  },

  async removeAdmin(userId: string): Promise<unknown> {
    return this.userAction({ userId, action: 'remove_admin' });
  },

  async makePremium(userId: string): Promise<unknown> {
    return this.userAction({ userId, action: 'make_premium' });
  },

  async removePremium(userId: string): Promise<unknown> {
    return this.userAction({ userId, action: 'remove_premium' });
  },

  // ============ Report Management ============

  async listReports(params: AdminReportListParams = {}): Promise<AdminReportListResponse> {
    const response = await apiClient.get('/admin/reports', { params });
    return response.data as AdminReportListResponse;
  },

  async reportAction(data: ReportActionData): Promise<unknown> {
    const response = await apiClient.post('/admin/reports/action', data);
    return response.data;
  },

  async reviewReport(reportId: string, notes: string): Promise<unknown> {
    return this.reportAction({ reportId, action: 'review', notes });
  },

  async actionTakenReport(reportId: string, notes: string): Promise<unknown> {
    return this.reportAction({ reportId, action: 'action_taken', notes });
  },

  async dismissReport(reportId: string, notes: string): Promise<unknown> {
    return this.reportAction({ reportId, action: 'dismiss', notes });
  },

  // ============ Message Moderation ============

  async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete(`/admin/messages/${messageId}`);
  },

  // ============ Achievements ============

  async createAchievement(data: AchievementData): Promise<unknown> {
    const response = await apiClient.post('/admin/achievements', data);
    return response.data;
  },

  // ============ Maintenance ============

  async cleanupStories(): Promise<unknown> {
    const response = await apiClient.post('/admin/cleanup/stories');
    return response.data;
  },
};
