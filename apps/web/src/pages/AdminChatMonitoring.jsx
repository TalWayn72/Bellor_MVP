import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { chatService } from '@/api';
import { MessageSquare, Clock, Check, Flag, ExternalLink } from 'lucide-react';
import { createPageUrl } from '@/utils';
import LayoutAdmin from '../components/admin/LayoutAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ListSkeleton, EmptyState } from '@/components/states';

export default function AdminChatMonitoring() {
  const navigate = useNavigate();
  
  // Fetch all chats
  const { data: chats = [], isLoading } = useQuery({
    queryKey: ['admin-chats'],
    queryFn: async () => {
      const result = await chatService.getChats({ limit: 1000 });
      return result.chats || [];
    },
  });

  // Calculate chat metrics
  const temporaryChats = chats.filter(c => c.is_temporary && !c.is_permanent).length;
  const convertedChats = chats.filter(c => c.is_converted_to_permanent || c.is_permanent).length;
  const reportedChats = chats.filter(c => c.reported_count > 0).length;
  const activeChats = chats.filter(c => c.status === 'active').length;

  const chartData = [
    { name: 'Temporary Chats', value: temporaryChats, color: '#fbbf24' },
    { name: 'Converted to Permanent', value: convertedChats, color: '#10b981' },
    { name: 'Reported', value: reportedChats, color: '#ef4444' },
  ];

  const conversionRate = chats.length > 0 
    ? ((convertedChats / chats.length) * 100).toFixed(1)
    : 0;

  return (
    <LayoutAdmin>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Chat Monitoring</h1>
          <p className="text-muted-foreground">Analysis of temporary and permanent chats</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-info" />
                </div>
                <span className="text-sm text-muted-foreground">Total Chats</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{chats.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <span className="text-sm text-muted-foreground">Temporary</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{temporaryChats}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-success" />
                </div>
                <span className="text-sm text-muted-foreground">Converted to Permanent</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{convertedChats}</p>
              <p className="text-xs text-muted-foreground mt-1">{conversionRate}% conversion</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Flag className="w-5 h-5 text-destructive" />
                </div>
                <span className="text-sm text-muted-foreground">Reported</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{reportedChats}</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Chat Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
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

        {/* Chats List */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border">
            <CardTitle>Chat List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <ListSkeleton count={5} />
            ) : chats.length === 0 ? (
              <EmptyState
                variant="messages"
                title="No chats yet"
                description="No chats have been created in the system."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Users</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Reports</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {chats.slice(0, 50).map((chat) => (
                      <tr key={chat.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => navigate(createPageUrl(`PrivateChat?chatId=${chat.id}`))}>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {chat.otherUser?.id?.substring(0, 8) || '?'}... ↔ You
                        </td>
                        <td className="px-6 py-4">
                          {chat.is_permanent || chat.is_converted_to_permanent ? (
                            <Badge variant="success">Permanent</Badge>
                          ) : (
                            <Badge variant="warning">Temporary</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={
                            chat.status === 'active' ? 'info' :
                            chat.status === 'expired' ? 'secondary' :
                            chat.status === 'blocked' ? 'destructive' :
                            'warning'
                          }>
                            {chat.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {chat.reported_count > 0 ? (
                            <Badge variant="destructive">{chat.reported_count}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(chat.created_date).toLocaleDateString('en-US')}
                        </td>
                      </tr>
                    ))}
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