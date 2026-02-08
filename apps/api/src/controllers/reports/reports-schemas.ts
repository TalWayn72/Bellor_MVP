/**
 * Reports Schemas
 * Type definitions for reports endpoints
 */

import { ReportReason, ReportStatus, ContentType } from '@prisma/client';

export interface CreateReportBody {
  reportedUserId: string;
  reason: ReportReason;
  description?: string;
  contentType?: ContentType;
  contentId?: string;
}

export interface ListReportsQuery {
  status?: ReportStatus;
  reason?: ReportReason;
  limit?: number;
  offset?: number;
}

export interface ReviewReportBody {
  status: ReportStatus;
  reviewNotes?: string;
  blockUser?: boolean;
}
