import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../utils/helpers';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Star, 
  Clock, 
  Trash2, 
  User, 
  Settings,
  Users,
  BarChart2,
  Activity,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { Dropdown, DropdownItem } from './Dropdown';
import { Button } from './Button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Favorites', href: '/favorites', icon: Star },
  { name: 'Recent', href: '/recent', icon: Clock },
  { name: 'Trash', href: '/trash', icon: Trash2 },
];

const adminNavigation = [
  { name: 'Admin Dashboard', href: '/admin', icon: BarChart2 },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'Activity Logs', href: '/admin/activity', icon: Activity },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const userMenuItems: DropdownItem[] = [
    { label: 'Profile', onClick: () => navigate('/profile'), icon: <User className="h-4 w-4" /> },
    { label: 'Settings', onClick: () => navigate('/settings'), icon: <Settings className="h-4 w-4" /> },
    { label: 'Logout', onClick: () => logout(), icon: <LogOut className="h-4 w-4" />, dangerous: true },
  ];

  const navigate = (path: string) => {
    window.location.href = path;
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 lg:translate-x-0" role="navigation" aria-label="Main navigation">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <NavLink to="/dashboard" className="flex items-center gap-2" aria-label="CreatorVault Home">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">CreatorVault</span>
          </NavLink>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Main menu">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {item.name}
              </NavLink>
            );
          })}

          {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
            <>
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Administration
                </h3>
                {adminNavigation.map((item) => {
                  const isActive = location.pathname === item.href || location.pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive }) => cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </div>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Dropdown trigger={
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Avatar src={user?.avatar} name={user?.name || user?.username} size="sm" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name || user?.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role.toLowerCase()}</p>
              </div>
            </button>
          } items={userMenuItems} align="left" />
        </div>
      </div>
    </aside>
  );
}