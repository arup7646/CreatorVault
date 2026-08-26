import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Edit, Camera, ChevronLeft, FolderKanban, FileImage, Star, Clock, Settings, LogOut, Plus, Eye } from 'lucide-react';
import { authApi } from '../api/endpoints';
import { projectApi } from '../api/endpoints';
import { assetApi } from '../api/endpoints';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';
import { Skeleton } from '../components/ui/Skeleton';
import { User as UserType, Project, Asset } from '../types';
import { formatRelativeTime, cn, formatFileSize, getFileIcon } from '../utils/helpers';
import toast from 'react-hot-toast';

type Tab = 'overview' | 'projects' | 'assets' | 'activity';

export function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', username: '', bio: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await authApi.getProfile();
      setUser(res.data);
      setEditForm({ name: res.data.name || '', username: res.data.username, bio: res.data.bio || '', email: res.data.email });
    } catch (error) {
      toast.error('Failed to load profile');
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'projects') fetchProjects();
    if (activeTab === 'assets') fetchAssets();
  }, [activeTab]);

  const fetchProjects = async () => {
    try {
      const res = await projectApi.getAll({ limit: 10, sort: 'newest' });
      setProjects(res.data.projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await assetApi.getFavorites({ limit: 10 });
      setAssets(res.data.favorites);
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateProfile(editForm);
      const res = await authApi.getProfile();
      setUser(res.data);
      setEditing(false);
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSave = async () => {
    if (!avatarUrl) return;
    try {
      await authApi.updateAvatar(avatarUrl);
      const res = await authApi.getProfile();
      setUser(res.data);
      setShowAvatarModal(false);
      setAvatarUrl('');
      toast.success('Avatar updated');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update avatar');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'assets', label: 'Assets', icon: FileImage },
    { id: 'activity', label: 'Activity', icon: Clock },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Skeleton variant="rectangular" height={32} width={200} />
        </div>
        <Card className="p-6">
          <div className="flex items-center gap-4 animate-shimmer">
            <Skeleton variant="circular" width={80} height={80} />
            <div className="flex-1 space-y-3">
              <Skeleton width="40%" height={24} />
              <Skeleton width="60%" height={16} />
              <Skeleton width="80%" height={16} />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const userMenuItems: DropdownItem[] = [
    { label: 'Settings', onClick: () => navigate('/settings'), icon: <Settings className="h-4 w-4" /> },
    { label: 'Logout', onClick: () => {}, icon: <LogOut className="h-4 w-4" />, dangerous: true },
  ];

  const stats = [
    { label: 'Projects', value: user?._count?.ownedProjects || 0, icon: FolderKanban, color: 'text-blue-500' },
    { label: 'Assets', value: user?._count?.assets || 0, icon: FileImage, color: 'text-green-500' },
    { label: 'Favorites', value: user?._count?.favorites || 0, icon: Star, color: 'text-yellow-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your account and view your activity</p>
        </div>
        <Dropdown trigger={<Button variant="ghost"><User className="h-4 w-4" /></Button>} items={userMenuItems} align="right" />
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative">
            <Avatar src={user?.avatar} name={user?.name || user?.username} size="xl" />
            {editing && (
              <button onClick={() => setShowAvatarModal(true)} className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700">
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Full Name" value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
                  <Input label="Username" value={editForm.username} onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value }))} />
                </div>
                <Input label="Email" type="email" value={editForm.email} onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => { setEditing(false); setEditForm({ name: user?.name || '', username: user?.username, bio: user?.bio || '', email: user?.email }); }}>Cancel</Button>
                  <Button type="submit" isLoading={saving}>Save Changes</Button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name || user?.username}</h2>
                  <Badge variant={user?.role === 'ADMIN' ? 'destructive' : user?.role === 'MANAGER' ? 'primary' : 'default'}>{user?.role}</Badge>
                </div>
                <p className="text-gray-500 dark:text-gray-400">@{user?.username}</p>
                {user?.bio && <p className="mt-2 text-gray-600 dark:text-gray-300">{user.bio}</p>}
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>Joined {user?.createdAt ? formatRelativeTime(user.createdAt) : 'recently'}</span>
                  {user?.email && <span>{user.email}</span>}
                </div>
                <Button variant="ghost" onClick={() => setEditing(true)} className="mt-4 gap-2">
                  <Edit className="h-4 w-4" /> Edit Profile
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className="p-4 text-center hover:shadow-lg transition-shadow">
            <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-2', stat.color + '/10 bg-')} style={{ backgroundColor: stat.color + '15' }}>
              <stat.icon className={cn('h-6 w-6', stat.color)} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
          </Card>
        )}
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
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
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            <Link to="/projects/new">
              <Button variant="outline" className="gap-2">
                <FolderKanban className="h-4 w-4" /> New Project
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" /> Settings
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {activeTab === 'projects' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Your Projects</h3>
            <Link to="/projects/new">
              <Button variant="ghost" size="sm">Create Project</Button>
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="p-12 text-center">
              <FolderKanban className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No projects yet</p>
              <Link to="/projects/new">
                <Button className="mt-4 gap-2">
                  <Plus className="h-4 w-4" /> Create Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {projects.map(project => (
                <Link key={project.id} to={`/projects/${project.id}`} className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <FolderKanban className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{project.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{project._count.assets} assets · {formatRelativeTime(project.updatedAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'assets' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Favorite Assets</h3>
            <Link to="/favorites">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          {assets.length === 0 ? (
            <div className="p-12 text-center">
              <Star className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No favorite assets yet</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4">
              {assets.map(asset => (
                <Link key={asset.id} to={`/projects/${asset.projectId}/assets/${asset.id}`} className="block">
                  <Card className="p-0 overflow-hidden h-full group-hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                      {asset.mimeType.startsWith('image/') ? (
                        <img src={`/api/files/${asset.storagePath}`} alt={asset.originalName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <getFileIcon(asset.mimeType) className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{asset.originalName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{asset.project?.name} · {formatFileSize(asset.fileSize)}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'activity' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <Clock className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p>Activity history coming soon</p>
          </div>
        </Card>
      )}

      <Modal isOpen={showAvatarModal} onClose={() => setShowAvatarModal(false)} title="Update Avatar" size="sm">
        <div className="space-y-4">
          <Input label="Avatar URL" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://example.com/avatar.jpg" />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAvatarModal(false)}>Cancel</Button>
            <Button onClick={handleAvatarSave}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}