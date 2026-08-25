import { prisma } from '../utils/prisma';
import { NotFoundError, AuthorizationError } from '../utils/errors';

export interface SearchOptions {
  query?: string;
  type?: 'all' | 'projects' | 'assets';
  fileType?: string;
  projectId?: string;
  tagIds?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  sizeMin?: number;
  sizeMax?: number;
  favorites?: boolean;
  sort?: 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc';
  page?: number;
  limit?: number;
}

export const searchService = {
  async search(userId: string, options: SearchOptions) {
    const { query, type = 'all', fileType, projectId, tagIds, dateFrom, dateTo, sizeMin, sizeMax, favorites, sort = 'newest', page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const userProjects = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });

    const projectIds = userProjects.map(p => p.projectId);
    if (projectIds.length === 0) {
      return { projects: [], assets: [], total: 0, page, totalPages: 0 };
    }

    const whereProjects: any = { id: { in: projectIds }, isArchived: false };
    const whereAssets: any = { projectId: { in: projectIds }, status: 'ACTIVE' };

    if (query) {
      whereProjects.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
      whereAssets.OR = [
        { fileName: { contains: query, mode: 'insensitive' } },
        { originalName: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (projectId) {
      if (!projectIds.includes(projectId)) {
        throw new AuthorizationError('Not a member of this project');
      }
      whereProjects.id = projectId;
      whereAssets.projectId = projectId;
    }

    if (fileType) {
      whereAssets.mimeType = { startsWith: fileType };
    }

    if (tagIds?.length) {
      whereAssets.tags = { some: { tagId: { in: tagIds } } };
    }

    if (favorites) {
      whereAssets.favorites = { some: { userId } };
    }

    if (dateFrom || dateTo) {
      whereAssets.createdAt = {};
      if (dateFrom) whereAssets.createdAt.gte = dateFrom;
      if (dateTo) whereAssets.createdAt.lte = dateTo;
    }

    if (sizeMin || sizeMax) {
      whereAssets.fileSize = {};
      if (sizeMin) whereAssets.fileSize.gte = BigInt(sizeMin);
      if (sizeMax) whereAssets.fileSize.lte = BigInt(sizeMax);
    }

    let orderByProjects: any = { updatedAt: 'desc' };
    let orderByAssets: any = { createdAt: 'desc' };
    
    if (sort === 'oldest') {
      orderByProjects = { updatedAt: 'asc' };
      orderByAssets = { createdAt: 'asc' };
    } else if (sort === 'name_asc') {
      orderByProjects = { name: 'asc' };
      orderByAssets = { fileName: 'asc' };
    } else if (sort === 'name_desc') {
      orderByProjects = { name: 'desc' };
      orderByAssets = { fileName: 'desc' };
    } else if (sort === 'size_desc') {
      orderByAssets = { fileSize: 'desc' };
    } else if (sort === 'size_asc') {
      orderByAssets = { fileSize: 'asc' };
    }

    let projects: any[] = [];
    let assets: any[] = [];
    let totalProjects = 0;
    let totalAssets = 0;

    if (type === 'all' || type === 'projects') {
      [projects, totalProjects] = await Promise.all([
        prisma.project.findMany({
          where: whereProjects,
          skip: type === 'projects' ? skip : 0,
          take: type === 'projects' ? limit : 10,
          orderBy: orderByProjects,
          include: {
            owner: { select: { id: true, name: true, username: true, avatar: true } },
            tags: true,
            _count: { select: { assets: true, members: true } },
          },
        }),
        prisma.project.count({ where: whereProjects }),
      ]);
    }

    if (type === 'all' || type === 'assets') {
      [assets, totalAssets] = await Promise.all([
        prisma.asset.findMany({
          where: whereAssets,
          skip: type === 'assets' ? skip : 0,
          take: type === 'assets' ? limit : 10,
          orderBy: orderByAssets,
          include: {
            uploader: { select: { id: true, name: true, username: true, avatar: true } },
            project: { select: { id: true, name: true } },
            tags: { include: { tag: true } },
            _count: { select: { favorites: true } },
            favorites: { where: { userId }, select: { id: true } },
          },
        }),
        prisma.asset.count({ where: whereAssets }),
      ]);
    }

    const total = type === 'projects' ? totalProjects : type === 'assets' ? totalAssets : totalProjects + totalAssets;

    return {
      projects: projects.map(p => ({ ...p, isFavorite: false })),
      assets: assets.map(a => ({ ...a, isFavorite: a.favorites.length > 0 })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getSuggestions(userId: string, query: string) {
    const userProjects = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });

    const projectIds = userProjects.map(p => p.projectId);

    const [projectSuggestions, tagSuggestions] = await Promise.all([
      prisma.project.findMany({
        where: { id: { in: projectIds }, name: { contains: query, mode: 'insensitive' } },
        take: 5,
        select: { id: true, name: true },
      }),
      prisma.tag.findMany({
        where: { projectId: { in: projectIds }, name: { contains: query, mode: 'insensitive' } },
        take: 5,
        select: { id: true, name: true, color: true },
      }),
    ]);

    return { projects: projectSuggestions, tags: tagSuggestions };
  },
};