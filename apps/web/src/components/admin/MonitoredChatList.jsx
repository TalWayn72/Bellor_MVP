import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { ListSkeleton, EmptyState } from '@/components/states';

export default function MonitoredChatList({ chats, isLoading }) {
  const navigate = useNavigate();

  if (isLoading) {
    return <ListSkeleton count={5} />;
  }

  if (chats.length === 0) {
    return (
      <EmptyState
        variant="messages"
        title="No chats yet"
        description="No chats have been created in the system."
      />
    );
  }

  return (
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
            <tr
              key={chat.id}
              className="hover:bg-muted/50 cursor-pointer"
              onClick={() => navigate(createPageUrl(`PrivateChat?chatId=${chat.id}`))}
            >
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
                  chat.status === 'blocked' ? 'destructive' : 'warning'
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
  );
}
