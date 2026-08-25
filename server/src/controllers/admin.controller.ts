import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { adminService } from '../services/admin.service';
import { validate } from '../middleware/validation';
import { adminUserSchema, adminUpdateUserSchema } from '../validation/schemas';
import { AuthRequest } from '../middleware/auth';

export const adminController = {
  getUsers: [
    validate(adminUserSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { page, limit, search, role, status, sort } = req.query;
      const result = await adminService.getUsers({
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
        search: search as string,
        role: role as string,
        status: status as string,
        sort: sort as string,
      });
      res.json(result);
    }),
  ],

  getUserById: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const user = await adminService.getUserById(req.params.id);
      res.json(user);
    }),
  ],

  updateUser: [
    validate(adminUpdateUserSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const user = await adminService.updateUser(req.user!.id, req.params.id, req.body);
      res.json(user);
    }),
  ],

  deleteUser: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      await adminService.deleteUser(req.user!.id, req.params.id);
      res.json({ success: true });
    }),
  ],

  getStats: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const stats = await adminService.getSystemStats();
      res.json(stats);
    }),
  ],

  getActivityLogs: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { page, limit, userId } = req.query;
      const result = await adminService.getActivityLogs({
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 50,
        userId: userId as string,
      });
      res.json(result);
    }),
  ],
};