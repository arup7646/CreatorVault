import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { assetService } from '../services/asset.service';
import { validate } from '../middleware/validation';
import { assetIdSchema, updateAssetSchema, moveAssetSchema, addTagsSchema, projectIdSchema } from '../validation/schemas';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import { getStorageProvider, isAllowedFileType, formatFileSize, getFileTypeFromMime } from '../utils/storage';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (isAllowedFileType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

export const assetController = {
  upload: [
    upload.array('files', 20),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { projectId } = req.params;
      const files = req.files as Express.Multer.File[];
      const { description, tagIds } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const assets = await Promise.all(
        files.map(file => assetService.upload({
          projectId,
          uploaderId: req.user!.id,
          file,
          description,
          tagIds: tagIds ? JSON.parse(tagIds) : undefined,
        }))
      );

      res.status(201).json(assets);
    }),
  ],

  getAll: [
    validate(projectIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { status, page, limit, search, sort, fileType, tags, favorites, dateFrom, dateTo, sizeMin, sizeMax } = req.query;
      const result = await assetService.getAll(req.params.id, req.user!.id, {
        status: status as 'ACTIVE' | 'DELETED' || 'ACTIVE',
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        search: search as string,
        sort: sort as string,
        fileType: fileType as string,
        tagIds: tags ? (tags as string).split(',') : undefined,
        favorites: favorites === 'true',
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        sizeMin: sizeMin ? parseInt(sizeMin as string) : undefined,
        sizeMax: sizeMax ? parseInt(sizeMax as string) : undefined,
      });
      res.json(result);
    }),
  ],

  getById: [
    validate(assetIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const asset = await assetService.getById(req.params.id, req.user!.id, req.params.assetId);
      res.json(asset);
    }),
  ],

  update: [
    validate(updateAssetSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const asset = await assetService.update(req.user!.id, req.params.assetId, req.body);
      res.json(asset);
    }),
  ],

  delete: [
    validate(assetIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { permanent } = req.query;
      await assetService.delete(req.user!.id, req.params.assetId, permanent === 'true');
      res.json({ success: true });
    }),
  ],

  restore: [
    validate(assetIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const asset = await assetService.restore(req.user!.id, req.params.assetId);
      res.json(asset);
    }),
  ],

  toggleFavorite: [
    validate(assetIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const result = await assetService.toggleFavorite(req.user!.id, req.params.assetId);
      res.json(result);
    }),
  ],

  getFavorites: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { page, limit } = req.query;
      const result = await assetService.getFavorites(req.user!.id, {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });
      res.json(result);
    }),
  ],

  move: [
    validate(moveAssetSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const asset = await assetService.move(req.user!.id, req.params.assetId, req.body.targetProjectId);
      res.json(asset);
    }),
  ],

  download: [
    validate(assetIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { buffer, fileName, mimeType } = await assetService.download(req.user!.id, req.params.assetId);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(buffer);
    }),
  ],

  getFileUrl: [
    validate(assetIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const url = await assetService.getFileUrl(req.params.assetId);
      res.json({ url });
    }),
  ],

  getStats: [
    validate(projectIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const stats = await assetService.getStats(req.params.id, req.user!.id);
      res.json(stats);
    }),
  ],
};