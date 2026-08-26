import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, 
  FileImage, 
  HardDrive, 
  Star, 
  Plus, 
  Clock, 
  TrendingUp,
  BarChart2,
  Activity,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { projectApi, assetApi, activityApi } from '../api/endpoints';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { formatFileSize, formatRelativeTime, cn } from '../utils/helpers';
import { FileIcon } from '../components/ui/FileIcon';
import { Project, Asset, ActivityLog, DashboardStats } from '../types';
import toast from 'react-hot-toast';

const statsCards = [
  { name: 'Projects', icon: FolderKanban, color: 'bg-blue-500', href: '/projects' },
  { name: 'Assets', icon: FileImage, color: 'bg-green-500', href: '/projects' },
  { name: 'Storage Used', icon: HardDrive, color: 'bg-purple-500', href: '/projects' },
  { name: 'Favorites', icon: Star, color: 'bg-yellow-500', href: '/favorites' },
];

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [favoriteAssets, setFavoriteAssets] = useState<Asset[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, assetsRes, favoritesRes, activityRes] = await Promise.all([
          projectApi.getAll({ limit: 5, sort: 'newest' }),
          assetApi.getFavorites({ limit: 4 }),
          assetApi.getFavorites({ limit: 4 }),
          activityApi.getAll({ limit: 10 }),
        ]);

        const projects = projectsRes.data.projects;
        const totalAssets = projects.reduce((sum, p) => sum + p._count.assets, 0);
        const totalStorage = projects.reduce((sum, p) => {
          // We'd need a separate call for total storage, using placeholder for now
          return sum;
        }, 0);

        setStats({
          totalProjects: projectsRes.data.total,
          totalAssets,
          storageUsed: '0 B',
          storageRemaining: 'Unlimited',
          recentAssets: assetsRes.data.favorites,
          recentProjects: projects,
          favoriteAssets: favoritesRes.data.favorites,
          recentActivity: activityRes.data.logs,
        });
        setRecentProjects(projects);
        setRecentAssets(assetsRes.data.favorites);
        setFavoriteAssets(favoritesRes.data.favorites);
        setRecentActivity(activityRes.data.logs);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400">Welcome back, {user?.name || user?.username}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton variant="rectangular" key={i} height={100} className="rounded-xl p-6" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Welcome back, {user?.name || user?.username}</p>
        </div>
        <Link to="/projects/new">
          <Button className="gap-2"><Plus className="h-4 w-4" /> New Project</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Link key={index} href={stat.href} className="group">
            <Card className="p-6 flex items-center gap-4 hover:shadow-lg transition-shadow">
              <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', stat.color)}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {index === 0 ? stats?.totalProjects : index === 1 ? stats?.totalAssets : index === 2 ? stats?.storageUsed : stats?.totalProjects}
                </p>
              </div>
            </Card>
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Projects</h2>
            </div>
            <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1">
              View all <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <EmptyState
              icon={<FolderKanban className="h-12 w-12" />}
              title="No projects yet"
              description="Create your first project to start organizing your assets"
              action={{ label: 'Create Project', onClick: () => window.location.href = '/projects/new' }}
            />
          ) : (
            <div className="space-y-3">
              {recentProjects.slice(0, 5).map(project => (
                <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{project.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {project._count.assets} assets · {formatRelativeTime(project.updatedAt)}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            </div>
            <Link to="/activity" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1">
              View all <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-12 w-12" />}
              title="No recent activity"
              description="Your activity will appear here"
            />
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map(log => (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{log.user?.name || log.user?.username}</span> {log.action.toLowerCase().replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{log.entityType}: {log.entityId}</p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{formatRelativeTime(log.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileImage className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recently Uploaded</h2>
            </div>
            <Link to="/recent" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1">
              View all <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          {recentAssets.length === 0 ? (
            <EmptyState
              icon={<FileImage className="h-12 w-12" />}
              title="No recent uploads"
              description="Upload your first asset to get started"
              action={{ label: 'Upload Asset', onClick: () => window.location.href = '/projects' }}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentAssets.slice(0, 6).map(asset => (
                <Link key={asset.id} href={`/projects/${asset.projectId}/assets/${asset.id}`} className="group">
                  <Card className="p-0 overflow-hidden h-full group-hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                      {asset.mimeType.startsWith('image/') ? (
                        <img src={`/api/files/${asset.storagePath}`} alt={asset.originalName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileIcon mimeType={asset.mimeType} className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      {asset.isFavorite && (
                        <div className="absolute top-2 right-2">
                          <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{asset.originalName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <span>{formatFileSize(asset.fileSize)}</span>
                        <span>·</span>
                        <span>{formatRelativeTime(asset.createdAt)}</span>
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Favorites</h2>
            </div>
            <Link to="/favorites" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1">
              View all <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          {favoriteAssets.length === 0 ? (
            <EmptyState
              icon={<Star className="h-12 w-12 text-yellow-400" />}
              title="No favorites yet"
              description="Star your most important assets for quick access"
            />
          ) : (
            <div className="space-y-3">
              {favoriteAssets.slice(0, 5).map(asset => (
                <Link key={asset.id} href={`/projects/${asset.projectId}/assets/${asset.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                   <FileIcon mimeType={asset.mimeType} className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{asset.originalName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{asset.project?.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}