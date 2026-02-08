import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, responseService } from '@/api';
import LayoutAdmin from '@/components/admin/LayoutAdmin';
import { ListSkeleton } from '@/components/states';
import UserFilters from '@/components/admin/users/UserFilters';
import UserTable from '@/components/admin/users/UserTable';
import UserDetailModal from '@/components/admin/users/UserDetailModal';

export default function AdminUserManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get('status');
    if (statusParam) setFilterStatus(statusParam);
  }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: async () => {
      const result = await userService.searchUsers({ limit: 500 });
      return result.users || [];
    },
  });

  const blockMutation = useMutation({
    mutationFn: async ({ userId, isBlocked }) => {
      return isBlocked ? await userService.blockUser(userId) : await userService.unblockUser(userId);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-all-users'] }); alert('Status updated successfully!'); },
    onError: (error) => { alert('Error updating status: ' + (error.message || 'Try again later')); },
  });

  const roleChangeMutation = useMutation({
    mutationFn: async ({ userId, newRole }) => await userService.updateProfile(userId, { role: newRole }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-all-users'] }); alert('Role updated successfully!'); },
    onError: (error) => { alert('Error updating role: ' + (error.message || 'Try again later')); },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ userId, isVerified }) => await userService.updateProfile(userId, { is_verified: isVerified }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-all-users'] }); alert('Status updated successfully!'); },
    onError: (error) => { alert('Error updating verification: ' + (error.message || 'Try again later')); },
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nickname?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'blocked' && user.is_blocked) ||
      (filterStatus === 'active' && !user.is_blocked);
    return matchesSearch && matchesStatus;
  });

  const { data: userResponses = [] } = useQuery({
    queryKey: ['admin-user-responses', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser?.id) return [];
      const result = await responseService.listResponses({ userId: selectedUser.id });
      return result.data || [];
    },
    enabled: !!selectedUser?.id,
  });

  const handleBlockToggle = (user) => {
    if (window.confirm(`Are you sure you want to ${user.is_blocked ? 'unblock' : 'block'} ${user.full_name || user.email}?`)) {
      blockMutation.mutate({ userId: user.id, isBlocked: !user.is_blocked });
    }
  };

  const handleRoleChange = (user) => {
    const newRole = user.is_admin ? 'user' : 'admin';
    if (window.confirm(`Are you sure you want to change ${user.full_name || user.email} to ${newRole}?`)) {
      roleChangeMutation.mutate({ userId: user.id, newRole });
    }
  };

  const handleVerifyToggle = (user) => {
    if (window.confirm(`Are you sure you want to ${user.is_verified ? 'unverify' : 'verify'} ${user.full_name || user.email}?`)) {
      verifyMutation.mutate({ userId: user.id, isVerified: !user.is_verified });
    }
  };

  return (
    <LayoutAdmin>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
          <p className="text-muted-foreground">List of all users in the system</p>
        </div>

        <UserFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          users={users}
        />

        {isLoading ? (
          <ListSkeleton count={5} />
        ) : (
          <UserTable
            users={filteredUsers}
            onViewUser={setSelectedUser}
            onVerifyToggle={handleVerifyToggle}
            onRoleChange={handleRoleChange}
            onBlockToggle={handleBlockToggle}
            verifyPending={verifyMutation.isPending}
            rolePending={roleChangeMutation.isPending}
            blockPending={blockMutation.isPending}
          />
        )}

        <UserDetailModal
          user={selectedUser}
          userResponses={userResponses}
          onClose={() => setSelectedUser(null)}
        />
      </div>
    </LayoutAdmin>
  );
}
