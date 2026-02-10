import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService, userService, responseService, adminService } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LayoutAdmin from '../components/admin/LayoutAdmin';
import { ListSkeleton, EmptyState } from '@/components/states';
import ReportCard from '@/components/admin/reports/ReportCard';
import { useToast } from '@/components/ui/use-toast';

export default function AdminReportManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [reportedContent, setReportedContent] = useState({});

  useEffect(() => {
    const statusParam = searchParams.get('status');
    const reportIdParam = searchParams.get('reportId');
    if (statusParam) setFilterStatus(statusParam);
    if (reportIdParam) setSelectedReport(reportIdParam);
  }, [searchParams]);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      try { const result = await reportService.listReports(); return result.reports || []; }
      catch { return []; }
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ reportId, status }) => await reportService.reviewReport(reportId, { action: status.toUpperCase() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-reports'] }); setSelectedReport(null); },
  });

  const blockUserMutation = useMutation({
    mutationFn: async ({ userId }) => await userService.blockUser(userId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-reports'] }); toast({ title: 'Success', description: 'User blocked successfully' }); },
  });

  const deleteContentMutation = useMutation({
    mutationFn: async ({ contentType, contentId }) => {
      if (contentType === 'response') return await responseService.deleteResponse(contentId);
      if (contentType === 'message') return await adminService.deleteMessage(contentId);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-reports'] }); toast({ title: 'Success', description: 'Content deleted successfully' }); },
    onError: (error) => { toast({ title: 'Error', description: `Failed to delete content: ${error?.message || 'Unknown error'}`, variant: 'destructive' }); },
  });

  const filteredReports = reports.filter(r => filterStatus === 'all' || r.status === filterStatus);

  const handleUpdateStatus = (reportId, newStatus) => updateStatusMutation.mutate({ reportId, status: newStatus });

  const fetchReportedContent = async (report) => {
    if (reportedContent[report.id]) return reportedContent[report.id];
    try {
      let content = null;
      if (report.reported_content_type === 'response') {
        const result = await responseService.getResponseById(report.reported_content_id);
        content = result.data;
      }
      setReportedContent(prev => ({ ...prev, [report.id]: content }));
      return content;
    } catch (error) { console.error('Error fetching reported content:', error); return null; }
  };

  const statusFilters = [
    { key: 'all', label: 'All', count: reports.length },
    { key: 'pending', label: 'Pending', count: reports.filter(r => r.status === 'pending').length },
    { key: 'reviewed', label: 'Reviewed', count: reports.filter(r => r.status === 'reviewed').length },
    { key: 'action_taken', label: 'Action Taken', count: reports.filter(r => r.status === 'action_taken').length },
    { key: 'dismissed', label: 'Dismissed', count: reports.filter(r => r.status === 'dismissed').length },
  ];

  return (
    <LayoutAdmin>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Report Management</h1>
          <p className="text-muted-foreground">All reports received in the system</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2 flex-wrap">
              {statusFilters.map(({ key, label, count }) => (
                <Button key={key} variant={filterStatus === key ? 'default' : 'outline'} onClick={() => setFilterStatus(key)} size="sm">
                  {label} ({count})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {isLoading ? <ListSkeleton count={5} /> : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                isExpanded={selectedReport === report.id}
                content={reportedContent[report.id]}
                onToggleExpand={setSelectedReport}
                onFetchContent={fetchReportedContent}
                onUpdateStatus={handleUpdateStatus}
                onBlockUser={(userId) => blockUserMutation.mutate({ userId })}
                onDeleteContent={(contentType, contentId) => deleteContentMutation.mutate({ contentType, contentId })}
                updateStatusPending={updateStatusMutation.isPending}
                blockUserPending={blockUserMutation.isPending}
                deleteContentPending={deleteContentMutation.isPending}
              />
            ))}
            {filteredReports.length === 0 && (
              <EmptyState variant="notifications" title="No reports to display" description="There are no reports matching your filter criteria." />
            )}
          </div>
        )}
      </div>
    </LayoutAdmin>
  );
}
