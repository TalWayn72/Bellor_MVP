import { Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/states';

export default function VlogixUsersTable({ users, onViewUser }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted border-b border-border">
            <tr>
              <HeaderCell>User</HeaderCell>
              <HeaderCell>Email</HeaderCell>
              <HeaderCell className="text-center">Response Count</HeaderCell>
              <HeaderCell>Has Baseline</HeaderCell>
              <HeaderCell>Actions</HeaderCell>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <VlogixUserRow key={user.id} user={user} onView={() => onViewUser(user)} />
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <EmptyState
          variant="search"
          title="No users found"
          description="No users are available for Vlogix AI review yet."
        />
      )}
    </Card>
  );
}

export const getResponseCount = (user) => user.response_count ?? user.responseCount ?? 0;

function HeaderCell({ children, className = 'text-left' }) {
  return <th className={`px-6 py-4 text-xs font-medium text-muted-foreground uppercase ${className}`}>{children}</th>;
}

function VlogixUserRow({ user, onView }) {
  const responseCount = getResponseCount(user);
  const hasBaseline = responseCount >= 5;
  const displayName = user.full_name || user.nickname || user.email || 'Unknown User';
  const nickname = user.nickname || user.first_name || 'User';

  return (
    <tr className="hover:bg-muted/50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.profile_images?.[0] || `https://i.pravatar.cc/150?u=${user.id}`} alt={displayName} />
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-foreground">{displayName}</div>
            <div className="text-sm text-muted-foreground">{nickname}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground">{user.email || 'Unknown'}</td>
      <td className="px-6 py-4 text-center text-sm text-foreground">{responseCount}</td>
      <td className="px-6 py-4">
        <Badge variant={hasBaseline ? 'success' : 'warning'}>
          {hasBaseline ? 'Baseline Ready' : 'Insufficient Data'}
        </Badge>
      </td>
      <td className="px-6 py-4">
        <Button variant="outline" size="sm" onClick={onView} className="text-gray-600 hover:text-gray-700">
          <Eye className="w-4 h-4 ml-1" />View
        </Button>
      </td>
    </tr>
  );
}
