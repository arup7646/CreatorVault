import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/errors';
import { authService } from '../services/auth.service';
import { validate } from '../middleware/validation';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, updateProfileSchema } from '../validation/schemas';
import { AuthRequest } from '../middleware/auth';

export const authController = {
  register: [
    validate(registerSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    }),
  ],

  login: [
    validate(loginSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await authService.login({
        ...req.body,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });
      res.json(result);
    }),
  ],

  logout: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      await authService.logout(req.sessionId!);
      res.json({ success: true });
    }),
  ],

  refreshToken: [
    asyncHandler(async (req: Request, res: Response) => {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }
      const result = await authService.refreshToken(refreshToken);
      res.json(result);
    }),
  ],

  forgotPassword: [
    validate(forgotPasswordSchema),
    asyncHandler(async (req: Request, res: Response) => {
      await authService.forgotPassword(req.body.email);
      res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    }),
  ],

  resetPassword: [
    validate(resetPasswordSchema),
    asyncHandler(async (req: Request, res: Response) => {
      await authService.resetPassword(req.body.token, req.body.password);
      res.json({ success: true, message: 'Password has been reset' });
    }),
  ],

  getProfile: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const profile = await authService.getProfile(req.user!.id);
      res.json(profile);
    }),
  ],

  updateProfile: [
    validate(updateProfileSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const profile = await authService.updateProfile(req.user!.id, req.body);
      res.json(profile);
    }),
  ],

  changePassword: [
    validate(changePasswordSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
      res.json({ success: true, message: 'Password changed. Please log in again.' });
    }),
  ],

  updateAvatar: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { avatarUrl } = req.body;
      if (!avatarUrl) {
        return res.status(400).json({ error: 'Avatar URL required' });
      }
      const user = await authService.updateAvatar(req.user!.id, avatarUrl);
      res.json(user);
    }),
  ],

  getSessions: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const sessions = await authService.getSessions(req.user!.id);
      res.json(sessions);
    }),
  ],

  revokeSession: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { sessionId } = req.params;
      await authService.logout(sessionId);
      res.json({ success: true });
    }),
  ],

  revokeAllSessions: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      await authService.logoutAll(req.user!.id);
      res.json({ success: true });
    }),
  ],

  deleteAccount: [
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ error: 'Password required' });
      }
      await authService.deleteAccount(req.user!.id, password);
      res.json({ success: true, message: 'Account deleted' });
    }),
  ],
};