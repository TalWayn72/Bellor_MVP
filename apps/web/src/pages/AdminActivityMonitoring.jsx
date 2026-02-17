import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/api';
import { Activity, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LayoutAdmin from '../components/admin/LayoutAdmin';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ListSkeleton } from '@/components/states';
import ActivityFeed, { getActivityStatus } from '@/components/admin/ActivityFeed';

export default function AdminActivityMonitoring() {

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-activity-users'],
    queryFn: async () => {
      const result = await userService.searchUsers({ limit: 1000 });
      return result.users || [];
    },
  });

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

  const sortedUsers = [...users].sort((a, b) => {
    const aActivity = (a.response_count || 0) + (a.chat_count || 0) + (a.mission_completed_count || 0);
    const bActivity = (b.response_count || 0) + (b.chat_count || 0) + (b.mission_completed_count || 0);
    return bActivity - aActivity;
  });

  return (
    <LayoutAdmin>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Activity Monitoring</h1>
          <p className="text-muted-foreground">User activity analysis in the system</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Highly Active', value: activityBreakdown.highly_active || 0, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
            { label: 'Active', value: activityBreakdown.active || 0, icon: Activity, color: 'text-info', bg: 'bg-info/10' },
            { label: 'Moderate Activity', value: activityBreakdown.moderate || 0, icon: Users, color: 'text-warning', bg: 'bg-warning/10' },
            { label: 'Inactive', value: activityBreakdown.inactive || 0, icon: Users, color: 'text-muted-foreground', bg: 'bg-muted' },
          ].map((stat, i) => (
            <Card key={i}><CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </CardContent></Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardHeader><CardTitle>Activity Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis />
                <Tooltip /><Legend /><Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border"><CardTitle>User Activity</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? <ListSkeleton count={5} /> : <ActivityFeed users={sortedUsers} />}
          </CardContent>
        </Card>
      </div>
    </LayoutAdmin>
  );
}
