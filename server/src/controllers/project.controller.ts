import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { projectService } from '../services/project.service';
import { validate } from '../middleware/validation';
import { createProjectSchema, updateProjectSchema, projectIdSchema, inviteMemberSchema, updateMemberRoleSchema } from '../validation/schemas';
import { AuthRequest } from '../middleware/auth';

export const projectController = {
  create: [
    validate(createProjectSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const project = await projectService.create(req.user!.id, req.body);
      res.status(201).json(project);
    }),
  ],

  getAll: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { archived, page, limit, search, sort } = req.query;
      const result = await projectService.getAll(req.user!.id, {
        archived: archived === 'true',
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        search: search as string,
        sort: sort as string,
      });
      res.json(result);
    }),
  ],

  getById: [
    validate(projectIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const project = await projectService.getById(req.user!.id, req.params.id);
      res.json(project);
    }),
  ],

  update: [
    validate(updateProjectSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const project = await projectService.update(req.user!.id, req.params.id, req.body);
      res.json(project);
    }),
  ],

  delete: [
    validate(projectIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      await projectService.delete(req.user!.id, req.params.id);
      res.json({ success: true });
    }),
  ],

  getMembers: [
    validate(projectIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const members = await projectService.getMembers(req.params.id);
      res.json(members);
    }),
  ],

  inviteMember: [
    validate(inviteMemberSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const member = await projectService.inviteMember(req.params.id, req.user!.id, req.body.email, req.body.role);
      res.status(201).json(member);
    }),
  ],

  updateMemberRole: [
    validate(updateMemberRoleSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const member = await projectService.updateMemberRole(req.params.id, req.user!.id, req.params.userId, req.body.role);
      res.json(member);
    }),
  ],

  removeMember: [
    validate(projectIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      await projectService.removeMember(req.params.id, req.user!.id, req.params.userId);
      res.json({ success: true });
    }),
  ],

  leaveProject: [
    validate(projectIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      await projectService.leaveProject(req.params.id, req.user!.id);
      res.json({ success: true });
    }),
  ],
};