import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatService } from '@/api';
import { MessageSquare, Clock, Check, Flag } from 'lucide-react';
import LayoutAdmin from '../components/admin/LayoutAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import MonitoredChatList from '@/components/admin/MonitoredChatList';

export default function AdminChatMonitoring() {
  const { data: chats = [], isLoading } = useQuery({
    queryKey: ['admin-chats'],
    queryFn: async () => {
      const result = await chatService.getChats({ limit: 1000 });
      return result.chats || [];
    },
  });

  const temporaryChats = chats.filter(c => c.is_temporary && !c.is_permanent).length;
  const convertedChats = chats.filter(c => c.is_converted_to_permanent || c.is_permanent).length;
  const reportedChats = chats.filter(c => c.reported_count > 0).length;

  const chartData = [
    { name: 'Temporary Chats', value: temporaryChats, color: '#fbbf24' },
    { name: 'Converted to Permanent', value: convertedChats, color: '#10b981' },
    { name: 'Reported', value: reportedChats, color: '#ef4444' },
  ];

  const conversionRate = chats.length > 0
    ? ((convertedChats / chats.length) * 100).toFixed(1) : 0;

  const statCards = [
    { icon: MessageSquare, label: 'Total Chats', value: chats.length, color: 'bg-info/10', iconColor: 'text-info' },
    { icon: Clock, label: 'Temporary', value: temporaryChats, color: 'bg-warning/10', iconColor: 'text-warning' },
    { icon: Check, label: 'Converted to Permanent', value: convertedChats, color: 'bg-success/10', iconColor: 'text-success', subtitle: `${conversionRate}% conversion` },
    { icon: Flag, label: 'Reported', value: reportedChats, color: 'bg-destructive/10', iconColor: 'text-destructive' },
  ];

  return (
    <LayoutAdmin>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Chat Monitoring</h1>
          <p className="text-muted-foreground">Analysis of temporary and permanent chats</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                {stat.subtitle && <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardHeader><CardTitle>Chat Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80} fill="#8884d8" dataKey="value">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border">
            <CardTitle>Chat List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <MonitoredChatList chats={chats} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </LayoutAdmin>
  );
}
