/**
 * Reports Type Definitions
 * Types and interfaces for the reports system
 */

import { ReportReason, ReportStatus, ContentType } from '@prisma/client';

export interface CreateReportInput {
  reporterId: string;
  reportedUserId: string;
  reason: ReportReason;
  description?: string;
  contentType?: ContentType;
  contentId?: string;
}

export interface ListReportsParams {
  status?: ReportStatus;
  reason?: ReportReason;
  limit?: number;
  offset?: number;
}

export interface ReviewReportInput {
  reviewerId: string;
  status: ReportStatus;
  reviewNotes?: string;
  blockUser?: boolean;
}
