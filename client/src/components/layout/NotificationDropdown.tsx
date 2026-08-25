import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/helpers';
import { Bell, X, Check, Clock, UserPlus, UserCog, FileUp, UserMinus } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatRelativeTime } from '../../utils/helpers';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { EmptyState } from '../ui/EmptyState';

interface NotificationDropdownProps {
  onFetch: () => Promise<void>;
}

export function NotificationDropdown({ onFetch }: NotificationDropdownProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, fetchNotifications, isLoading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    await onFetch();
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    // Navigate based on notification data
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PROJECT_INVITATION': return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'ROLE_CHANGE': return <UserCog className="h-5 w-5 text-purple-500" />;
      case 'ASSET_UPLOADED': return <FileUp className="h-5 w-5 text-green-500" />;
      case 'REMOVED_FROM_PROJECT': return <UserMinus className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="fixed right-4 top-full z-50 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-in"
      role="menu"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-3 animate-shimmer">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-12 w-12" />}
            title="No notifications"
            description="You're all caught up!"
          />
        ) : (
          <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map(notification => (
              <li key={notification.id} role="menuitem">
                <button
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'w-full p-4 flex items-start gap-3 text-left transition-colors',
                    !notification.isRead ? 'bg-primary-50/50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  )}
                >
                  <div className="flex-shrink-0 p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('font-medium text-sm', !notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300')}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <Badge variant="primary" size="sm">New</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                    className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && createPortal(dropdownContent, document.body)}
    </div>
  );
}