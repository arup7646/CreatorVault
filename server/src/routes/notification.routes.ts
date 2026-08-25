import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', ...notificationController.getAll);
router.get('/unread-count', ...notificationController.getUnreadCount);
router.patch('/:id/read', ...notificationController.markAsRead);
router.post('/read-all', ...notificationController.markAllAsRead);
router.delete('/:id', ...notificationController.delete);

export default router;