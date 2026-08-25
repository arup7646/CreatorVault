import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/users', ...adminController.getUsers);
router.get('/users/:id', ...adminController.getUserById);
router.patch('/users/:id', ...adminController.updateUser);
router.delete('/users/:id', ...adminController.deleteUser);
router.get('/stats', ...adminController.getStats);
router.get('/activity', ...adminController.getActivityLogs);

export default router;