import React from 'react';
import { Ban, Check, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/states';

export default function UserTable({
  users,
  onViewUser,
  onVerifyToggle,
  onRoleChange,
  onBlockToggle,
  verifyPending,
  rolePending,
  blockPending,
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Role</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Verified</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Activity</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onView={() => onViewUser(user)}
                onVerify={() => onVerifyToggle(user)}
                onRole={() => onRoleChange(user)}
                onBlock={() => onBlockToggle(user)}
                verifyPending={verifyPending}
                rolePending={rolePending}
                blockPending={blockPending}
              />
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <EmptyState
          variant="search"
          title="No users found"
          description="Try adjusting your search or filters to find users."
        />
      )}
    </Card>
  );
}

function UserRow({ user, onView, onVerify, onRole, onBlock, verifyPending, rolePending, blockPending }) {
  return (
    <tr className="hover:bg-muted/50">
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
            <div className="text-sm text-muted-foreground">{user.nickname}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
      <td className="px-6 py-4">
        <Badge variant={user.is_admin ? 'premium' : 'info'}>
          {user.is_admin ? 'admin' : 'user'}
        </Badge>
      </td>
      <td className="px-6 py-4">
        {user.is_verified ? (
          <Badge variant="success"><Check className="w-3 h-3 ml-1" />Verified</Badge>
        ) : (
          <Badge variant="secondary">Not Verified</Badge>
        )}
      </td>
      <td className="px-6 py-4">
        {user.is_blocked ? (
          <Badge variant="destructive"><Ban className="w-3 h-3 ml-1" />Blocked</Badge>
        ) : (
          <Badge variant="success"><Check className="w-3 h-3 ml-1" />Active</Badge>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground">
        {user.last_active_date ? new Date(user.last_active_date).toLocaleDateString('en-US') : 'Unknown'}
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onView} className="text-gray-600 hover:text-gray-700">
            <Eye className="w-4 h-4 ml-1" />View
          </Button>
          <Button variant="outline" size="sm" onClick={onVerify} disabled={verifyPending} className="text-blue-600 hover:text-blue-700">
            {user.is_verified ? 'Unverify' : 'Verify'}
          </Button>
          <Button variant="outline" size="sm" onClick={onRole} disabled={rolePending} className="text-purple-600 hover:text-purple-700">
            {user.is_admin ? 'Remove Admin' : 'Make Admin'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onBlock}
            disabled={blockPending}
            className={user.is_blocked ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}
          >
            {user.is_blocked ? (
              <><Check className="w-4 h-4 ml-1" />Unblock</>
            ) : (
              <><Ban className="w-4 h-4 ml-1" />Blocked</>
            )}
          </Button>
        </div>
      </td>
    </tr>
  );
}
