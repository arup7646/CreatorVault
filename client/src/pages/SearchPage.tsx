import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, Filter, ChevronLeft, FolderKanban, File, Star, Clock, ChevronDown, Tag } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { searchApi } from '../api/endpoints';
import { projectApi } from '../api/endpoints';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Project, Asset, Tag } from '../types';
import { formatFileSize, formatRelativeTime, getFileIcon, cn } from '../utils/helpers';
import toast from 'react-hot-toast';

type SearchType = 'all' | 'projects' | 'assets';
type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc';

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [type, setType] = useState<SearchType>((searchParams.get('type') as SearchType) || 'all');
  const [sort, setSort] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'newest');
  const [fileType, setFileType] = useState(searchParams.get('fileType') || '');
  const [projectId, setProjectId] = useState(searchParams.get('projectId') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(searchParams.get('favorites') === 'true');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [sizeMin, setSizeMin] = useState(searchParams.get('sizeMin') || '');
  const [sizeMax, setSizeMax] = useState(searchParams.get('sizeMax') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery] = useDebounce(query, 300);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (type !== 'all') params.set('type', type);
    if (sort !== 'newest') params.set('sort', sort);
    if (fileType) params.set('fileType', fileType);
    if (projectId) params.set('projectId', projectId);
    if (selectedTags.length) params.set('tags', selectedTags.join(','));
    if (favoritesOnly) params.set('favorites', 'true');
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (sizeMin) params.set('sizeMin', sizeMin);
    if (sizeMax) params.set('sizeMax', sizeMax);
    params.set('page', page.toString());
    setSearchParams(params, { replace: true });
  }, [query, type, sort, fileType, projectId, selectedTags, favoritesOnly, dateFrom, dateTo, sizeMin, sizeMax, page, setSearchParams]);

  useEffect(() => {
    fetchProjects();
  }, [id]);

  useEffect(() => {
    if (debouncedQuery.length >= 1 || type !== 'all' || fileType || projectId || selectedTags.length || favoritesOnly || dateFrom || dateTo || sizeMin || sizeMax) {
      search();
    } else {
      setProjects([]);
      setAssets([]);
      setTotal(0);
    }
  }, [debouncedQuery, type, sort, fileType, projectId, selectedTags, favoritesOnly, dateFrom, dateTo, sizeMin, sizeMax, page]);

  const fetchProjects = async () => {
    try {
      const res = await projectApi.getAll({ limit: 100 });
      setProjects(res.data.projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const search = async () => {
    setIsLoading(true);
    try {
      const res = await searchApi.search({
        q: debouncedQuery,
        type,
        fileType,
        projectId,
        tags: selectedTags.join(','),
        favorites: favoritesOnly,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sizeMin: sizeMin ? parseInt(sizeMin) : undefined,
        sizeMax: sizeMax ? parseInt(sizeMax) : undefined,
        sort,
        page,
        limit: 20,
      });
      setProjects(res.data.projects);
      setAssets(res.data.assets);
      setTotal(res.data.total);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setType('all');
    setSort('newest');
    setFileType('');
    setProjectId('');
    setSelectedTags([]);
    setFavoritesOnly(false);
    setDateFrom('');
    setDateTo('');
    setSizeMin('');
    setSizeMax('');
    setPage(1);
  };

  const hasActiveFilters = type !== 'all' || fileType || projectId || selectedTags.length || favoritesOnly || dateFrom || dateTo || sizeMin || sizeMax;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input disabled className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-500" placeholder="Search..." />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Projects</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Assets</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="p-0 overflow-hidden">
                  <Skeleton variant="rectangular" className="aspect-video" />
                  <Skeleton variant="text" className="p-4" width="80%" />
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 max-w-3xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search projects, assets, tags..."
              className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
              autoFocus
            />
            {query && (
              <button onClick={() => { setQuery(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={type} onChange={e => { setType(e.target.value as SearchType); setPage(1); }} options={[
            {value:'all',label:'All'},{value:'projects',label:'Projects'},{value:'assets',label:'Assets'}
          ]} className="w-28" />
          <Select value={sort} onChange={e => { setSort(e.target.value as SortOption); setPage(1); }} options={[
            {value:'newest',label:'Newest'},{value:'oldest',label:'Oldest'},
            {value:'name_asc',label:'Name A-Z'},{value:'name_desc',label:'Name Z-A'},
            {value:'size_desc',label:'Largest'},{value:'size_asc',label:'Smallest'},
          ]} className="w-32" />
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={cn(hasActiveFilters && 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-800')}>
            <Filter className="h-4 w-4 mr-1" /> Filters
            {hasActiveFilters && <span className="ml-1 h-5 w-5 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center">{[fileType, projectId, selectedTags.length, favoritesOnly, dateFrom, dateTo, sizeMin, sizeMax].filter(Boolean).length}</span>}
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="p-4 space-y-4 animate-slide-down">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File Type</label>
              <Select value={fileType} onChange={e => { setFileType(e.target.value); setPage(1); }} options={[
                {value:'',label:'All Types'},{value:'image',label:'Images'},{value:'video',label:'Videos'},
                {value:'audio',label:'Audio'},{value:'pdf',label:'PDFs'},{value:'document',label:'Documents'},
                {value:'archive',label:'Archives'}
              ]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project</label>
              <Select value={projectId} onChange={e => { setProjectId(e.target.value); setPage(1); }} options={[
                {value:'',label:'All Projects'},
                ...projects.map(p => ({ value: p.id, label: p.name }))
              ]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date From</label>
              <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date To</label>
              <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
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
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File Size (bytes)</label>
              <div className="flex gap-2">
                <Input type="number" placeholder="Min" value={sizeMin} onChange={e => { setSizeMin(e.target.value); setPage(1); }} className="w-1/2" />
                <Input type="number" placeholder="Max" value={sizeMax} onChange={e => { setSizeMax(e.target.value); setPage(1); }} className="w-1/2" />
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={favoritesOnly} onChange={e => { setFavoritesOnly(e.target.checked); setPage(1); }} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Favorites only</span>
              </label>
              <Button variant="ghost" size="sm" onClick={handleClear}>Clear all filters</Button>
            </div>
          </div>
        </Card>
      )}

      {(!query || query.length < 1) && !hasActiveFilters && (
        <Card className="py-12 text-center">
          <Search className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Search your assets</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Type a keyword, tag, or file name to find assets across all your projects. Use filters to narrow down results.
          </p>
        </Card>
      )}

      {(query.length >= 1 || hasActiveFilters) && (
        <>
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
            <span>{total} result{total !== 1 ? 's' : ''}</span>
            <span>Page {page} of {Math.ceil(total / 20)}</span>
          </div>

          {projects.length > 0 && (
            <div className="mb-8">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-blue-500" />
                Projects ({projects.length})
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map(project => (
                  <Card key={project.id} className="p-4 hover:shadow-lg transition-shadow">
                    <Link to={`/projects/${project.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <FolderKanban className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{project.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{project.description}</p>
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {assets.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <File className="h-5 w-5 text-green-500" />
                Assets ({assets.length})
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {assets.map(asset => (
                  <Card key={asset.id} className="p-0 overflow-hidden group">
                    <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                      {asset.mimeType.startsWith('image/') ? (
                        <img src={`/api/files/${asset.storagePath}`} alt={asset.originalName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <getFileIcon(asset.mimeType) className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {asset.isFavorite && <Star className="h-5 w-5 text-yellow-400 fill-current" />}
                        <Dropdown trigger={<MoreVertical className="h-5 w-5 text-gray-400 p-1 rounded-lg bg-white/90 dark:bg-gray-900/90" />} items={[
                          { label: 'Open', onClick: () => navigate(`/projects/${asset.projectId}/assets/${asset.id}`), icon: <Eye className="h-4 w-4" /> },
                          { label: 'Download', onClick: () => {}, icon: <Clock className="h-4 w-4" /> },
                        ]} align="right" />
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{asset.originalName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <FolderKanban className="h-3 w-3" />
                        <span className="truncate">{asset.project?.name}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatFileSize(asset.fileSize)} · {formatRelativeTime(asset.createdAt)}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {projects.length === 0 && assets.length === 0 && (query.length >= 1 || hasActiveFilters) && (
            <Card className="py-12">
              <EmptyState
                icon={<Search className="h-12 w-12" />}
                title="No results found"
                description={query ? `No matches for "${query}"` : 'No assets match your filters'}
                action={hasActiveFilters ? { label: 'Clear filters', onClick: handleClear } : undefined}
              />
            </Card>
          )}

          {Math.ceil(total / 20) > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {Math.ceil(total / 20)}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(Math.ceil(total / 20), p + 1))} disabled={page === Math.ceil(total / 20)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 animate-shimmer">
        <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </Card>
  );
}