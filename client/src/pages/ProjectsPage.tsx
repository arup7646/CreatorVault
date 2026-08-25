import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  FolderKanban, 
  Archive,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Eye,
  ChevronDown
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { projectApi } from '../api/endpoints';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton, SkeletonProjectGrid } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Project, ProjectMember } from '../types';
import { formatRelativeTime, cn } from '../utils/helpers';
import toast from 'react-hot-toast';

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc';

export function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [archived, setArchived] = useState(false);
  const [debouncedSearch] = useDebounce(search, 300);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', tags: '' });
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / 20);

  useEffect(() => {
    fetchProjects();
  }, [debouncedSearch, sort, archived, page]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await projectApi.getAll({ search: debouncedSearch, sort, archived, page, limit: 20 });
      setProjects(res.data.projects);
      setTotal(res.data.total);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const tags = createForm.tags.split(',').map(t => t.trim()).filter(Boolean);
      await projectApi.create({ name: createForm.name, description: createForm.description, tags });
      toast.success('Project created');
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', tags: '' });
      fetchProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await projectApi.delete(id);
      toast.success('Project deleted');
      fetchProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };

  const handleArchive = async (id: string, isArchived: boolean) => {
    try {
      await projectApi.update(id, { isArchived: !isArchived });
      toast.success(isArchived ? 'Project restored' : 'Project archived');
      fetchProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update project');
    }
  };

  const getMemberAvatars = (members: ProjectMember[]) => {
    return members.slice(0, 3).map(m => (
      <Avatar key={m.userId} src={m.user.avatar} name={m.user.name || m.user.username} size="xs" className="border-2 border-white dark:border-gray-900 -ml-1 first:ml-0" />
    ));
  };

  const projectMenuItems = (project: Project): DropdownItem[] => [
    { label: 'Open', onClick: () => navigate(`/projects/${project.id}`), icon: <Eye className="h-4 w-4" /> },
    { label: 'Edit', onClick: () => navigate(`/projects/${project.id}/edit`), icon: <Edit className="h-4 w-4" /> },
    { label: 'Members', onClick: () => navigate(`/projects/${project.id}/members`), icon: <Users className="h-4 w-4" /> },
    project.isArchived 
      ? { label: 'Restore', onClick: () => handleArchive(project.id, true), icon: <FolderKanban className="h-4 w-4" /> }
      : { label: 'Archive', onClick: () => handleArchive(project.id, false), icon: <Archive className="h-4 w-4" /> },
    { label: 'Delete', onClick: () => handleDelete(project.id), icon: <Trash2 className="h-4 w-4" />, dangerous: true },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your projects and collaborate with your team</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2"><Plus className="h-4 w-4" /> New Project</Button>
        </div>
        <SkeletonProjectGrid />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your projects and collaborate with your team</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2"><Plus className="h-4 w-4" /> New Project</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={sort}
            onChange={e => { setSort(e.target.value as SortOption); setPage(1); }}
            options={[
              { value: 'newest', label: 'Newest first' },
              { value: 'oldest', label: 'Oldest first' },
              { value: 'name_asc', label: 'Name A-Z' },
              { value: 'name_desc', label: 'Name Z-A' },
            ]}
            className="w-40"
          />
          <Button variant="outline" size="sm" onClick={() => setArchived(!archived)} className={cn(archived && 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-800')}>
            <Archive className="h-4 w-4 mr-1" /> {archived ? 'Active' : 'Archived'}
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

      {projects.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            icon={<FolderKanban className="h-12 w-12" />}
            title={archived ? 'No archived projects' : search ? `No projects found for "${search}"` : 'No projects yet'}
            description={archived ? 'Archived projects will appear here' : search ? 'Try adjusting your search' : 'Create your first project to start organizing your assets'}
            action={!archived && !search ? { label: 'Create Project', onClick: () => setShowCreateModal(true) } : undefined}
          />
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map(project => (
                <Card key={project.id} className="flex flex-col h-full group">
                  <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-t-xl overflow-hidden">
                    {project.coverImage ? (
                      <img src={project.coverImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FolderKanban className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    {project.isArchived && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="outline" size="sm"><Archive className="h-3 w-3 mr-1" /> Archived</Badge>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        {getMemberAvatars(project.members)}
                        {project.members.length > 3 && (
                          <Badge variant="outline" size="sm" className="self-center">+{project.members.length - 3}</Badge>
                        )}
                      </div>
                      <Dropdown trigger={<MoreVertical className="h-5 w-5 text-gray-400 p-1 rounded-lg bg-white/90 dark:bg-gray-900/90" />} items={projectMenuItems(project)} align="right" />
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{project.name}</h3>
                    {project.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 flex-1">{project.description}</p>}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{project._count.assets} assets</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">·</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(project.updatedAt)}</span>
                    </div>
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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Members</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assets</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Updated</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {projects.map(project => (
                      <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                              <FolderKanban className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{project.name}</p>
                              {project.description && <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{project.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex -space-x-2">
                            {getMemberAvatars(project.members)}
                            {project.members.length > 3 && <Badge variant="outline" size="sm" className="ml-1 self-center">+{project.members.length - 3}</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{project._count.assets}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatRelativeTime(project.updatedAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <Dropdown trigger={<MoreVertical className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded" />} items={projectMenuItems(project)} align="right" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
            </div>
          )}
        </>
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Project" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Project Name"
            value={createForm.name}
            onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="My Awesome Project"
            required
            error={!createForm.name && creating ? 'Name is required' : undefined}
            autoFocus
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description (optional)</label>
            <textarea
              value={createForm.description}
              onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="What's this project about?"
            />
          </div>
          <Input
            label="Tags (comma separated)"
            value={createForm.tags}
            onChange={e => setCreateForm(prev => ({ ...prev, tags: e.target.value }))}
            placeholder="design, frontend, ui"
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={creating}>Create Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}