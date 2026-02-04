import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { userService, reportService, chatService, responseService } from '@/api';
import { Users, Flag, MessageSquare, Activity, TrendingUp } from 'lucide-react';
import { createPageUrl } from '@/utils';
import LayoutAdmin from '../components/admin/LayoutAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardsSkeleton, EmptyState } from '@/components/states';

/**
 * Admin Dashboard - Overview of key metrics
 */
export default function AdminDashboard() {
  const navigate = useNavigate();

  // Fetch users count
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const result = await userService.searchUsers({ limit: 1000 });
      return result.users || [];
    },
  });

  // Fetch reports count
  const { data: reports = [] } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      try {
        const result = await reportService.listReports({ limit: 100 });
        return result.reports || [];
      } catch (error) {
        return [];
      }
    },
  });

  // Fetch chats count
  const { data: chats = [] } = useQuery({
    queryKey: ['admin-chats'],
    queryFn: async () => {
      const result = await chatService.getChats({ limit: 1000 });
      return result.chats || [];
    },
  });

  // Fetch responses count
  const { data: responses = [] } = useQuery({
    queryKey: ['admin-responses'],
    queryFn: async () => {
      const result = await responseService.listResponses({ limit: 1000 });
      return result.responses || [];
    },
  });

  // Calculate metrics
  const totalUsers = users.length;
  const blockedUsers = users.filter(u => u.is_blocked).length;
  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const activeChats = chats.filter(c => c.status === 'active').length;
  const temporaryChats = chats.filter(c => c.is_temporary).length;
  const permanentChats = chats.filter(c => c.is_permanent).length;

  const statsCards = [
    {
      title: 'Total Users',
      value: totalUsers,
      subtitle: `${blockedUsers} blocked`,
      icon: Users,
      color: 'bg-blue-500',
      onClick: () => navigate(createPageUrl('AdminUserManagement')),
    },
    {
      title: 'Pending Reports',
      value: pendingReports,
      subtitle: `out of ${reports.length} total`,
      icon: Flag,
      color: 'bg-red-500',
      onClick: () => navigate(createPageUrl('AdminReportManagement?status=pending')),
    },
    {
      title: 'Active Chats',
      value: activeChats,
      subtitle: `${temporaryChats} temporary, ${permanentChats} permanent`,
      icon: MessageSquare,
      color: 'bg-green-500',
      onClick: () => navigate(createPageUrl('AdminChatMonitoring')),
    },
    {
      title: 'Total Responses',
      value: responses.length,
      subtitle: 'responses in system',
      icon: Activity,
      color: 'bg-purple-500',
      onClick: () => navigate(createPageUrl('AdminActivityMonitoring')),
    },
  ];

  return (
    <LayoutAdmin>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">General system overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat) => (
            <Card
              key={stat.title}
              variant="interactive"
              className="cursor-pointer"
              onClick={stat.onClick}
            >
              <CardContent className="p-6 text-left">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</h3>
                <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reports.slice(0, 5).map((report) => (
              <Card
                key={report.id}
                variant="interactive"
                className="cursor-pointer"
                onClick={() => navigate(createPageUrl(`AdminReportManagement?reportId=${report.id}`))}
              >
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
                  <Badge variant={report.status === 'pending' ? 'warning' : 'success'}>
                    {report.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {reports.length === 0 && (
              <EmptyState
                variant="notifications"
                title="No recent activity"
                description="No reports have been received yet."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutAdmin>
  );
}
