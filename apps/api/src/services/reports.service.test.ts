/**
 * Reports Service Tests
 * Tests for user reports and moderation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportsService } from './reports.service.js';
import { prisma } from '../lib/prisma.js';
import { ReportReason, ReportStatus, ContentType } from '@prisma/client';

// Type the mocked prisma
const mockPrisma = prisma as unknown as {
  report: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
  };
  user: {
    update: ReturnType<typeof vi.fn>;
  };
};

// Test data factories
const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  isBlocked: false,
  ...overrides,
});

const createMockReport = (overrides: Record<string, unknown> = {}) => ({
  id: 'report-1',
  reporterId: 'user-1',
  reportedUserId: 'user-2',
  reason: ReportReason.HARASSMENT,
  description: 'Test report',
  reportedContentType: null,
  reportedContentId: null,
  priority: 4,
  status: ReportStatus.PENDING,
  reviewedBy: null,
  reviewNotes: null,
  createdAt: new Date('2024-01-01'),
  reviewedAt: null,
  reporter: createMockUser({ id: 'user-1' }),
  reportedUser: createMockUser({ id: 'user-2' }),
  ...overrides,
});

describe('ReportsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== createReport ====================
  describe('createReport', () => {
    it('should create a new report', async () => {
      const mockReport = createMockReport();
      mockPrisma.report.findFirst.mockResolvedValue(null);
      mockPrisma.report.create.mockResolvedValue(mockReport);
      mockPrisma.report.count.mockResolvedValue(1);

      const result = await ReportsService.createReport({
        reporterId: 'user-1',
        reportedUserId: 'user-2',
        reason: ReportReason.HARASSMENT,
        description: 'Test report',
      });

      expect(mockPrisma.report.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reporterId: 'user-1',
          reportedUserId: 'user-2',
          reason: ReportReason.HARASSMENT,
          priority: 4,
        }),
        include: expect.anything(),
      });
      expect(result).toEqual(mockReport);
    });

    it('should throw error if already reported same user for same reason recently', async () => {
      mockPrisma.report.findFirst.mockResolvedValue(createMockReport());

      await expect(
        ReportsService.createReport({
          reporterId: 'user-1',
          reportedUserId: 'user-2',
          reason: ReportReason.HARASSMENT,
        })
      ).rejects.toThrow('You have already reported this user for this reason recently');
    });

    it('should calculate correct priority for different reasons', async () => {
      mockPrisma.report.findFirst.mockResolvedValue(null);
      mockPrisma.report.create.mockResolvedValue(createMockReport());
      mockPrisma.report.count.mockResolvedValue(1);

      await ReportsService.createReport({
        reporterId: 'user-1',
        reportedUserId: 'user-2',
        reason: ReportReason.UNDERAGE,
      });

      expect(mockPrisma.report.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          priority: 5, // Highest priority for UNDERAGE
        }),
        include: expect.anything(),
      });
    });
  });

  // ==================== getReportById ====================
  describe('getReportById', () => {
    it('should return report when found', async () => {
      const mockReport = createMockReport();
      mockPrisma.report.findUnique.mockResolvedValue(mockReport);

      const result = await ReportsService.getReportById('report-1');

      expect(result).toEqual(mockReport);
    });

    it('should throw error when report not found', async () => {
      mockPrisma.report.findUnique.mockResolvedValue(null);

      await expect(ReportsService.getReportById('non-existent')).rejects.toThrow('Report not found');
    });
  });

  // ==================== listReports ====================
  describe('listReports', () => {
    it('should return reports with pagination', async () => {
      const mockReports = [
        createMockReport({ id: 'report-1' }),
        createMockReport({ id: 'report-2' }),
      ];
      mockPrisma.report.findMany.mockResolvedValue(mockReports);
      mockPrisma.report.count.mockResolvedValue(2);

      const result = await ReportsService.listReports({});

      expect(result.reports).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by status', async () => {
      mockPrisma.report.findMany.mockResolvedValue([]);
      mockPrisma.report.count.mockResolvedValue(0);

      await ReportsService.listReports({ status: ReportStatus.PENDING });

      expect(mockPrisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ReportStatus.PENDING },
        })
      );
    });

    it('should filter by reason', async () => {
      mockPrisma.report.findMany.mockResolvedValue([]);
      mockPrisma.report.count.mockResolvedValue(0);

      await ReportsService.listReports({ reason: ReportReason.SPAM });

      expect(mockPrisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { reason: ReportReason.SPAM },
        })
      );
    });

    it('should use custom pagination', async () => {
      mockPrisma.report.findMany.mockResolvedValue([]);
      mockPrisma.report.count.mockResolvedValue(0);

      await ReportsService.listReports({ limit: 10, offset: 5 });

      expect(mockPrisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 10,
        })
      );
    });
  });

  // ==================== getPendingCount ====================
  describe('getPendingCount', () => {
    it('should return count of pending reports', async () => {
      mockPrisma.report.count.mockResolvedValue(5);

      const result = await ReportsService.getPendingCount();

      expect(result).toBe(5);
      expect(mockPrisma.report.count).toHaveBeenCalledWith({
        where: { status: ReportStatus.PENDING },
      });
    });
  });

  // ==================== reviewReport ====================
  describe('reviewReport', () => {
    it('should review report', async () => {
      const mockReport = createMockReport();
      const reviewedReport = {
        ...mockReport,
        status: ReportStatus.REVIEWED,
        reviewedBy: 'admin-1',
        reviewNotes: 'Reviewed',
      };

      mockPrisma.report.findUnique.mockResolvedValue(mockReport);
      mockPrisma.report.update.mockResolvedValue(reviewedReport);

      const result = await ReportsService.reviewReport('report-1', {
        reviewerId: 'admin-1',
        status: ReportStatus.REVIEWED,
        reviewNotes: 'Reviewed',
      });

      expect(mockPrisma.report.update).toHaveBeenCalledWith({
        where: { id: 'report-1' },
        data: expect.objectContaining({
          status: ReportStatus.REVIEWED,
          reviewedBy: 'admin-1',
          reviewNotes: 'Reviewed',
          reviewedAt: expect.any(Date),
        }),
        include: expect.anything(),
      });
      expect(result.status).toBe(ReportStatus.REVIEWED);
    });

    it('should throw error when report not found', async () => {
      mockPrisma.report.findUnique.mockResolvedValue(null);

      await expect(
        ReportsService.reviewReport('non-existent', {
          reviewerId: 'admin-1',
          status: ReportStatus.REVIEWED,
        })
      ).rejects.toThrow('Report not found');
    });

    it('should block user when blockUser is true and status is ACTION_TAKEN', async () => {
      const mockReport = createMockReport();
      mockPrisma.report.findUnique.mockResolvedValue(mockReport);
      mockPrisma.report.update.mockResolvedValue({
        ...mockReport,
        status: ReportStatus.ACTION_TAKEN,
      });
      mockPrisma.user.update.mockResolvedValue({});

      await ReportsService.reviewReport('report-1', {
        reviewerId: 'admin-1',
        status: ReportStatus.ACTION_TAKEN,
        blockUser: true,
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { isBlocked: true },
      });
    });

    it('should not block user when blockUser is false', async () => {
      const mockReport = createMockReport();
      mockPrisma.report.findUnique.mockResolvedValue(mockReport);
      mockPrisma.report.update.mockResolvedValue({
        ...mockReport,
        status: ReportStatus.ACTION_TAKEN,
      });

      await ReportsService.reviewReport('report-1', {
        reviewerId: 'admin-1',
        status: ReportStatus.ACTION_TAKEN,
        blockUser: false,
      });

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ==================== getReportsForUser ====================
  describe('getReportsForUser', () => {
    it('should return reports for a specific user', async () => {
      const mockReports = [createMockReport()];
      mockPrisma.report.findMany.mockResolvedValue(mockReports);

      const result = await ReportsService.getReportsForUser('user-2');

      expect(result).toHaveLength(1);
      expect(mockPrisma.report.findMany).toHaveBeenCalledWith({
        where: { reportedUserId: 'user-2' },
        include: expect.anything(),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ==================== getStatistics ====================
  describe('getStatistics', () => {
    it('should return report statistics', async () => {
      mockPrisma.report.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(50) // pending
        .mockResolvedValueOnce(20) // reviewed
        .mockResolvedValueOnce(20) // action taken
        .mockResolvedValueOnce(10); // dismissed
      mockPrisma.report.groupBy.mockResolvedValue([
        { reason: ReportReason.HARASSMENT, _count: { reason: 30 } },
        { reason: ReportReason.SPAM, _count: { reason: 20 } },
      ]);

      const result = await ReportsService.getStatistics();

      expect(result.total).toBe(100);
      expect(result.byStatus.pending).toBe(50);
      expect(result.byReason[ReportReason.HARASSMENT]).toBe(30);
    });
  });

  // ==================== calculatePriority ====================
  describe('calculatePriority', () => {
    it('should return 5 for UNDERAGE', () => {
      expect(ReportsService.calculatePriority(ReportReason.UNDERAGE)).toBe(5);
    });

    it('should return 4 for HARASSMENT', () => {
      expect(ReportsService.calculatePriority(ReportReason.HARASSMENT)).toBe(4);
    });

    it('should return 3 for INAPPROPRIATE_CONTENT', () => {
      expect(ReportsService.calculatePriority(ReportReason.INAPPROPRIATE_CONTENT)).toBe(3);
    });

    it('should return 2 for FAKE_PROFILE', () => {
      expect(ReportsService.calculatePriority(ReportReason.FAKE_PROFILE)).toBe(2);
    });

    it('should return 1 for SPAM', () => {
      expect(ReportsService.calculatePriority(ReportReason.SPAM)).toBe(1);
    });

    it('should return 1 for OTHER', () => {
      expect(ReportsService.calculatePriority(ReportReason.OTHER)).toBe(1);
    });
  });

  // ==================== checkAutoBlock ====================
  describe('checkAutoBlock', () => {
    it('should auto-block user when threshold reached', async () => {
      mockPrisma.report.count.mockResolvedValue(5); // At threshold
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.report.updateMany.mockResolvedValue({ count: 3 });

      const result = await ReportsService.checkAutoBlock('user-2');

      expect(result).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { isBlocked: true },
      });
      expect(mockPrisma.report.updateMany).toHaveBeenCalledWith({
        where: {
          reportedUserId: 'user-2',
          status: ReportStatus.PENDING,
        },
        data: expect.objectContaining({
          status: ReportStatus.ACTION_TAKEN,
        }),
      });
    });

    it('should not auto-block user when below threshold', async () => {
      mockPrisma.report.count.mockResolvedValue(4); // Below threshold

      const result = await ReportsService.checkAutoBlock('user-2');

      expect(result).toBe(false);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });
});
