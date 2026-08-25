import { prisma } from '../utils/prisma';
import { NotFoundError, AuthorizationError } from '../utils/errors';

export const notificationService = {
  async getAll(userId: string, options: { unreadOnly?: boolean; page?: number; limit?: number } = {}) {
    const { unreadOnly = false, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (unreadOnly) where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, name: true, username: true, avatar: true } },
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { notifications, total, unreadCount, page, totalPages: Math.ceil(total / limit) };
  },

  async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new AuthorizationError('Not your notification');
    }

    if (notification.isRead) return notification;

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
      include: { sender: { select: { id: true, name: true, username: true, avatar: true } } },
    });
  },

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true };
  },

  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  },

  async delete(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new AuthorizationError('Not your notification');
    }

    await prisma.notification.delete({ where: { id: notificationId } });
    return { success: true };
  },
};