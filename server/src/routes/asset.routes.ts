import { Router } from 'express';
import { assetController } from '../controllers/asset.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/projects/:projectId/assets', ...assetController.upload);
router.get('/projects/:projectId/assets', ...assetController.getAll);
router.get('/projects/:projectId/assets/stats', ...assetController.getStats);
router.get('/projects/:projectId/assets/:assetId', ...assetController.getById);
router.patch('/projects/:projectId/assets/:assetId', ...assetController.update);
router.delete('/projects/:projectId/assets/:assetId', ...assetController.delete);
router.post('/projects/:projectId/assets/:assetId/restore', ...assetController.restore);
router.post('/projects/:projectId/assets/:assetId/favorite', ...assetController.toggleFavorite);
router.post('/projects/:projectId/assets/:assetId/move', ...assetController.move);
router.get('/projects/:projectId/assets/:assetId/download', ...assetController.download);
router.get('/projects/:projectId/assets/:assetId/url', ...assetController.getFileUrl);

router.get('/favorites', ...assetController.getFavorites);

export default router;