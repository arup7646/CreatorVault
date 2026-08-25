import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { activityService } from '../services/activity.service';
import { AuthRequest } from '../middleware/auth';

export const activityController = {
  getAll: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { userId, entityType, entityId, action, page, limit } = req.query;
      const isAdmin = req.user!.role === 'ADMIN';
      const result = await activityService.getAll(req.user!.id, {
        userId: userId as string,
        entityType: entityType as string,
        entityId: entityId as string,
        action: action as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      }, isAdmin);
      res.json(result);
    }),
  ],

  getProjectActivity: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { projectId } = req.params;
      const { page, limit } = req.query;
      const result = await activityService.getProjectActivity(req.user!.id, projectId, {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      });
      res.json(result);
    }),
  ],

  getSystemStats: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const stats = await activityService.getSystemStats();
      res.json(stats);
    }),
  ],
};