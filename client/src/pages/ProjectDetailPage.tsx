import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Upload, 
  Download, 
  Star, 
  Trash2, 
  Edit, 
  MoreVertical,
  Eye,
  ArrowLeft,
  Users,
  Tag,
  Share2,
  Settings,
  ChevronDown,
  Archive,
  RotateCcw
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { projectApi, assetApi, tagApi } from '../api/endpoints';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Project, Asset, Tag } from '../types';
import { formatFileSize, formatRelativeTime, getFileIcon, getFileTypeFromMime, cn } from '../utils/helpers';
import toast from 'react-hot-toast';

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc';
type StatusFilter = 'ACTIVE' | 'DELETED';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [status, setStatus] = useState<StatusFilter>('ACTIVE');
  const [fileType, setFileType] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [debouncedSearch] = useDebounce(search, 300);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagForm, setTagForm] = useState({ name: '', color: '#3B82F6' });
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  useEffect(() => {
    if (id) fetchAssets();
  }, [id, debouncedSearch, sort, status, fileType, selectedTags, favoritesOnly, page]);

  useEffect(() => {
    if (id) fetchTags();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await projectApi.getById(id!);
      setProject(res.data);
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/projects');
    }
  };

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const res = await assetApi.getAll(id!, {
        search: debouncedSearch,
        sort,
        status,
        fileType,
        tags: selectedTags.join(','),
        favorites: favoritesOnly,
        page,
        limit: 24,
      });
      setAssets(res.data.assets);
      setTotal(res.data.total);
    } catch (error) {
      toast.error('Failed to load assets');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await tagApi.getAll(id!);
      setTags(res.data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const tagIds = selectedTags;
      await assetApi.upload(id!, uploadFiles, uploadDescription, tagIds);
      toast.success(`${uploadFiles.length} file(s) uploaded`);
      setShowUploadModal(false);
      setUploadFiles([]);
      setUploadDescription('');
      fetchAssets();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(f => f.size <= 100 * 1024 * 1024);
    if (validFiles.length !== fileArray.length) {
      toast.error('Some files exceed 100MB limit');
    }
    setUploadFiles(prev => [...prev, ...validFiles]);
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteAsset = async (assetId: string, permanent = false) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;
    
    const confirmMsg = permanent 
      ? 'Permanently delete this asset? This cannot be undone.' 
      : 'Move this asset to trash?';
    if (!window.confirm(confirmMsg)) return;

    setDeletingAssetId(assetId);
    try {
      await assetApi.delete(id!, assetId, permanent);
      toast.success(permanent ? 'Asset permanently deleted' : 'Asset moved to trash');
      fetchAssets();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete asset');
    } finally {
      setDeletingAssetId(null);
    }
  };

  const handleRestoreAsset = async (assetId: string) => {
    try {
      await assetApi.restore(id!, assetId);
      toast.success('Asset restored');
      fetchAssets();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to restore asset');
    }
  };

  const handleToggleFavorite = async (assetId: string) => {
    try {
      await assetApi.toggleFavorite(id!, assetId);
      fetchAssets();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleDownload = async (assetId: string) => {
    try {
      const res = await assetApi.download(id!, assetId);
      const blob = res.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const asset = assets.find(a => a.id === assetId);
      link.download = asset?.originalName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const assetMenuItems = (asset: Asset): DropdownItem[] => [
    { label: 'Preview', onClick: () => navigate(`/projects/${id}/assets/${asset.id}`), icon: <Eye className="h-4 w-4" /> },
    { label: 'Download', onClick: () => handleDownload(asset.id), icon: <Download className="h-4 w-4" /> },
    { label: 'Rename', onClick: () => {}, icon: <Edit className="h-4 w-4" /> },
    { label: 'Move', onClick: () => {}, icon: <Share2 className="h-4 w-4" /> },
    asset.status === 'DELETED'
      ? { label: 'Restore', onClick: () => handleRestoreAsset(asset.id), icon: <RotateCcw className="h-4 w-4" /> }
      : { label: 'Delete', onClick: () => handleDeleteAsset(asset.id), icon: <Trash2 className="h-4 w-4" />, dangerous: true },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/projects')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Skeleton variant="rectangular" height={32} width={200} />
          </div>
          <Button className="gap-2"><Upload className="h-4 w-4" /> Upload</Button>
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

  if (!project) return null;

  const canEdit = project.userRole === 'OWNER' || project.userRole === 'EDITOR';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">
              {project._count.assets} assets · {project._count.members} members · {project.userRole}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button onClick={() => setShowUploadModal(true)} className="gap-2">
              <Upload className="h-4 w-4" /> Upload
            </Button>
          )}
          <Dropdown trigger={<Button variant="ghost"><Settings className="h-4 w-4" /></Button>} items={[
            { label: 'Project Settings', onClick: () => navigate(`/projects/${id}/settings`), icon: <Settings className="h-4 w-4" /> },
            { label: 'Manage Members', onClick: () => navigate(`/projects/${id}/members`), icon: <Users className="h-4 w-4" /> },
            { label: 'Manage Tags', onClick: () => setShowTagModal(true), icon: <Tag className="h-4 w-4" /> },
            project.isArchived
              ? { label: 'Restore Project', onClick: () => {}, icon: <RotateCcw className="h-4 w-4" /> }
              : { label: 'Archive Project', onClick: () => {}, icon: <Archive className="h-4 w-4" /> },
          ]} align="right" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search assets..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={status} onChange={e => { setStatus(e.target.value as StatusFilter); setPage(1); }} options={[{value:'ACTIVE',label:'Active'},{value:'DELETED',label:'Trash'}]} className="w-32" />
          <Select value={sort} onChange={e => { setSort(e.target.value as SortOption); setPage(1); }} options={[
            {value:'newest',label:'Newest'},{value:'oldest',label:'Oldest'},
            {value:'name_asc',label:'Name A-Z'},{value:'name_desc',label:'Name Z-A'},
            {value:'size_desc',label:'Largest'},{value:'size_asc',label:'Smallest'},
          ]} className="w-36" />
          <Select value={fileType} onChange={e => { setFileType(e.target.value); setPage(1); }} options={[
            {value:'',label:'All Types'},{value:'image',label:'Images'},{value:'video',label:'Videos'},
            {value:'audio',label:'Audio'},{value:'pdf',label:'PDFs'},{value:'document',label:'Documents'},
          ]} className="w-36" />
          <Button variant="outline" size="sm" onClick={() => setFavoritesOnly(!favoritesOnly)} className={cn(favoritesOnly && 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800')}>
            <Star className="h-4 w-4 mr-1" /> Favorites
          </Button>
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

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tagId => {
            const tag = tags.find(t => t.id === tagId);
            return tag && (
              <Badge key={tag.id} variant="primary" removable onRemove={() => setSelectedTags(prev => prev.filter(t => t !== tag.id))}>
                {tag.name}
              </Badge>
            );
          })}
          <Button variant="ghost" size="sm" onClick={() => setSelectedTags([])}>Clear all</Button>
        </div>
      )}

      {assets.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            icon={status === 'DELETED' ? <Trash2 className="h-12 w-12" /> : <Upload className="h-12 w-12" />}
            title={status === 'DELETED' ? 'Trash is empty' : search ? `No assets found for "${search}"` : 'No assets yet'}
            description={status === 'DELETED' ? 'Deleted assets will appear here' : search ? 'Try adjusting your search or filters' : 'Upload your first asset to get started'}
            action={canEdit && status !== 'DELETED' && !search ? { label: 'Upload Assets', onClick: () => setShowUploadModal(true) } : undefined}
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
                    ) : asset.mimeType.startsWith('video/') ? (
                      <video className="w-full h-full object-cover" muted><source src={`/api/files/${asset.storagePath}`} type={asset.mimeType} /></video>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileIcon mimeType={asset.mimeType} className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {asset.isFavorite && <button onClick={e => { e.stopPropagation(); handleToggleFavorite(asset.id); }} className="p-1 rounded-lg bg-white/90 dark:bg-gray-900/90"><Star className="h-5 w-5 text-yellow-400 fill-current" /></button>}
                      <Dropdown trigger={<button className="p-1 rounded-lg bg-white/90 dark:bg-gray-900/90"><MoreVertical className="h-5 w-5 text-gray-600" /></button>} items={assetMenuItems(asset)} align="right" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{asset.originalName}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {asset.tags.slice(0, 3).map(at => (
                        <Badge key={at.tagId} variant="outline" size="sm" style={{ backgroundColor: at.tag.color + '20', borderColor: at.tag.color, color: at.tag.color }}>
                          {at.tag.name}
                        </Badge>
                      ))}
                      {asset.tags.length > 3 && <Badge variant="outline" size="sm">+{asset.tags.length - 3}</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                      <span>{formatFileSize(asset.fileSize)}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(asset.createdAt)}</span>
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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tags</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Uploaded</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {assets.map(asset => (
                      <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <<FileIcon mimeType={asset.mimeType} className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{asset.originalName}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">by {asset.uploader.name || asset.uploader.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" size="sm">{getFileTypeFromMime(asset.mimeType)}</Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatFileSize(asset.fileSize)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {asset.tags.slice(0, 3).map(at => (
                              <Badge key={at.tagId} variant="outline" size="sm" style={{ backgroundColor: at.tag.color + '20', borderColor: at.tag.color, color: at.tag.color }}>
                                {at.tag.name}
                              </Badge>
                            ))}
                            {asset.tags.length > 3 && <Badge variant="outline" size="sm">+{asset.tags.length - 3}</Badge>}
                          </div>
                        </td>
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

      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Assets" size="lg">
        <form onSubmit={handleUpload} className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors"
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-primary-500'); }}
            onDragLeave={e => { e.currentTarget.classList.remove('border-primary-500'); }}
            onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('border-primary-500'); handleFileChange(e.dataTransfer.files); }}
          >
            <input type="file" multiple onChange={e => e.target.files && handleFileChange(e.target.files)} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">Drag & drop files here, or click to browse</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Maximum file size: 100MB</p>
            </label>
          </div>

          {uploadFiles.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploadFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <FileIcon mimeType={asset.mimeType} className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                  </div>
                  <button type="button" onClick={() => removeUploadFile(index)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-5 w-5" /></button>
                </div>
              ))}
            </div>
          )}

          <Input label="Description (optional)" value={uploadDescription} onChange={e => setUploadDescription(e.target.value)} placeholder="Add a description..." />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setSelectedTags(prev => prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id])}
                  className={cn('px-3 py-1 rounded-full text-sm border transition-colors', selectedTags.includes(tag.id) ? `bg-${tag.color.replace('#','')}/20 border-${tag.color} text-${tag.color}` : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-500')}
                  style={{ backgroundColor: selectedTags.includes(tag.id) ? tag.color + '20' : undefined, borderColor: selectedTags.includes(tag.id) ? tag.color : undefined, color: selectedTags.includes(tag.id) ? tag.color : undefined }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={uploading} disabled={uploadFiles.length === 0}>
              {uploading ? 'Uploading...' : `Upload {uploadFiles.length} file(s)`}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showTagModal} onClose={() => { setShowTagModal(false); setEditingTag(null); setTagForm({ name: '', color: '#3B82F6' }); }} title={editingTag ? 'Edit Tag' : 'Create Tag'} size="sm">
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            if (editingTag) {
              await tagApi.update(id!, editingTag.id, tagForm);
              toast.success('Tag updated');
            } else {
              await tagApi.create(id!, tagForm.name, tagForm.color);
              toast.success('Tag created');
            }
            fetchTags();
            setShowTagModal(false);
            setEditingTag(null);
            setTagForm({ name: '', color: '#3B82F6' });
          } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to save tag');
          }
        }} className="space-y-4">
          <Input label="Tag Name" value={tagForm.name} onChange={e => setTagForm(prev => ({ ...prev, name: e.target.value }))} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Color</label>
            <div className="flex gap-2">
              {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'].map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setTagForm(prev => ({ ...prev, color }))}
                  className={cn('h-8 w-8 rounded-full border-2 transition-transform', tagForm.color === color ? 'scale-110 border-gray-900 dark:border-white' : 'border-transparent hover:scale-105')}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setShowTagModal(false); setEditingTag(null); setTagForm({ name: '', color: '#3B82F6' }); }}>Cancel</Button>
            <Button type="submit">{editingTag ? 'Save' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}