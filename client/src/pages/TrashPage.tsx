import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, RotateCcw, MoreVertical, Download, Eye, ChevronLeft, Trash } from 'lucide-react';
import { assetApi } from '../api/endpoints';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Asset } from '../types';
import { formatFileSize, formatRelativeTime, getFileIcon, cn } from '../utils/helpers';
import toast from 'react-hot-toast';

type ViewMode = 'grid' | 'list';

export function TrashPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    fetchTrash();
  }, [page]);

  const fetchTrash = async () => {
    setIsLoading(true);
    try {
      const res = await assetApi.getAll('', { status: 'DELETED', page, limit: 24 });
      setAssets(res.data.assets);
      setTotal(res.data.total);
    } catch (error) {
      toast.error('Failed to load trash');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (asset: Asset) => {
    setRestoringId(asset.id);
    try {
      await assetApi.restore(asset.projectId, asset.id);
      setAssets(prev => prev.filter(a => a.id !== asset.id));
      setTotal(prev => prev - 1);
      toast.success('Asset restored');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to restore asset');
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (asset: Asset) => {
    if (!window.confirm('Permanently delete this asset? This cannot be undone.')) return;
    setDeletingId(asset.id);
    try {
      await assetApi.delete(asset.projectId, asset.id, true);
      setAssets(prev => prev.filter(a => a.id !== asset.id));
      setTotal(prev => prev - 1);
      toast.success('Asset permanently deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete asset');
    } finally {
      setDeletingId(null);
    }
  };

  const assetMenuItems = (asset: Asset): DropdownItem[] => [
    { label: 'Preview', onClick: () => navigate(`/projects/${asset.projectId}/assets/${asset.id}`), icon: <Eye className="h-4 w-4" /> },
    { label: 'Download', onClick: () => {}, icon: <Download className="h-4 w-4" /> },
    { label: 'Restore', onClick: () => handleRestore(asset), icon: <RotateCcw className="h-4 w-4" /> },
    { label: 'Delete permanently', onClick: () => handlePermanentDelete(asset), icon: <Trash className="h-4 w-4" />, dangerous: true },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trash</h1>
              <p className="text-gray-500 dark:text-gray-400">Deleted assets are kept here for 30 days</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="p-0 overflow-hidden">
              <Skeleton variant="rectangular" className="aspect-video" />
              <Skeleton variant="text" className="p-4" width="80%" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trash</h1>
            <p className="text-gray-500 dark:text-gray-400">Deleted assets are kept here for 30 days</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={cn('p-2', viewMode === 'grid' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800')}>
              <div className="h-4 w-4"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg></div>
            </button>
            <button onClick={() => setViewMode('list')} className={cn('p-2', viewMode === 'list' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800')}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
      </div>

      {assets.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            icon={<Trash2 className="h-12 w-12 text-red-400" />}
            title="Trash is empty"
            description="Deleted assets will appear here. You can restore them within 30 days."
          />
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {assets.map(asset => (
                <Card key={asset.id} className="p-0 overflow-hidden group relative opacity-75">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                    {asset.mimeType.startsWith('image/') ? (
                      <img src={`/api/files/${asset.storagePath}`} alt={asset.originalName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileIcon mimeType={asset.mimeType} className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Dropdown trigger={<MoreVertical className="h-5 w-5 text-gray-400 p-1 rounded-lg bg-white/90 dark:bg-gray-900/90" />} items={assetMenuItems(asset)} align="right" />
                    </div>
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="bg-white/90 dark:bg-gray-900/90 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300">Deleted</div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{asset.originalName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                      <span>{formatFileSize(asset.fileSize)}</span>
                      <span>·</span>
                      <span>Deleted {asset.deletedAt ? formatRelativeTime(asset.deletedAt) : 'recently'}</span>
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asset</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deleted</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {assets.map(asset => (
                      <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 opacity-75">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <FileIcon mimeType={asset.mimeType} className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{asset.originalName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{asset.project?.name}</td>
                        <td className="px-4 py-3"><Badge variant="outline" size="sm">{asset.mimeType.split('/')[0]}</Badge></td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatFileSize(asset.fileSize)}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{asset.deletedAt ? formatRelativeTime(asset.deletedAt) : 'Recently'}</td>
                        <td className="px-4 py-3 text-right">
                          <Dropdown trigger={<MoreVertical className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded" />} items={assetMenuItems(asset)} align="right" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {Math.ceil(total / 24) > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {Math.ceil(total / 24)}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(Math.ceil(total / 24), p + 1))} disabled={page === Math.ceil(total / 24)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}