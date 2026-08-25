import { prisma } from '../utils/prisma';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors';
import bcrypt from 'bcryptjs';
import { config } from '../config';

export const adminService = {
  async getUsers(options: { page?: number; limit?: number; search?: string; role?: string; status?: string; sort?: string } = {}) {
    const { page = 1, limit = 20, search, role, status, sort = 'newest' } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) where.role = role;
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'name_asc') orderBy = { name: 'asc' };
    if (sort === 'name_desc') orderBy = { name: 'desc' };
    if (sort === 'last_active') orderBy = { lastActiveAt: 'desc' };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastActiveAt: true,
          _count: { select: { ownedProjects: true, assets: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, totalPages: Math.ceil(total / limit) };
  },

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        lastActiveAt: true,
        _count: { select: { ownedProjects: true, assets: true, favorites: true, notifications: true, sessions: true } },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  },

  async updateUser(adminId: string, userId: string, data: { role?: string; isActive?: boolean }) {
    if (adminId === userId && data.role) {
      throw new ValidationError('Cannot change your own role');
    }

    if (adminId === userId && data.isActive === false) {
      throw new ValidationError('Cannot disable your own account');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role === 'ADMIN' && data.role && data.role !== 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        throw new ValidationError('Cannot remove the last admin');
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        role: data.role as any,
        isActive: data.isActive,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (data.isActive === false) {
      await prisma.session.deleteMany({ where: { userId } });
    }

    await prisma.activityLog.create({
      data: {
        userId: adminId,
        action: data.isActive === false ? 'USER_DISABLED' : data.isActive === true ? 'USER_ENABLED' : 'USER_ROLE_CHANGED',
        entityType: 'USER',
        entityId: userId,
        metadata: { newRole: data.role, isActive: data.isActive },
      },
    });

    return updated;
  },

  async deleteUser(adminId: string, userId: string) {
    if (adminId === userId) {
      throw new ValidationError('Cannot delete your own account');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        throw new ValidationError('Cannot delete the last admin');
      }
    }

    await prisma.user.delete({ where: { id: userId } });

    await prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'USER_DELETED',
        entityType: 'USER',
        entityId: userId,
        metadata: { deletedUserEmail: user.email },
      },
    });

    return { success: true };
  },

  async getSystemStats() {
    return {
      totalUsers: await prisma.user.count(),
      activeUsers: await prisma.user.count({ where: { lastActiveAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      totalProjects: await prisma.project.count(),
      totalAssets: await prisma.asset.count({ where: { status: 'ACTIVE' } }),
      totalStorage: (await prisma.asset.aggregate({ where: { status: 'ACTIVE' }, _sum: { fileSize: true } }))._sum.fileSize?.toString() || '0',
      uploadsToday: await prisma.asset.count({ where: { status: 'ACTIVE', createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      uploadsThisWeek: await prisma.asset.count({ where: { status: 'ACTIVE', createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    };
  },

  async getActivityLogs(options: { page?: number; limit?: number; userId?: string } = {}) {
    const { page = 1, limit = 50, userId } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;

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
};