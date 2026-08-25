import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Monitor, 
  Bell, 
  Shield, 
  AlertTriangle, 
  ChevronLeft, 
  Save, 
  Eye, 
  EyeOff,
  Loader2,
  LogOut,
  Trash2
} from 'lucide-react';
import { authApi } from '../api/endpoints';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { cn, formatRelativeTime } from '../utils/helpers';
import toast from 'react-hot-toast';

type SettingsTab = 'account' | 'appearance' | 'notifications' | 'security' | 'danger';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [saving, setSaving] = useState(false);
  
  // Account
  const [accountForm, setAccountForm] = useState({ name: '', username: '', email: '', bio: '' });
  // Appearance
  const [appearanceTheme, setAppearanceTheme] = useState<'light' | 'dark' | 'system'>('system');
  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  // Danger
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Monitor },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  const themeOptions = [
    { value: 'light', label: 'Light', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { value: 'dark', label: 'Dark', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> },
    { value: 'system', label: 'System', icon: <Monitor className="h-5 w-5" /> },
  ];

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateProfile(accountForm);
      updateUser(accountForm);
      toast.success('Account updated');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update account');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success('Password changed. Please log in again.');
      logout();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await authApi.getSessions();
      setSessions(res.data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      await authApi.revokeSession(sessionId);
      toast.success('Session revoked');
      fetchSessions();
    } catch (error) {
      toast.error('Failed to revoke session');
    }
  };

  const revokeAllSessions = async () => {
    if (!window.confirm('This will log you out of all devices. Continue?')) return;
    try {
      await authApi.revokeAllSessions();
      toast.success('All sessions revoked');
      logout();
    } catch (error) {
      toast.error('Failed to revoke sessions');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    setDeleting(true);
    try {
      // We need the current password for deletion
      const password = window.prompt('Enter your password to confirm account deletion:');
      if (!password) return;
      await authApi.deleteAccount(password);
      toast.success('Account deleted');
      logout();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const sessionMenuItems = (session: any): DropdownItem[] => [
    { label: 'Revoke', onClick: () => revokeSession(session.id), icon: <Trash2 className="h-4 w-4" />, dangerous: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your account preferences</p>
        </div>
      </div>

      <div className="flex gap-6">
        <nav className="w-48 flex-shrink-0" aria-label="Settings tabs">
          <ul className="space-y-1">
            {tabs.map(tab => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                  )}
                >
                  <tab.icon className="h-5 w-5 flex-shrink-0" />
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-1 min-w-0">
          {activeTab === 'account' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Account Settings</h2>
              <form onSubmit={handleSaveAccount} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    <Avatar src={user?.avatar} name={user?.name || user?.username} size="xl" />
                    <Button variant="outline" onClick={() => {}}>Change Avatar</Button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Full Name" value={accountForm.name} onChange={e => setAccountForm(prev => ({ ...prev, name: e.target.value }))} placeholder="John Doe" />
                  <Input label="Username" value={accountForm.username} onChange={e => setAccountForm(prev => ({ ...prev, username: e.target.value }))} placeholder="johndoe" />
                </div>
                <Input label="Email" type="email" value={accountForm.email} onChange={e => setAccountForm(prev => ({ ...prev, email: e.target.value }))} placeholder="you@example.com" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bio</label>
                  <textarea
                    value={accountForm.bio}
                    onChange={e => setAccountForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" isLoading={saving}>Save Changes</Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Appearance</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {themeOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => { setAppearanceTheme(option.value); setTheme(option.value); }}
                        className={cn(
                          'p-4 rounded-xl border-2 text-left transition-all',
                          appearanceTheme === option.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        )}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className={cn('p-2 rounded-lg', appearanceTheme === option.value ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-gray-800')}>
                            {option.icon}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">{option.label}</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {option.value === 'light' && 'Always use light mode'}
                          {option.value === 'dark' && 'Always use dark mode'}
                          {option.value === 'system' && 'Match your system setting'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Notifications</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive browser notifications for activity</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive email updates for important activity</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>You have <span className="font-medium">{unreadCount}</span> unread notification{unreadCount !== 1 ? 's' : ''}.</p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Change Password</h2>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <Input
                    label="Current Password"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="New Password"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="Confirm New Password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                  <div className="flex justify-end">
                    <Button type="submit" isLoading={saving}>Update Password</Button>
                  </div>
                </form>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Sessions</h2>
                  <Button variant="outline" size="sm" onClick={fetchSessions}>
                    <Loader2 className="h-4 w-4" /> Refresh
                  </Button>
                </div>
                <Button variant="destructive" size="sm" onClick={revokeAllSessions} className="mb-4">
                  <LogOut className="h-4 w-4 mr-1" /> Logout All Sessions
                </Button>
                {loadingSessions ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3 animate-shimmer">
                        <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded" />
                          <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No active sessions</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map(session => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <Monitor className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{session.userAgent || 'Unknown Device'}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {session.ipAddress} · {formatRelativeTime(session.createdAt)}
                              {session.id === sessions[0]?.id && <Badge variant="primary" size="sm" className="ml-2">Current</Badge>}
                            </p>
                          </div>
                        </div>
                        {session.id !== sessions[0]?.id && (
                          <Dropdown trigger={<button className="p-1"><MoreVertical className="h-5 w-5" /></button>} items={sessionMenuItems(session)} align="right" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'danger' && (
            <Card className="p-6 border-red-200 dark:border-red-900">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Danger Zone</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Irreversible and destructive actions</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-100">Delete Account</p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">Permanently delete your account and all associated data. This action cannot be undone.</p>
                    </div>
                    <Button variant="destructive" onClick={() => setDeleteConfirm('DELETE')} disabled={deleting} isLoading={deleting}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete Account
                    </Button>
                  </div>
                  {deleteConfirm && (
                    <div className="mt-4 space-y-3">
                      <Input label="Type DELETE to confirm" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
                      <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteConfirm !== 'DELETE'} isLoading={deleting}>
                        Confirm Deletion
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}