import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/states';

export function getActivityStatus(lastActiveDate) {
  if (!lastActiveDate) return 'inactive';
  const now = new Date();
  const lastActive = new Date(lastActiveDate);
  const daysSinceActive = (now - lastActive) / (1000 * 60 * 60 * 24);

  if (daysSinceActive <= 1) return 'highly_active';
  if (daysSinceActive <= 7) return 'active';
  if (daysSinceActive <= 30) return 'moderate';
  return 'inactive';
}

export function getStatusLabel(status) {
  switch (status) {
    case 'highly_active': return 'Highly Active';
    case 'active': return 'Active';
    case 'moderate': return 'Moderate';
    default: return 'Inactive';
  }
}

export function getStatusVariant(status) {
  switch (status) {
    case 'highly_active': return 'success';
    case 'active': return 'info';
    case 'moderate': return 'warning';
    default: return 'secondary';
  }
}

export default function ActivityFeed({ users }) {
  if (users.length === 0) {
    return (
      <EmptyState
        variant="followers"
        title="No users yet"
        description="No users have been registered in the system."
      />
    );
  }

  return (
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
          {users.map((user) => {
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
                  <Badge variant={getStatusVariant(status)}>
                    {getStatusLabel(status)}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
