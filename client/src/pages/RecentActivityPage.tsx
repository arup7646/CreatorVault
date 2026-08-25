import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, FolderKanban, FileImage, Star, Trash2, MoreVertical, RotateCcw, Download, Eye } from 'lucide-react';
import { activityApi } from '../api/endpoints';
import { assetApi } from '../api/endpoints';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ActivityLog, Asset } from '../types';
import { formatRelativeTime, getFileIcon, cn } from '../utils/helpers';
import toast from 'react-hot-toast';

export function RecentActivityPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, [page]);

  const fetchActivity = async () => {
    setIsLoading(true);
    try {
      const res = await activityApi.getAll({ page, limit: 20 });
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch (error) {
      toast.error('Failed to load activity');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('CREATED')) return <FolderKanban className="h-4 w-4 text-blue-500" />;
    if (action.includes('UPLOADED')) return <FileImage className="h-4 w-4 text-green-500" />;
    if (action.includes('FAVORITED')) return <Star className="h-4 w-4 text-yellow-500" />;
    if (action.includes('DELETED')) return <Trash2 className="h-4 w-4 text-red-500" />;
    if (action.includes('RESTORED')) return <RotateCcw className="h-4 w-4 text-green-500" />;
    if (action.includes('DOWNLOADED')) return <Download className="h-4 w-4 text-purple-500" />;
    if (action.includes('MOVED')) return <MoreVertical className="h-4 w-4 text-gray-500" />;
    if (action.includes('LOGIN') || action.includes('REGISTERED')) return <ChevronLeft className="h-4 w-4 text-gray-500" />;
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATED')) return 'bg-blue-100 dark:bg-blue-900/30';
    if (action.includes('UPLOADED')) return 'bg-green-100 dark:bg-green-900/30';
    if (action.includes('FAVORITED')) return 'bg-yellow-100 dark:bg-yellow-900/30';
    if (action.includes('DELETED')) return 'bg-red-100 dark:bg-red-900/30';
    if (action.includes('RESTORED')) return 'bg-green-100 dark:bg-green-900/30';
    if (action.includes('DOWNLOADED')) return 'bg-purple-100 dark:bg-purple-900/30';
    return 'bg-gray-100 dark:bg-gray-800';
  };

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
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 animate-shimmer">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                  <Skeleton width="60%" height={16} />
                  <Skeleton width="40%" height={12} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h1>
          <p className="text-gray-500 dark:text-gray-400">Track all activity across your projects</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={<Clock className="h-12 w-12" />}
            title="No activity yet"
            description="Your activity history will appear here"
          />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map(log => (
              <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center gap-4">
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0', getActionColor(log.action))}>
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">
                    <span className="font-semibold">{log.user?.name || log.user?.username}</span>{' '}
                    {log.action.toLowerCase().replace(/_/g, ' ')}
                    {log.entityType && <span className="text-gray-500 dark:text-gray-400 ml-2">({log.entityType})</span>}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {log.metadata && JSON.stringify(log.metadata)}
                  </p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{formatRelativeTime(log.createdAt)}</span>
              </div>
            ))}
          </div>
          {Math.ceil(total / 20) > 1 && (
            <div className="flex items-center justify-center gap-2 p-4">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {Math.ceil(total / 20)}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(Math.ceil(total / 20), p + 1))} disabled={page === Math.ceil(total / 20)}>Next</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}