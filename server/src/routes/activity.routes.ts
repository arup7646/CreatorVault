import { Router } from 'express';
import { activityController } from '../controllers/activity.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', ...activityController.getAll);
router.get('/project/:projectId', ...activityController.getProjectActivity);
router.get('/stats', authorize('ADMIN'), ...activityController.getSystemStats);

export default router;