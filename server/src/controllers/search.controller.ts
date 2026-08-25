import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { searchService } from '../services/search.service';
import { validate } from '../middleware/validation';
import { searchSchema } from '../validation/schemas';
import { AuthRequest } from '../middleware/auth';

export const searchController = {
  search: [
    validate(searchSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { q, type, fileType, projectId, tags, dateFrom, dateTo, sizeMin, sizeMax, favorites, sort, page, limit } = req.query;
      const result = await searchService.search(req.user!.id, {
        query: q as string,
        type: type as 'all' | 'projects' | 'assets',
        fileType: fileType as string,
        projectId: projectId as string,
        tagIds: tags ? (tags as string).split(',') : undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        sizeMin: sizeMin ? parseInt(sizeMin as string) : undefined,
        sizeMax: sizeMax ? parseInt(sizeMax as string) : undefined,
        favorites: favorites === 'true',
        sort: sort as any,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });
      res.json(result);
    }),
  ],

  suggestions: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { q } = req.query;
      if (!q || (q as string).length < 2) {
        return res.json({ projects: [], tags: [] });
      }
      const result = await searchService.getSuggestions(req.user!.id, q as string);
      res.json(result);
    }),
  ],
};