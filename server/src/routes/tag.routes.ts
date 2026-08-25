import { Router } from 'express';
import { tagController } from '../controllers/tag.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/projects/:id/tags', ...tagController.getAll);
router.post('/projects/:id/tags', ...tagController.create);
router.patch('/projects/:id/tags/:tagId', ...tagController.update);
router.delete('/projects/:id/tags/:tagId', ...tagController.delete);

export default router;