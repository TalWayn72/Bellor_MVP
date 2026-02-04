import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/api';
import { Activity, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import LayoutAdmin from '../components/admin/LayoutAdmin';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ListSkeleton, EmptyState } from '@/components/states';

export default function AdminActivityMonitoring() {
  const [timeRange, setTimeRange] = useState('7days'); // 7days, 30days, all

  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-activity-users'],
    queryFn: async () => {
      const result = await userService.searchUsers({ limit: 1000 });
      return result.users || [];
    },
  });

  // Calculate activity metrics
  const now = new Date();
  const getActivityStatus = (lastActiveDate) => {
    if (!lastActiveDate) return 'inactive';
    const lastActive = new Date(lastActiveDate);
    const daysSinceActive = (now - lastActive) / (1000 * 60 * 60 * 24);
    
    if (daysSinceActive <= 1) return 'highly_active';
    if (daysSinceActive <= 7) return 'active';
    if (daysSinceActive <= 30) return 'moderate';
    return 'inactive';
  };

  const activityBreakdown = users.reduce((acc, user) => {
    const status = getActivityStatus(user.last_active_date);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const chartData = [
    { name: 'Highly Active', value: activityBreakdown.highly_active || 0 },
    { name: 'Active', value: activityBreakdown.active || 0 },
    { name: 'Moderate', value: activityBreakdown.moderate || 0 },
    { name: 'Inactive', value: activityBreakdown.inactive || 0 },
  ];

  // Sort users by activity
  const sortedUsers = [...users].sort((a, b) => {
    const aActivity = (a.response_count || 0) + (a.chat_count || 0) + (a.mission_completed_count || 0);
    const bActivity = (b.response_count || 0) + (b.chat_count || 0) + (b.mission_completed_count || 0);
    return bActivity - aActivity;
  });

  return (
    <LayoutAdmin>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Activity Monitoring</h1>
          <p className="text-muted-foreground">User activity analysis in the system</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <span className="text-sm text-muted-foreground">Highly Active</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{activityBreakdown.highly_active || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-info" />
                </div>
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{activityBreakdown.active || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-warning" />
                </div>
                <span className="text-sm text-muted-foreground">Moderate Activity</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{activityBreakdown.moderate || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Inactive</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{activityBreakdown.inactive || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Activity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Users Activity Table */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border">
            <CardTitle>User Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <ListSkeleton count={5} />
            ) : sortedUsers.length === 0 ? (
              <EmptyState
                variant="followers"
                title="No users yet"
                description="No users have been registered in the system."
              />
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Responses</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Chats</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Tasks</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Last Activity</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedUsers.map((user) => {
                    const status = getActivityStatus(user.last_active_date);
                    return (
                      <tr key={user.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                src={user.profile_images?.[0] || `https://i.pravatar.cc/150?u=${user.id}`}
                                alt={user.full_name}
                              />
                              <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-foreground">{user.full_name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-foreground">{user.response_count || 0}</td>
                        <td className="px-6 py-4 text-center text-sm text-foreground">{user.chat_count || 0}</td>
                        <td className="px-6 py-4 text-center text-sm text-foreground">{user.mission_completed_count || 0}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {user.last_active_date
                            ? new Date(user.last_active_date).toLocaleDateString('en-US')
                            : 'Unknown'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={
                            status === 'highly_active' ? 'success' :
                            status === 'active' ? 'info' :
                            status === 'moderate' ? 'warning' :
                            'secondary'
                          }>
                            {status === 'highly_active' ? 'Highly Active' :
                             status === 'active' ? 'Active' :
                             status === 'moderate' ? 'Moderate' : 'Inactive'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutAdmin>
  );
}