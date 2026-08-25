import React, { useState } from 'react';
import { cn } from '../../utils/helpers';
import { Menu, Search, Bell, Moon, Sun, Monitor, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationDropdown } from './NotificationDropdown';
import { SearchModal } from './SearchModal';
import { Button } from '../ui/Button';

export function Header() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { unreadCount, fetchUnreadCount } = useNotifications();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
    { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <button
            onClick={() => setSearchOpen(true)}
            className="flex-1 max-w-md hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Search assets, projects...</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">
              <kbd className="font-mono">⌘</kbd>K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <NotificationDropdown onFetch={fetchUnreadCount} />
          </div>

          <div className="relative" role="group" aria-label="Theme selector">
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={() => {}}
            >
              {resolvedTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 hidden group-hover:block">
              {themeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleThemeChange(opt.value as any)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                    theme === opt.value ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {opt.icon}
                  {opt.label}
                  {theme === opt.value && <Check className="h-4 w-4 ml-auto text-primary-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      {sidebarOpen && <MobileSidebar onClose={() => setSidebarOpen(false)} />}
    </header>
  );
}

function MobileSidebar({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 animate-slide-in">
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <span className="text-lg font-bold text-gray-900 dark:text-white">Menu</span>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          <a href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" onClick={onClose}>Dashboard</a>
          <a href="/projects" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" onClick={onClose}>Projects</a>
          <a href="/favorites" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" onClick={onClose}>Favorites</a>
          <a href="/recent" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" onClick={onClose}>Recent</a>
          <a href="/trash" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" onClick={onClose}>Trash</a>
        </nav>
      </aside>
    </div>
  );
}