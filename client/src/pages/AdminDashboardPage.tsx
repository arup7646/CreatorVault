import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FolderKanban, 
  FileImage, 
  HardDrive, 
  TrendingUp, 
  Activity,
  ChevronLeft,
  BarChart2,
  UserCheck,
  UserX,
  Settings,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { User } from '../types';
import { formatRelativeTime, cn, formatFileSize } from '../utils/helpers';
import toast from 'react-hot-toast';

type AdminTab = 'overview' | 'users' | 'activity';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ role: '', isActive: true });

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, page, search, roleFilter, statusFilter]);

  const fetchStats = async () => {
    try {
      const res = await adminApi.getStats();
      setStats(res.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await adminApi.getUsers({ page, limit: 20, search, role: roleFilter, status: statusFilter, sort: 'newest' });
      setUsers(res.data.users);
      setTotalUsers(res.data.total);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'role' | 'activate' | 'deactivate' | 'delete', newRole?: string) => {
    try {
      if (action === 'delete') {
        if (!window.confirm('Delete this user? This cannot be undone.')) return;
        await adminApi.deleteUser(userId);
        toast.success('User deleted');
      } else if (action === 'role' && newRole) {
        await adminApi.updateUser(userId, { role: newRole });
        toast.success('Role updated');
      } else {
        await adminApi.updateUser(userId, { isActive: action === 'activate' });
        toast.success(action === 'activate' ? 'User activated' : 'User deactivated');
      }
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Action failed');
    }
  };

  const openUserModal = (user: User) => {
    setEditingUser(user);
    setUserForm({ role: user.role, isActive: user.isActive });
    setShowUserModal(true);
  };

  const saveUserChanges = async () => {
    if (!editingUser) return;
    try {
      await adminApi.updateUser(editingUser.id, userForm);
      toast.success('User updated');
      setShowUserModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user');
    }
  };

  const userMenuItems = (user: User): DropdownItem[] => [
    { label: 'View Details', onClick: () => openUserModal(user), icon: <UserCheck className="h-4 w-4" /> },
    { label: user.isActive ? 'Deactivate' : 'Activate', onClick: () => handleUserAction(user.id, user.isActive ? 'deactivate' : 'activate'), icon: user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />, dangerous: !user.isActive },
    { label: 'Change Role', onClick: () => openUserModal(user), icon: <Settings className="h-4 w-4" /> },
    { label: 'Delete', onClick: () => handleUserAction(user.id, 'delete'), icon: <Trash2 className="h-4 w-4" />, dangerous: true },
  ];

  const roleOptions = [
    { value: 'USER', label: 'User' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'ADMIN', label: 'Admin' },
  ];

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Active Users', value: stats?.activeUsers || 0, icon: UserCheck, color: 'bg-green-500' },
    { label: 'Total Projects', value: stats?.totalProjects || 0, icon: FolderKanban, color: 'bg-purple-500' },
    { label: 'Total Assets', value: stats?.totalAssets || 0, icon: FileImage, color: 'bg-orange-500' },
    { label: 'Storage Used', value: stats?.totalStorage ? formatFileSize(stats.totalStorage) : '0 B', icon: HardDrive, color: 'bg-pink-500' },
    { label: 'Uploads Today', value: stats?.uploadsToday || 0, icon: TrendingUp, color: 'bg-indigo-500' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Skeleton variant="rectangular" height={32} width={200} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="p-6">
              <Skeleton variant="rectangular" height={60} width="100%" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'activity', label: 'Activity Logs', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400">System administration and monitoring</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', stat.color)}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'
            )}
          >
            <tab.icon className="h-4 w-4 inline mr-1" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Users by Role</h3>
            <div className="space-y-3">
              {stats?.usersByRole?.map((r: any) => (
                <div key={r.role} className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">{r.role.toLowerCase()}</span>
                  <Badge variant="primary">{r.count}</Badge>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Assets by Type</h3>
            <div className="space-y-3">
              {stats?.assetsByType?.slice(0, 10).map((a: any) => (
                <div key={a.type} className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">{a.type}</span>
                  <Badge variant="outline">{a.count}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} options={[{value:'',label:'All Roles'},...roleOptions]} className="w-36" />
              <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} options={[{value:'',label:'All Status'},{value:'active',label:'Active'},{value:'inactive',label:'Inactive'}]} className="w-36" />
            </div>
          </div>

          {usersLoading ? (
            <Card className="p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-shimmer">
                    <Skeleton variant="circular" width={40} height={40} />
                    <div className="flex-1 space-y-2">
                      <Skeleton width="40%" height={16} />
                      <Skeleton width="60%" height={12} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : users.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No users found</p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Projects</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assets</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Active</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar src={user.avatar} name={user.name || user.username} size="sm" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{user.name || user.username}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={user.role === 'ADMIN' ? 'destructive' : user.role === 'MANAGER' ? 'primary' : 'default'}>{user.role}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={user.isActive ? 'success' : 'destructive'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{user._count?.ownedProjects || 0}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{user._count?.assets || 0}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatRelativeTime(user.createdAt)}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{user.lastActiveAt ? formatRelativeTime(user.lastActiveAt) : 'Never'}</td>
                        <td className="px-4 py-3 text-right">
                          <Dropdown trigger={<MoreVertical className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded" />} items={userMenuItems(user)} align="right" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {Math.ceil(totalUsers / 20) > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {Math.ceil(totalUsers / 20)}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(Math.ceil(totalUsers / 20), p + 1))} disabled={page === Math.ceil(totalUsers / 20)}>Next</Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">System Activity Logs</h3>
          <p className="text-gray-500 dark:text-gray-400">Activity logs coming soon</p>
        </Card>
      )}

      <Modal isOpen={showUserModal} onClose={() => { setShowUserModal(false); setEditingUser(null); }} title="Edit User" size="sm">
        <form onSubmit={e => { e.preventDefault(); saveUserChanges(); }} className="space-y-4">
          <Select label="Role" value={userForm.role} onChange={e => setUserForm(prev => ({ ...prev, role: e.target.value }))} options={roleOptions} />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={userForm.isActive} onChange={e => setUserForm(prev => ({ ...prev, isActive: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
          </label>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setShowUserModal(false); setEditingUser(null); }}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}