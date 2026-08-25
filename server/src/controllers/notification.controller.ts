import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { notificationService } from '../services/notification.service';
import { validate } from '../middleware/validation';
import { notificationIdSchema } from '../validation/schemas';
import { AuthRequest } from '../middleware/auth';

export const notificationController = {
  getAll: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { unreadOnly, page, limit } = req.query;
      const result = await notificationService.getAll(req.user!.id, {
        unreadOnly: unreadOnly === 'true',
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });
      res.json(result);
    }),
  ],

  getUnreadCount: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const result = await notificationService.getUnreadCount(req.user!.id);
      res.json(result);
    }),
  ],

  markAsRead: [
    validate(notificationIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const notification = await notificationService.markAsRead(req.user!.id, req.params.id);
      res.json(notification);
    }),
  ],

  markAllAsRead: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const result = await notificationService.markAllAsRead(req.user!.id);
      res.json(result);
    }),
  ],

  delete: [
    validate(notificationIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      await notificationService.delete(req.user!.id, req.params.id);
      res.json({ success: true });
    }),
  ],
};