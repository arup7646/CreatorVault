import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', ...projectController.create);
router.get('/', ...projectController.getAll);
router.get('/:id', ...projectController.getById);
router.patch('/:id', ...projectController.update);
router.delete('/:id', ...projectController.delete);

router.get('/:id/members', ...projectController.getMembers);
router.post('/:id/members', ...projectController.inviteMember);
router.patch('/:id/members/:userId', ...projectController.updateMemberRole);
router.delete('/:id/members/:userId', ...projectController.removeMember);
router.post('/:id/leave', ...projectController.leaveProject);

export default router;