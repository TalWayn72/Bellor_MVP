import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, responseService } from '@/api';
import { Search, Ban, Check, Eye, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LayoutAdmin from '../components/admin/LayoutAdmin';
import { ListSkeleton, EmptyState } from '@/components/states';

export default function AdminUserManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, blocked, active
  const [selectedUser, setSelectedUser] = useState(null);

  // Get URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get('status');

    if (statusParam) {
      setFilterStatus(statusParam);
    }
  }, []);

  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: async () => {
      const result = await userService.searchUsers({ limit: 500 });
      return result.users || [];
    },
  });

  // Block/Unblock user mutation
  const blockMutation = useMutation({
    mutationFn: async ({ userId, isBlocked }) => {
      if (isBlocked) {
        return await userService.blockUser(userId);
      } else {
        return await userService.unblockUser(userId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      alert('Status updated successfully!');
    },
    onError: (error) => {
      console.error('Error blocking user:', error);
      alert('Error updating status: ' + (error.message || 'Try again later'));
    },
  });

  // Change role mutation
  const roleChangeMutation = useMutation({
    mutationFn: async ({ userId, newRole }) => {
      return await userService.updateProfile(userId, { role: newRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      alert('Role updated successfully!');
    },
    onError: (error) => {
      console.error('Error changing role:', error);
      alert('Error updating role: ' + (error.message || 'Try again later'));
    },
  });

  // Verify user mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ userId, isVerified }) => {
      return await userService.updateProfile(userId, { is_verified: isVerified });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      alert('Status updated successfully!');
    },
    onError: (error) => {
      console.error('Error verifying user:', error);
      alert('Error updating verification: ' + (error.message || 'Try again later'));
    },
  });

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.nickname?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' ||
                          (filterStatus === 'blocked' && user.is_blocked) ||
                          (filterStatus === 'active' && !user.is_blocked);

    return matchesSearch && matchesStatus;
  });

  // Fetch user responses for selected user
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
    const newRole = user.role === 'admin' ? 'user' : 'admin';
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
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
          <p className="text-muted-foreground">List of all users in the system</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search by name, email or nickname..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                  size="sm"
                >
                  All ({users.length})
                </Button>
                <Button
                  variant={filterStatus === 'active' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('active')}
                  size="sm"
                >
                  Active ({users.filter(u => !u.is_blocked).length})
                </Button>
                <Button
                  variant={filterStatus === 'blocked' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('blocked')}
                  size="sm"
                >
                  Blocked ({users.filter(u => u.is_blocked).length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        {isLoading ? (
          <ListSkeleton count={5} />
        ) : (
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
                  {filteredUsers.map((user) => (
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
                            <div className="text-sm text-muted-foreground">{user.nickname}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-6 py-4">
                        <Badge variant={user.role === 'admin' ? 'premium' : 'info'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_verified ? (
                          <Badge variant="success">
                            <Check className="w-3 h-3 ml-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            לא Verified
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.is_blocked ? (
                          <Badge variant="destructive">
                            <Ban className="w-3 h-3 ml-1" />
                            Blocked
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            <Check className="w-3 h-3 ml-1" />
                            Active
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {user.last_active_date ? (
                          new Date(user.last_active_date).toLocaleDateString('en-US')
                        ) : (
                          'Unknown'
                        )}
                      </td>
                      <td className="px-6 py-4">
                       <div className="flex gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => setSelectedUser(user)}
                           className="text-gray-600 hover:text-gray-700"
                         >
                           <Eye className="w-4 h-4 ml-1" />
                           View
                         </Button>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleVerifyToggle(user)}
                           disabled={verifyMutation.isPending}
                           className="text-blue-600 hover:text-blue-700"
                         >
                           {user.is_verified ? 'Unverify' : 'Verify'}
                         </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleChange(user)}
                            disabled={roleChangeMutation.isPending}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBlockToggle(user)}
                            disabled={blockMutation.isPending}
                            className={user.is_blocked ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}
                          >
                            {user.is_blocked ? (
                              <>
                                <Check className="w-4 h-4 ml-1" />
                                Unblock
                              </>
                            ) : (
                              <>
                                <Ban className="w-4 h-4 ml-1" />
                                Blocked
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <EmptyState
                variant="search"
                title="No users found"
                description="Try adjusting your search or filters to find users."
              />
            )}
          </Card>
        )}

        {/* User Details Modal */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="user-details-description">
            <DialogHeader>
              <DialogTitle>User Details - {selectedUser?.nickname || selectedUser?.full_name}</DialogTitle>
              <p id="user-details-description" className="text-sm text-muted-foreground">
                View and manage user information, status, and activity
              </p>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-6">
                {/* Profile Section */}
                <Card className="bg-muted">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Basic Information</h3>
                    <div className="flex gap-6">
                      <Avatar size="xl" className="w-32 h-32">
                        <AvatarImage
                          src={selectedUser.profile_images?.[0] || `https://i.pravatar.cc/150?u=${selectedUser.id}`}
                          alt={selectedUser.full_name}
                        />
                        <AvatarFallback>{selectedUser.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Full Name</p>
                            <p className="font-medium text-foreground">{selectedUser.full_name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Nickname</p>
                            <p className="font-medium text-foreground">{selectedUser.nickname || 'Not set'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium text-foreground">{selectedUser.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Age</p>
                            <p className="font-medium text-foreground">{selectedUser.age || 'Not set'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p className="font-medium text-foreground">{selectedUser.location || 'Not set'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="font-medium text-foreground">{selectedUser.phone || 'Not set'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bio Section */}
                {selectedUser.bio && (
                  <Card className="bg-muted">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-3 text-foreground">Bio</h3>
                      <p className="text-foreground leading-relaxed">{selectedUser.bio}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Interests */}
                {selectedUser.interests && selectedUser.interests.length > 0 && (
                  <Card className="bg-muted">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-3 text-foreground">Interests</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.interests.map((interest, idx) => (
                          <Badge key={idx} variant="secondary" size="lg">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Activity Stats */}
                <Card className="bg-muted">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Activity Statistics</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-foreground">{selectedUser.response_count || 0}</p>
                          <p className="text-sm text-muted-foreground">Responses</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-foreground">{selectedUser.chat_count || 0}</p>
                          <p className="text-sm text-muted-foreground">Chats</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-foreground">{selectedUser.mission_completed_count || 0}</p>
                          <p className="text-sm text-muted-foreground">Tasks</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Connection Dates */}
                <Card className="bg-muted">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Connection Report</h3>
                    <div className="space-y-3">
                      <Card>
                        <CardContent className="p-4 flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Registration Date</span>
                          <span className="font-medium text-foreground">{new Date(selectedUser.created_date).toLocaleDateString('en-US')}</span>
                        </CardContent>
                      </Card>
                      {selectedUser.last_active_date && (
                        <Card>
                          <CardContent className="p-4 flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Last Login</span>
                            <span className="font-medium text-foreground">{new Date(selectedUser.last_active_date).toLocaleDateString('en-US')}</span>
                          </CardContent>
                        </Card>
                      )}
                      <Card>
                        <CardContent className="p-4 flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Onboarding Completed</span>
                          <span className="font-medium text-foreground">{selectedUser.onboarding_completed ? 'Yes' : 'No'}</span>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* User Responses/Book */}
                <Card className="bg-muted">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Book - User Content ({userResponses.length})</h3>
                    {userResponses.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        {userResponses.map((response) => (
                          <Card key={response.id} className="overflow-hidden">
                            <div className="aspect-square bg-muted relative">
                              {response.response_type === 'text' && (
                                <div className="absolute inset-0 p-3 flex items-center justify-center">
                                  <p className="text-xs text-foreground text-center line-clamp-4">
                                    {response.text_content}
                                  </p>
                                </div>
                              )}
                              {response.response_type === 'drawing' && response.content && (
                                <img src={response.content} alt="Drawing" className="w-full h-full object-cover" />
                              )}
                              {response.response_type === 'video' && response.content && (
                                <video src={response.content} className="w-full h-full object-cover" />
                              )}
                              {response.response_type === 'voice' && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <CardContent className="p-2">
                              <p className="text-xs text-muted-foreground">
                                {new Date(response.created_date).toLocaleDateString('en-US')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ❤️ {response.likes_count || 0}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">User has not shared any content yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </LayoutAdmin>
  );
}
