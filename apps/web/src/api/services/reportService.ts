/**
 * Report Service
 * Handles all report-related API calls (moderation)
 */

import { apiClient } from '../client/apiClient';
import { validateUserId, validateRequiredId, validateDataObject } from '../utils/validation';

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

interface PaginationParams {
  limit?: number;
  offset?: number;
}

interface CreateReportData {
  reportedUserId?: string;
  reportedResponseId?: string;
  reason: string;
  description?: string;
}

interface Report {
  id: string;
  reason: string;
  status: string;
  [key: string]: unknown;
}

interface CreateReportResponse {
  report: Report;
}

interface PendingCountResponse {
  count: number;
}

interface StatisticsResponse {
  statistics: unknown;
}

interface ReportListParams extends PaginationParams {
  status?: string;
}

interface ReportListResponse {
  reports: Report[];
  total: number;
  pagination?: Pagination;
}

interface ReportsForUserResponse {
  reports: Report[];
  pagination?: Pagination;
}

interface ReportByIdResponse {
  report: Report;
}

interface ReviewReportData {
  action: 'DISMISSED' | 'WARNING' | 'CONTENT_REMOVED' | 'USER_BANNED';
  notes?: string;
}

interface ReviewReportResponse {
  report: Report;
}

export const reportService = {
  async createReport(data: CreateReportData): Promise<CreateReportResponse> {
    validateDataObject(data, 'createReport');

    const response = await apiClient.post('/reports', data);
    return response.data as CreateReportResponse;
  },

  async getPendingCount(): Promise<PendingCountResponse> {
    const response = await apiClient.get('/reports/pending/count');
    return response.data as PendingCountResponse;
  },

  async getStatistics(): Promise<StatisticsResponse> {
    const response = await apiClient.get('/reports/statistics');
    return response.data as StatisticsResponse;
  },

  async listReports(params: ReportListParams = {}): Promise<ReportListResponse> {
    const response = await apiClient.get('/reports', { params });
    const result = response.data as { data?: Report[]; reports?: Report[]; pagination?: Pagination };
    return {
      reports: result.data || result.reports || [],
      total: result.pagination?.total || (result.data || result.reports || []).length,
      pagination: result.pagination,
    };
  },

  async getReportsForUser(userId: string, params: PaginationParams = {}): Promise<ReportsForUserResponse> {
    validateUserId(userId, 'getReportsForUser');

    const response = await apiClient.get(`/reports/user/${userId}`, { params });
    return response.data as ReportsForUserResponse;
  },

  async getReportById(reportId: string): Promise<ReportByIdResponse> {
    validateRequiredId(reportId, 'reportId', 'getReportById');

    const response = await apiClient.get(`/reports/${reportId}`);
    return response.data as ReportByIdResponse;
  },

  async reviewReport(reportId: string, data: ReviewReportData): Promise<ReviewReportResponse> {
    validateRequiredId(reportId, 'reportId', 'reviewReport');
    validateDataObject(data, 'reviewReport');

    const response = await apiClient.patch(`/reports/${reportId}/review`, data);
    return response.data as ReviewReportResponse;
  },
};
