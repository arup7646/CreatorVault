import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';

export interface TokenPayload {
  id: string;
  email: string;
  username: string;
  role: string;
  sessionId: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessTokenExpiry,
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshTokenExpiry,
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};

export const createSession = async (
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> => {
  const session = await prisma.session.create({
    data: {
      userId,
      token: '', // Will be set after generating tokens
      userAgent,
      ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  const payload: TokenPayload = {
    id: userId,
    email: '', // Will be filled by caller
    username: '', // Will be filled by caller
    role: '', // Will be filled by caller
    sessionId: session.id,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await prisma.session.update({
    where: { id: session.id },
    data: { token: refreshToken },
  });

  return { accessToken, refreshToken, sessionId: session.id };
};

export const revokeSession = async (sessionId: string): Promise<void> => {
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
};

export const revokeAllUserSessions = async (userId: string): Promise<void> => {
  await prisma.session.deleteMany({ where: { userId } });
};

export const getSessionByRefreshToken = async (refreshToken: string) => {
  return prisma.session.findUnique({ where: { token: refreshToken } });
};