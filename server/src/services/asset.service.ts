import { prisma } from '../utils/prisma';
import { AppError, NotFoundError, AuthorizationError, ValidationError } from '../utils/errors';
import { getStorageProvider, generateSafeFileName, isAllowedFileType, formatFileSize, getFileTypeFromMime } from '../utils/storage';

export interface UploadAssetData {
  projectId: string;
  uploaderId: string;
  file: Express.Multer.File;
  description?: string;
  tagIds?: string[];
}

export interface UpdateAssetData {
  fileName?: string;
  description?: string | null;
  tagIds?: string[];
}

export const assetService = {
  async upload(data: UploadAssetData) {
    const { projectId, uploaderId, file, description, tagIds } = data;

    if (!isAllowedFileType(file.mimetype)) {
      throw new ValidationError(`File type ${file.mimetype} is not allowed`);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const membership = project.members.find(m => m.userId === uploaderId);
    if (!membership || membership.role === 'VIEWER') {
      throw new AuthorizationError('Insufficient permissions to upload');
    }

    const storage = getStorageProvider();
    const destination = `projects/${projectId}/assets`;
    const safeName = generateSafeFileName(file.originalname);
    const storagePath = await storage.upload(file, destination);

    const asset = await prisma.asset.create({
      data: {
        projectId,
        uploaderId,
        fileName: safeName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: BigInt(file.size),
        storagePath,
        storageProvider: 'local',
        description,
        tags: tagIds?.length
          ? {
              create: tagIds.map(tagId => ({ tagId })),
            }
          : undefined,
      },
      include: {
        uploader: { select: { id: true, name: true, username: true, avatar: true } },
        tags: { include: { tag: true } },
        _count: { select: { favorites: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: uploaderId,
        action: 'ASSET_UPLOADED',
        entityType: 'ASSET',
        entityId: asset.id,
        metadata: { fileName: asset.originalName, fileSize: asset.fileSize.toString() },
      },
    });

    const otherMembers = project.members
      .filter(m => m.userId !== uploaderId)
      .map(m => m.userId);

    if (otherMembers.length > 0) {
      await prisma.notification.createMany({
        data: otherMembers.map(userId => ({
          userId,
          senderId: uploaderId,
          type: 'ASSET_UPLOADED',
          title: 'New Asset Uploaded',
          message: `New file "${asset.originalName}" uploaded to "${project.name}"`,
          data: { projectId, assetId: asset.id },
        })),
      });
    }

    return asset;
  },

  async getAll(projectId: string, userId: string, options: {
    status?: 'ACTIVE' | 'DELETED';
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    fileType?: string;
    tagIds?: string[];
    favorites?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
    sizeMin?: number;
    sizeMax?: number;
  } = {}) {
    const { status = 'ACTIVE', page = 1, limit = 20, search, sort = 'newest', fileType, tagIds, favorites, dateFrom, dateTo, sizeMin, sizeMax } = options;
    const skip = (page - 1) * limit;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { where: { userId } } },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (project.members.length === 0) {
      throw new AuthorizationError('Not a member of this project');
    }

    const where: any = {
      projectId,
      status,
    };

    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (fileType) {
      where.mimeType = { startsWith: fileType };
    }

    if (tagIds?.length) {
      where.tags = { some: { tagId: { in: tagIds } } };
    }

    if (favorites) {
      where.favorites = { some: { userId } };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    if (sizeMin || sizeMax) {
      where.fileSize = {};
      if (sizeMin) where.fileSize.gte = BigInt(sizeMin);
      if (sizeMax) where.fileSize.lte = BigInt(sizeMax);
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'name_asc') orderBy = { fileName: 'asc' };
    if (sort === 'name_desc') orderBy = { fileName: 'desc' };
    if (sort === 'size_desc') orderBy = { fileSize: 'desc' };
    if (sort === 'size_asc') orderBy = { fileSize: 'asc' };

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          uploader: { select: { id: true, name: true, username: true, avatar: true } },
          tags: { include: { tag: true } },
          _count: { select: { favorites: true } },
        },
      }),
      prisma.asset.count({ where }),
    ]);

    return { assets, total, page, totalPages: Math.ceil(total / limit) };
  },

  async getById(projectId: string, userId: string, assetId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { where: { userId } } },
    });

    if (!project || project.members.length === 0) {
      throw new NotFoundError('Project not found or access denied');
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        uploader: { select: { id: true, name: true, username: true, avatar: true } },
        tags: { include: { tag: true } },
        _count: { select: { favorites: true } },
        favorites: { where: { userId }, select: { id: true } },
      },
    });

    if (!asset || asset.projectId !== projectId) {
      throw new NotFoundError('Asset not found');
    }

    return { ...asset, isFavorite: asset.favorites.length > 0 };
  },

  async update(userId: string, assetId: string, data: UpdateAssetData) {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { project: { include: { members: { where: { userId } } } } },
    });

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    const membership = asset.project.members[0];
    if (!membership || membership.role === 'VIEWER') {
      throw new AuthorizationError('Insufficient permissions');
    }

    const updateData: any = {};
    if (data.fileName !== undefined) updateData.fileName = data.fileName;
    if (data.description !== undefined) updateData.description = data.description;

    if (data.tagIds !== undefined) {
      await prisma.assetTag.deleteMany({ where: { assetId } });
      if (data.tagIds.length > 0) {
        await prisma.assetTag.createMany({
          data: data.tagIds.map(tagId => ({ assetId, tagId })),
          skipDuplicates: true,
        });
      }
    }

    const updated = await prisma.asset.update({
      where: { id: assetId },
      data: updateData,
      include: {
        uploader: { select: { id: true, name: true, username: true, avatar: true } },
        tags: { include: { tag: true } },
        _count: { select: { favorites: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'ASSET_UPDATED',
        entityType: 'ASSET',
        entityId: assetId,
        metadata: { changes: Object.keys(data) },
      },
    });

    return updated;
  },

  async delete(userId: string, assetId: string, permanent = false) {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { project: { include: { members: { where: { userId } } } } },
    });

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    const membership = asset.project.members[0];
    if (!membership || membership.role === 'VIEWER') {
      throw new AuthorizationError('Insufficient permissions');
    }

    if (permanent || asset.status === 'DELETED') {
      const storage = getStorageProvider();
      await storage.delete(asset.storagePath).catch(() => {});
      await prisma.asset.delete({ where: { id: assetId } });

      await prisma.activityLog.create({
        data: {
          userId,
          action: 'ASSET_PERMANENTLY_DELETED',
          entityType: 'ASSET',
          entityId: assetId,
          metadata: { fileName: asset.originalName },
        },
      });
    } else {
      await prisma.asset.update({
        where: { id: assetId },
        data: { status: 'DELETED', deletedAt: new Date() },
      });

      await prisma.activityLog.create({
        data: {
          userId,
          action: 'ASSET_DELETED',
          entityType: 'ASSET',
          entityId: assetId,
          metadata: { fileName: asset.originalName },
        },
      });
    }
  },

  async restore(userId: string, assetId: string) {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { project: { include: { members: { where: { userId } } } } },
    });

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    if (asset.status !== 'DELETED') {
      throw new ValidationError('Asset is not deleted');
    }

    const membership = asset.project.members[0];
    if (!membership) {
      throw new AuthorizationError('Not a member of this project');
    }

    const restored = await prisma.asset.update({
      where: { id: assetId },
      data: { status: 'ACTIVE', deletedAt: null },
      include: {
        uploader: { select: { id: true, name: true, username: true, avatar: true } },
        tags: { include: { tag: true } },
        _count: { select: { favorites: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'ASSET_RESTORED',
        entityType: 'ASSET',
        entityId: assetId,
        metadata: { fileName: asset.originalName },
      },
    });

    return restored;
  },

  async toggleFavorite(userId: string, assetId: string) {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { project: { include: { members: { where: { userId } } } } },
    });

    if (!asset || asset.project.members.length === 0) {
      throw new NotFoundError('Asset not found or access denied');
    }

    const existing = await prisma.favorite.findUnique({
      where: { userId_assetId: { userId, assetId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    } else {
      await prisma.favorite.create({ data: { userId, assetId } });
      
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'ASSET_FAVORITED',
          entityType: 'ASSET',
          entityId: assetId,
        },
      });

      return { favorited: true };
    }
  },

  async getFavorites(userId: string, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          asset: {
            include: {
              uploader: { select: { id: true, name: true, username: true, avatar: true } },
              project: { select: { id: true, name: true } },
              tags: { include: { tag: true } },
              _count: { select: { favorites: true } },
            },
          },
        },
      }),
      prisma.favorite.count({ where: { userId } }),
    ]);

    return { favorites: favorites.map(f => ({ ...f.asset, isFavorite: true })), total, page, totalPages: Math.ceil(total / limit) };
  },

  async move(userId: string, assetId: string, targetProjectId: string) {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { 
        project: { include: { members: { where: { userId } } } },
      },
    });

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    const sourceMembership = asset.project.members[0];
    if (!sourceMembership || sourceMembership.role === 'VIEWER') {
      throw new AuthorizationError('Insufficient permissions');
    }

    const targetProject = await prisma.project.findUnique({
      where: { id: targetProjectId },
      include: { members: { where: { userId } } },
    });

    if (!targetProject) {
      throw new NotFoundError('Target project not found');
    }

    const targetMembership = targetProject.members[0];
    if (!targetMembership || targetMembership.role === 'VIEWER') {
      throw new AuthorizationError('Insufficient permissions in target project');
    }

    const updated = await prisma.asset.update({
      where: { id: assetId },
      data: { projectId: targetProjectId },
      include: {
        uploader: { select: { id: true, name: true, username: true, avatar: true } },
        tags: { include: { tag: true } },
        _count: { select: { favorites: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'ASSET_MOVED',
        entityType: 'ASSET',
        entityId: assetId,
        metadata: { fromProjectId: asset.projectId, toProjectId: targetProjectId },
      },
    });

    return updated;
  },

  async download(userId: string, assetId: string) {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { project: { include: { members: { where: { userId } } } } },
    });

    if (!asset || asset.project.members.length === 0) {
      throw new NotFoundError('Asset not found or access denied');
    }

    const storage = getStorageProvider();
    const fileBuffer = await storage.download(asset.storagePath);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'ASSET_DOWNLOADED',
        entityType: 'ASSET',
        entityId: assetId,
        metadata: { fileName: asset.originalName },
      },
    });

    return { buffer: fileBuffer, fileName: asset.originalName, mimeType: asset.mimeType };
  },

  async getFileUrl(assetId: string) {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { storagePath: true, storageProvider: true },
    });

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    const storage = getStorageProvider();
    return storage.getPublicUrl(asset.storagePath);
  },

  async getStats(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { where: { userId } } },
    });

    if (!project || project.members.length === 0) {
      throw new NotFoundError('Project not found or access denied');
    }

    const [totalAssets, totalSize, byType, recentAssets] = await Promise.all([
      prisma.asset.count({ where: { projectId, status: 'ACTIVE' } }),
      prisma.asset.aggregate({ where: { projectId, status: 'ACTIVE' }, _sum: { fileSize: true } }),
      prisma.asset.groupBy({ by: ['mimeType'], where: { projectId, status: 'ACTIVE' }, _count: true, _sum: { fileSize: true } }),
      prisma.asset.findMany({ where: { projectId, status: 'ACTIVE' }, take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, originalName: true, mimeType: true, fileSize: true, createdAt: true } }),
    ]);

    return {
      totalAssets,
      totalSize: totalSize._sum.fileSize?.toString() || '0',
      byType: byType.map(t => ({ type: t.mimeType, count: t._count, size: t._sum.fileSize?.toString() || '0' })),
      recentAssets,
    };
  },
};