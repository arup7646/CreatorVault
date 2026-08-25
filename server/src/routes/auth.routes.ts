import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', ...authController.register);
router.post('/login', ...authController.login);
router.post('/logout', authenticate, ...authController.logout);
router.post('/refresh', authController.refreshToken[0]);
router.post('/forgot-password', ...authController.forgotPassword);
router.post('/reset-password', ...authController.resetPassword);

router.get('/me', authenticate, ...authController.getProfile);
router.patch('/me', authenticate, ...authController.updateProfile);
router.post('/me/avatar', authenticate, ...authController.updateAvatar);
router.post('/change-password', authenticate, ...authController.changePassword);
router.get('/sessions', authenticate, ...authController.getSessions);
router.delete('/sessions/:sessionId', authenticate, ...authController.revokeSession);
router.post('/sessions/revoke-all', authenticate, ...authController.revokeAllSessions);
router.delete('/me', authenticate, ...authController.deleteAccount);

export default router;