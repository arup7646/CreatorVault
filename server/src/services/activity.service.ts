import { prisma } from '../utils/prisma';
import { NotFoundError, AuthorizationError } from '../utils/errors';

export interface ActivityLogOptions {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  page?: number;
  limit?: number;
}

export const activityService = {
  async getAll(userId: string, options: ActivityLogOptions = {}, isAdmin = false) {
    const { userId: targetUserId, entityType, entityId, action, page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (!isAdmin) {
      where.userId = userId;
    } else if (targetUserId) {
      where.userId = targetUserId;
    }

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return { logs, total, page, totalPages: Math.ceil(total / limit) };
  },

  async getProjectActivity(userId: string, projectId: string, options: { page?: number; limit?: number } = {}) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { where: { userId } } },
    });

    if (!project || project.members.length === 0) {
      throw new NotFoundError('Project not found or access denied');
    }

    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: {
          OR: [
            { entityType: 'PROJECT', entityId: projectId },
            { entityType: 'ASSET', entityId: { in: [] } }, // Will be filled
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true } },
        },
      }),
      prisma.activityLog.count({
        where: {
          OR: [
            { entityType: 'PROJECT', entityId: projectId },
          ],
        },
      }),
    ]);

    // Also get asset activities for this project
    const assetIds = await prisma.asset.findMany({
      where: { projectId },
      select: { id: true },
    });

    const assetLogWhere = {
      entityType: 'ASSET',
      entityId: { in: assetIds.map(a => a.id) },
    };

    const [assetLogs, assetTotal] = await Promise.all([
      prisma.activityLog.findMany({
        where: assetLogWhere,
        skip: 0,
        take: limit - logs.length,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true } },
        },
      }),
      prisma.activityLog.count({ where: assetLogWhere }),
    ]);

    const allLogs = [...logs, ...assetLogs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);

    return { logs: allLogs, total: total + assetTotal, page, totalPages: Math.ceil((total + assetTotal) / limit) };
  },

  async getSystemStats() {
    const [totalUsers, activeUsers, totalProjects, totalAssets, totalStorage, uploadsToday, uploadsThisWeek] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastActiveAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      prisma.project.count(),
      prisma.asset.count({ where: { status: 'ACTIVE' } }),
      prisma.asset.aggregate({ where: { status: 'ACTIVE' }, _sum: { fileSize: true } }),
      prisma.asset.count({
        where: {
          status: 'ACTIVE',
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.asset.count({
        where: {
          status: 'ACTIVE',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const [usersByRole, assetsByType, uploadsOverTime] = await Promise.all([
      prisma.user.groupBy({ by: ['role'], _count: true }),
      prisma.asset.groupBy({ by: ['mimeType'], where: { status: 'ACTIVE' }, _count: true, _sum: { fileSize: true } }),
      prisma.asset.groupBy({
        by: ['createdAt'],
        where: { status: 'ACTIVE', createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        _count: true,
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalProjects,
      totalAssets,
      totalStorage: totalStorage._sum.fileSize?.toString() || '0',
      uploadsToday,
      uploadsThisWeek,
      usersByRole: usersByRole.map(r => ({ role: r.role, count: r._count })),
      assetsByType: assetsByType.map(a => ({ type: a.mimeType, count: a._count, size: a._sum.fileSize?.toString() || '0' })),
      uploadsOverTime: uploadsOverTime.map(u => ({ date: u.createdAt, count: u._count })),
    };
  },
};