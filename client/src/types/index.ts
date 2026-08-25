export interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  bio?: string;
  avatar?: string;
  role: 'USER' | 'MANAGER' | 'ADMIN';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastActiveAt?: string;
  _count?: {
    ownedProjects: number;
    assets: number;
    favorites: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  ownerId: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  owner: Pick<User, 'id' | 'name' | 'username' | 'avatar'>;
  members: ProjectMember[];
  tags: Tag[];
  _count: { assets: number; members: number };
  userRole?: ProjectRole;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: string;
  user: Pick<User, 'id' | 'name' | 'username' | 'avatar' | 'email'>;
}

export type ProjectRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface Asset {
  id: string;
  projectId: string;
  uploaderId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: string | number;
  storagePath: string;
  storageProvider: string;
  description?: string;
  status: 'ACTIVE' | 'DELETED';
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  uploader: Pick<User, 'id' | 'name' | 'username' | 'avatar'>;
  tags: AssetTag[];
  _count: { favorites: number };
  favorites?: Array<{ id: string }>;
  isFavorite?: boolean;
  project?: Pick<Project, 'id' | 'name'>;
}

export interface AssetTag {
  assetId: string;
  tagId: string;
  tag: Tag;
}

export interface Tag {
  id: string;
  name: string;
  projectId: string;
  color: string;
  createdAt: string;
  _count?: { assets: number };
}

export interface Favorite {
  id: string;
  userId: string;
  assetId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  senderId?: string;
  type: 'PROJECT_INVITATION' | 'ROLE_CHANGE' | 'ASSET_UPLOADED' | 'REMOVED_FROM_PROJECT';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  sender?: Pick<User, 'id' | 'name' | 'username' | 'avatar'>;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: Pick<User, 'id' | 'name' | 'username' | 'avatar'>;
}

export interface PaginatedResponse<T> {
  projects?: T[];
  assets?: T[];
  users?: T[];
  logs?: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SearchResult {
  projects: Project[];
  assets: (Asset & { isFavorite: boolean })[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DashboardStats {
  totalProjects: number;
  totalAssets: number;
  storageUsed: string;
  storageRemaining: string;
  recentAssets: Asset[];
  recentProjects: Project[];
  favoriteAssets: Asset[];
  recentActivity: ActivityLog[];
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalAssets: number;
  totalStorage: string;
  uploadsToday: number;
  uploadsThisWeek: number;
  usersByRole: Array<{ role: string; count: number }>;
  assetsByType: Array<{ type: string; count: number; size: string }>;
  uploadsOverTime: Array<{ date: string; count: number }>;
}