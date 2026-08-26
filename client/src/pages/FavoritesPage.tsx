import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Trash2, MoreVertical, Download, Eye, ChevronLeft, Grid, List } from 'lucide-react';
import { assetApi } from '../api/endpoints';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Asset } from '../types';
import { formatFileSize, formatRelativeTime, getFileIcon, cn } from '../utils/helpers';
import toast from 'react-hot-toast';

type ViewMode = 'grid' | 'list';

export function FavoritesPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, [page]);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const res = await assetApi.getFavorites({ page, limit: 24 });
      setAssets(res.data.favorites);
      setTotal(res.data.total);
    } catch (error) {
      toast.error('Failed to load favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (assetId: string) => {
    try {
      await assetApi.toggleFavorite('', assetId);
      setAssets(prev => prev.filter(a => a.id !== assetId));
      setTotal(prev => prev - 1);
      toast.success('Removed from favorites');
    } catch (error) {
      toast.error('Failed to remove favorite');
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!window.confirm('Move this asset to trash?')) return;
    setDeletingId(assetId);
    try {
      const asset = assets.find(a => a.id === assetId);
      if (asset) {
        await assetApi.delete(asset.projectId, assetId);
        setAssets(prev => prev.filter(a => a.id !== assetId));
        setTotal(prev => prev - 1);
        toast.success('Asset moved to trash');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete asset');
    } finally {
      setDeletingId(null);
    }
  };

  const assetMenuItems = (asset: Asset): DropdownItem[] => [
    { label: 'Open', onClick: () => navigate(`/projects/${asset.projectId}/assets/${asset.id}`), icon: <Eye className="h-4 w-4" /> },
    { label: 'Download', onClick: () => {}, icon: <Download className="h-4 w-4" /> },
    { label: 'Remove from favorites', onClick: () => handleRemoveFavorite(asset.id), icon: <Star className="h-4 w-4" /> },
    { label: 'Move to trash', onClick: () => handleDelete(asset.id), icon: <Trash2 className="h-4 w-4" />, dangerous: true },
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Favorites</h1>
              <p className="text-gray-500 dark:text-gray-400">Your starred assets for quick access</p>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Favorites</h1>
            <p className="text-gray-500 dark:text-gray-400">Your starred assets for quick access</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={cn('p-2', viewMode === 'grid' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800')}>
              <Grid className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={cn('p-2', viewMode === 'list' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800')}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {assets.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            icon={<Star className="h-12 w-12 text-yellow-400" />}
            title="No favorites yet"
            description="Star assets from your projects to access them quickly here"
          />
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {assets.map(asset => (
                <Card key={asset.id} className="p-0 overflow-hidden group relative">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                    {asset.mimeType.startsWith('image/') ? (
                      <img src={`/api/files/${asset.storagePath}`} alt={asset.originalName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <getFileIcon(asset.mimeType) className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <button onClick={e => { e.stopPropagation(); handleRemoveFavorite(asset.id); }} className="p-1 rounded-lg bg-white/90 dark:bg-gray-900/90" aria-label="Remove from favorites">
                        <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      </button>
                      <Dropdown trigger={<MoreVertical className="h-5 w-5 text-gray-400 p-1 rounded-lg bg-white/90 dark:bg-gray-900/90" />} items={assetMenuItems(asset)} align="right" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{asset.originalName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <span className="text-yellow-400">★</span>
                      <span>{asset.project?.name}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{formatFileSize(asset.fileSize)} · {formatRelativeTime(asset.createdAt)}</p>
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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Added</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {assets.map(asset => (
                      <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <getFileIcon(asset.mimeType) className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{asset.originalName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{asset.project?.name}</td>
                        <td className="px-4 py-3"><Badge variant="outline" size="sm">{asset.mimeType.split('/')[0]}</Badge></td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatFileSize(asset.fileSize)}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatRelativeTime(asset.createdAt)}</td>
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