import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { userService, reportService, chatService, responseService } from '@/api';
import { Users, Flag, MessageSquare, Activity } from 'lucide-react';
import { createPageUrl } from '@/utils';
import LayoutAdmin from '../components/admin/LayoutAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/states';
import DashboardCards from '@/components/admin/DashboardCards';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await userService.searchUsers({ limit: 1000 })).users || [],
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => { try { return (await reportService.listReports({ limit: 100 })).reports || []; } catch { return []; } },
  });

  const { data: chats = [] } = useQuery({
    queryKey: ['admin-chats'],
    queryFn: async () => (await chatService.getChats({ limit: 1000 })).chats || [],
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['admin-responses'],
    queryFn: async () => (await responseService.listResponses({ limit: 1000 })).responses || [],
  });

  const blockedUsers = users.filter(u => u.is_blocked).length;
  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const temporaryChats = chats.filter(c => c.is_temporary).length;
  const permanentChats = chats.filter(c => c.is_permanent).length;

  const statsCards = [
    { title: 'Total Users', value: users.length, subtitle: `${blockedUsers} blocked`, icon: Users, color: 'bg-blue-500', onClick: () => navigate(createPageUrl('AdminUserManagement')) },
    { title: 'Pending Reports', value: pendingReports, subtitle: `out of ${reports.length} total`, icon: Flag, color: 'bg-red-500', onClick: () => navigate(createPageUrl('AdminReportManagement') + '?status=pending') },
    { title: 'Active Chats', value: chats.filter(c => c.status === 'active').length, subtitle: `${temporaryChats} temporary, ${permanentChats} permanent`, icon: MessageSquare, color: 'bg-green-500', onClick: () => navigate(createPageUrl('AdminChatMonitoring')) },
    { title: 'Total Responses', value: responses.length, subtitle: 'responses in system', icon: Activity, color: 'bg-purple-500', onClick: () => navigate(createPageUrl('AdminActivityMonitoring')) },
  ];

  return (
    <LayoutAdmin>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">General system overview</p>
        </div>

        <DashboardCards statsCards={statsCards} />

        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {reports.slice(0, 5).map((report) => (
              <Card key={report.id} variant="interactive" className="cursor-pointer"
                onClick={() => navigate(createPageUrl(`AdminReportManagement?reportId=${report.id}`))}>
                <CardContent className="p-4 flex items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Flag className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">New report received</p>
                    <p className="text-xs text-muted-foreground">
                      {report.reason} - {new Date(report.created_date).toLocaleDateString('en-US')}
                    </p>
                  </div>
                  <Badge variant={report.status === 'pending' ? 'warning' : 'success'}>{report.status}</Badge>
                </CardContent>
              </Card>
            ))}
            {reports.length === 0 && (
              <EmptyState variant="notifications" title="No recent activity" description="No reports have been received yet." />
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutAdmin>
  );
}
