import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { tagService } from '../services/tag.service';
import { validate } from '../middleware/validation';
import { projectIdSchema, createTagSchema, updateTagSchema } from '../validation/schemas';
import { AuthRequest } from '../middleware/auth';

export const tagController = {
  getAll: [
    validate(projectIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const tags = await tagService.getAll(req.params.id, req.user!.id);
      res.json(tags);
    }),
  ],

  create: [
    validate(createTagSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const tag = await tagService.create(req.params.id, req.user!.id, req.body.name, req.body.color);
      res.status(201).json(tag);
    }),
  ],

  update: [
    validate(updateTagSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const tag = await tagService.update(req.params.id, req.user!.id, req.params.tagId, req.body);
      res.json(tag);
    }),
  ],

  delete: [
    validate(updateTagSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      await tagService.delete(req.params.id, req.user!.id, req.params.tagId);
      res.json({ success: true });
    }),
  ],
};