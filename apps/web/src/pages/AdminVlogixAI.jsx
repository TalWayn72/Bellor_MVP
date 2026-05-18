import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/api';
import { ListSkeleton } from '@/components/states';
import VlogixUserDetailDialog from '@/components/admin/vlogix/VlogixUserDetailDialog';
import VlogixUsersTable, { getResponseCount } from '@/components/admin/vlogix/VlogixUsersTable';
import LayoutAdmin from '../components/admin/LayoutAdmin';

export default function AdminVlogixAI() {
  const [selectedUser, setSelectedUser] = React.useState(null);
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-vlogix-users'],
    queryFn: async () => {
      const result = await adminService.listUsers({ limit: 500 });
      return result.data?.users || result.users || [];
    },
  });

  const sortedUsers = [...users].sort((a, b) => getResponseCount(b) - getResponseCount(a));

  return (
    <LayoutAdmin>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Vlogix AI</h1>
          <p className="text-muted-foreground">User behavioral baseline overview</p>
        </div>

        {isLoading ? (
          <ListSkeleton count={5} />
        ) : (
          <VlogixUsersTable users={sortedUsers} onViewUser={setSelectedUser} />
        )}

        <VlogixUserDetailDialog
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      </div>
    </LayoutAdmin>
  );
}
