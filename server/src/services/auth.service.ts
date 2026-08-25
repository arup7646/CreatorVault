import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { createSession, revokeSession, revokeAllUserSessions, getSessionByRefreshToken } from '../utils/jwt';
import { sendPasswordResetEmail } from '../utils/email';
import { AppError, ValidationError, AuthenticationError, ConflictError, NotFoundError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
  userAgent?: string;
  ipAddress?: string;
}

export const authService = {
  async register(data: RegisterData) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new ConflictError('Email already registered');
      }
      throw new ConflictError('Username already taken');
    }

    const passwordHash = await bcrypt.hash(data.password, config.bcrypt.saltRounds);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash,
        name: data.name,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        entityType: 'USER',
        entityId: user.id,
      },
    });

    const { accessToken, refreshToken, sessionId } = await createSession(
      user.id,
      undefined,
      undefined
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    };
  },

  async login(data: LoginData) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is disabled');
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    const { accessToken, refreshToken, sessionId } = await createSession(
      user.id,
      data.userAgent,
      data.ipAddress
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGGED_IN',
        entityType: 'USER',
        entityId: user.id,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    };
  },

  async logout(sessionId: string) {
    await revokeSession(sessionId);
  },

  async logoutAll(userId: string) {
    await revokeAllUserSessions(userId);
  },

  async refreshToken(refreshToken: string) {
    const session = await getSessionByRefreshToken(refreshToken);
    
    if (!session || session.expiresAt < new Date()) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or disabled');
    }

    await revokeSession(session.id);

    const { accessToken, refreshToken: newRefreshToken, sessionId } = await createSession(
      user.id,
      undefined,
      undefined
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken: newRefreshToken,
    };
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return; // Don't reveal if email exists
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    await sendPasswordResetEmail(user.email, user.name || '', token, config.frontendUrl);
  },

  async resetPassword(token: string, password: string) {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      prisma.session.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    await prisma.activityLog.create({
      data: {
        userId: resetToken.userId,
        action: 'PASSWORD_RESET',
        entityType: 'USER',
        entityId: resetToken.userId,
      },
    });
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ValidationError('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      prisma.session.deleteMany({
        where: { userId },
      }),
    ]);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PASSWORD_CHANGED',
        entityType: 'USER',
        entityId: userId,
      },
    });
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        role: true,
        createdAt: true,
        lastActiveAt: true,
        _count: {
          select: {
            ownedProjects: true,
            assets: true,
            favorites: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  },

  async updateProfile(userId: string, data: { name?: string; username?: string; bio?: string; email?: string }) {
    if (data.username) {
      const existing = await prisma.user.findUnique({ where: { username: data.username } });
      if (existing && existing.id !== userId) {
        throw new ConflictError('Username already taken');
      }
    }

    if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing && existing.id !== userId) {
        throw new ConflictError('Email already registered');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        username: data.username,
        bio: data.bio,
        email: data.email,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  },

  async updateAvatar(userId: string, avatarUrl: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
      },
    });

    return user;
  },

  async deleteAccount(userId: string, password: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new ValidationError('Password is incorrect');
    }

    await prisma.user.delete({ where: { id: userId } });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'ACCOUNT_DELETED',
        entityType: 'USER',
        entityId: userId,
      },
    });
  },

  async getSessions(userId: string) {
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return sessions;
  },
};