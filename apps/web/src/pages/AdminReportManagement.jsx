import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService, userService, responseService, chatService } from '@/api';
import { Flag, Eye, CheckCircle, XCircle, ExternalLink, Ban, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LayoutAdmin from '../components/admin/LayoutAdmin';
import { ListSkeleton, EmptyState } from '@/components/states';

export default function AdminReportManagement() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [reportedContent, setReportedContent] = useState({});

  // Get URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get('status');
    const reportIdParam = params.get('reportId');

    if (statusParam) {
      setFilterStatus(statusParam);
    }

    if (reportIdParam) {
      setSelectedReport(reportIdParam);
    }
  }, []);

  // Fetch all reports
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      try {
        const result = await reportService.listReports();
        return result.reports || [];
      } catch (error) {
        return [];
      }
    },
  });

  // Update report status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ reportId, status }) => {
      return await reportService.reviewReport(reportId, { action: status.toUpperCase() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      setSelectedReport(null);
    },
  });

  // Block user mutation
  const blockUserMutation = useMutation({
    mutationFn: async ({ userId }) => {
      return await userService.blockUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      alert('User blocked successfully');
    },
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async ({ contentType, contentId }) => {
      if (contentType === 'response') {
        return await responseService.deleteResponse(contentId);
      } else if (contentType === 'message') {
        // Message deletion would require chatService method
        console.warn('Message deletion not implemented');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      alert('Content deleted successfully');
    },
  });

  const filteredReports = reports.filter(report => {
    if (filterStatus === 'all') return true;
    return report.status === filterStatus;
  });

  const handleUpdateStatus = (reportId, newStatus) => {
    updateStatusMutation.mutate({ reportId, status: newStatus });
  };

  // Fetch reported content
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
    } catch (error) {
      console.error('Error fetching reported content:', error);
      return null;
    }
  };

  return (
    <LayoutAdmin>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Report Management</h1>
          <p className="text-muted-foreground">All reports received in the system</p>
        </div>

        {/* Status Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                All ({reports.length})
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('pending')}
                size="sm"
              >
                Pending ({reports.filter(r => r.status === 'pending').length})
              </Button>
              <Button
                variant={filterStatus === 'reviewed' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('reviewed')}
                size="sm"
              >
                Reviewed ({reports.filter(r => r.status === 'reviewed').length})
              </Button>
              <Button
                variant={filterStatus === 'action_taken' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('action_taken')}
                size="sm"
              >
                Action Taken ({reports.filter(r => r.status === 'action_taken').length})
              </Button>
              <Button
                variant={filterStatus === 'dismissed' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('dismissed')}
                size="sm"
              >
                Dismissed ({reports.filter(r => r.status === 'dismissed').length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {isLoading ? (
          <ListSkeleton count={5} />
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const content = reportedContent[report.id];
              const isExpanded = selectedReport === report.id;

              return (
                <Card key={report.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                          <Flag className="w-6 h-6 text-destructive" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            Report on {report.reported_content_type}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(report.created_date).toLocaleString('en-US')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        report.status === 'pending' ? 'warning' :
                        report.status === 'reviewed' ? 'info' :
                        report.status === 'action_taken' ? 'success' :
                        'secondary'
                      }>
                        {report.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Reporter:</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{report.reporter_id.substring(0, 12)}...</p>
                          <button
                            onClick={() => window.open(`#/AdminUserManagement?userId=${report.reporter_id}`, '_blank')}
                            className="text-info hover:text-info/80"
                          >
                            <User className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Reported User:</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{report.reported_user_id.substring(0, 12)}...</p>
                          <button
                            onClick={() => window.open(`#/AdminUserManagement?userId=${report.reported_user_id}`, '_blank')}
                            className="text-info hover:text-info/80"
                          >
                            <User className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Reason:</p>
                        <p className="text-sm font-medium text-foreground">{report.reason}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Priority:</p>
                        <p className="text-sm font-medium text-foreground">{report.priority || 1}</p>
                      </div>
                    </div>

                    {report.description && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      </div>
                    )}

                  {/* View Content Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (isExpanded) {
                        setSelectedReport(null);
                      } else {
                        setSelectedReport(report.id);
                        fetchReportedContent(report);
                      }
                    }}
                    className="mb-4"
                  >
                    <ExternalLink className="w-4 h-4 ml-1" />
                    {isExpanded ? 'Hide Content' : 'Show Reported Content'}
                  </Button>

                    {/* Reported Content Display */}
                    {isExpanded && content && (
                      <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <h4 className="text-sm font-semibold text-destructive mb-2">Reported Content:</h4>
                        {content.response_type === 'text' || content.text_content ? (
                          <p className="text-sm text-foreground">{content.text_content || content.content}</p>
                        ) : content.response_type === 'voice' || content.message_type === 'voice' ? (
                          <audio src={content.content} controls className="w-full mt-2" />
                        ) : content.response_type === 'video' ? (
                          <video src={content.content} controls className="w-full mt-2 max-h-64" />
                        ) : content.response_type === 'drawing' || content.message_type === 'drawing' ? (
                          <img src={content.content} alt="Drawing" className="w-full mt-2 max-h-64 object-contain" />
                        ) : (
                          <p className="text-sm text-muted-foreground">Cannot display this content</p>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(report.id, 'reviewed')}
                        disabled={updateStatusMutation.isPending || report.status === 'reviewed'}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Mark as Reviewed
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to block the reported user?')) {
                            blockUserMutation.mutate({ userId: report.reported_user_id });
                            handleUpdateStatus(report.id, 'action_taken');
                          }
                        }}
                        disabled={blockUserMutation.isPending}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Block User
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete the reported content?')) {
                            deleteContentMutation.mutate({
                              contentType: report.reported_content_type,
                              contentId: report.reported_content_id
                            });
                            handleUpdateStatus(report.id, 'action_taken');
                          }
                        }}
                        disabled={deleteContentMutation.isPending}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete Content
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(report.id, 'action_taken')}
                        disabled={updateStatusMutation.isPending || report.status === 'action_taken'}
                        className="text-success hover:text-success/80"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Action Taken
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                        disabled={updateStatusMutation.isPending || report.status === 'dismissed'}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredReports.length === 0 && (
              <EmptyState
                variant="notifications"
                title="No reports to display"
                description="There are no reports matching your filter criteria."
              />
            )}
          </div>
        )}
      </div>
    </LayoutAdmin>
  );
}
