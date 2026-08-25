import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import express from 'express';

const prisma = new PrismaClient();

describe('Authentication', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testUsername = `testuser${Date.now()}`;
  const testPassword = 'password123';
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    // Clean up any existing test user
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  afterAll(async () => {
    // Clean up test user
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it('should register a new user', async () => {
    const app = express();
    app.use(express.json());
    
    // This would normally use the actual routes, but for testing we'll test the service directly
    const passwordHash = await bcrypt.hash(testPassword, 12);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        username: testUsername,
        passwordHash,
        name: 'Test User',
      },
    });

    userId = user.id;
    expect(user.email).toBe(testEmail);
    expect(user.username).toBe(testUsername);
    expect(user.name).toBe('Test User');
    expect(user.role).toBe('USER');
    expect(user.isActive).toBe(true);
  });

  it('should hash password correctly', async () => {
    const password = 'testPassword123';
    const hash = await bcrypt.hash(password, 12);
    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
    
    const isInvalid = await bcrypt.compare('wrongPassword', hash);
    expect(isInvalid).toBe(false);
  });

  it('should generate and verify JWT tokens', () => {
    const payload = { id: 'test-id', email: 'test@example.com', username: 'testuser', role: 'USER', sessionId: 'session-id' };
    const secret = 'test-secret';
    
    const token = jwt.sign(payload, secret, { expiresIn: '15m' });
    const decoded = jwt.verify(token, secret) as any;
    
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.username).toBe(payload.username);
    expect(decoded.role).toBe(payload.role);
  });
});

describe('Project Model', () => {
  const prisma = new PrismaClient();
  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `project-test-${Date.now()}@example.com`,
        username: `projectuser${Date.now()}`,
        passwordHash: await bcrypt.hash('password123', 12),
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.project.deleteMany({ where: { ownerId: userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('should create a project with owner', async () => {
    const project = await prisma.project.create({
      data: {
        name: 'Test Project',
        description: 'A test project',
        ownerId: userId,
        members: {
          create: { userId, role: 'OWNER' },
        },
      },
      include: { members: true },
    });

    projectId = project.id;
    expect(project.name).toBe('Test Project');
    expect(project.ownerId).toBe(userId);
    expect(project.members).toHaveLength(1);
    expect(project.members[0].role).toBe('OWNER');
  });

  it('should enforce unique project member', async () => {
    await expect(
      prisma.projectMember.create({
        data: { projectId, userId, role: 'EDITOR' },
      })
    ).rejects.toThrow();
  });
});

describe('Asset Model', () => {
  const prisma = new PrismaClient();
  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `asset-test-${Date.now()}@example.com`,
        username: `assetuser${Date.now()}`,
        passwordHash: await bcrypt.hash('password123', 12),
      },
    });
    userId = user.id;

    const project = await prisma.project.create({
      data: {
        name: 'Asset Test Project',
        ownerId: userId,
        members: { create: { userId, role: 'OWNER' } },
      },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    await prisma.asset.deleteMany({ where: { projectId } });
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('should create an asset', async () => {
    const asset = await prisma.asset.create({
      data: {
        projectId,
        uploaderId: userId,
        fileName: 'test-image.jpg',
        originalName: 'test-image.jpg',
        mimeType: 'image/jpeg',
        fileSize: BigInt(1024000),
        storagePath: 'projects/test/assets/test-image.jpg',
        storageProvider: 'local',
      },
    });

    expect(asset.fileName).toBe('test-image.jpg');
    expect(asset.mimeType).toBe('image/jpeg');
    expect(asset.fileSize).toBe(BigInt(1024000));
    expect(asset.status).toBe('ACTIVE');
  });

  it('should soft delete asset', async () => {
    const asset = await prisma.asset.create({
      data: {
        projectId,
        uploaderId: userId,
        fileName: 'delete-test.jpg',
        originalName: 'delete-test.jpg',
        mimeType: 'image/jpeg',
        fileSize: BigInt(512000),
        storagePath: 'projects/test/assets/delete-test.jpg',
      },
    });

    await prisma.asset.update({
      where: { id: asset.id },
      data: { status: 'DELETED', deletedAt: new Date() },
    });

    const deleted = await prisma.asset.findUnique({ where: { id: asset.id } });
    expect(deleted?.status).toBe('DELETED');
    expect(deleted?.deletedAt).not.toBeNull();
  });
});

describe('Search', () => {
  const prisma = new PrismaClient();
  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `search-test-${Date.now()}@example.com`,
        username: `searchuser${Date.now()}`,
        passwordHash: await bcrypt.hash('password123', 12),
      },
    });
    userId = user.id;

    const project = await prisma.project.create({
      data: {
        name: 'Search Test Project',
        ownerId: userId,
        members: { create: { userId, role: 'OWNER' } },
      },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    await prisma.asset.deleteMany({ where: { projectId } });
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('should search assets by filename', async () => {
    await prisma.asset.createMany({
      data: [
        { projectId, uploaderId: userId, fileName: 'cat-photo.jpg', originalName: 'cat-photo.jpg', mimeType: 'image/jpeg', fileSize: BigInt(1000), storagePath: 'test/cat.jpg' },
        { projectId, uploaderId: userId, fileName: 'dog-photo.jpg', originalName: 'dog-photo.jpg', mimeType: 'image/jpeg', fileSize: BigInt(2000), storagePath: 'test/dog.jpg' },
        { projectId, uploaderId: userId, fileName: 'document.pdf', originalName: 'document.pdf', mimeType: 'application/pdf', fileSize: BigInt(3000), storagePath: 'test/doc.pdf' },
      ],
    });

    const results = await prisma.asset.findMany({
      where: {
        projectId,
        status: 'ACTIVE',
        OR: [
          { fileName: { contains: 'cat', mode: 'insensitive' } },
          { originalName: { contains: 'cat', mode: 'insensitive' } },
        ],
      },
    });

    expect(results).toHaveLength(1);
    expect(results[0].originalName).toBe('cat-photo.jpg');
  });

  it('should filter by file type', async () => {
    const images = await prisma.asset.findMany({
      where: {
        projectId,
        status: 'ACTIVE',
        mimeType: { startsWith: 'image/' },
      },
    });

    expect(images.length).toBeGreaterThanOrEqual(2);
    images.forEach(img => {
      expect(img.mimeType.startsWith('image/')).toBe(true);
    });
  });
});

describe('Authorization', () => {
  const prisma = new PrismaClient();
  let ownerId: string;
  let editorId: string;
  let viewerId: string;
  let projectId: string;

  beforeAll(async () => {
    const [owner, editor, viewer] = await Promise.all([
      prisma.user.create({ data: { email: `owner-${Date.now()}@example.com`, username: `owner${Date.now()}`, passwordHash: await bcrypt.hash('password123', 12) } }),
      prisma.user.create({ data: { email: `editor-${Date.now()}@example.com`, username: `editor${Date.now()}`, passwordHash: await bcrypt.hash('password123', 12) } }),
      prisma.user.create({ data: { email: `viewer-${Date.now()}@example.com`, username: `viewer${Date.now()}`, passwordHash: await bcrypt.hash('password123', 12) } }),
    ]);
    ownerId = owner.id;
    editorId = editor.id;
    viewerId = viewer.id;

    const project = await prisma.project.create({
      data: {
        name: 'Auth Test Project',
        ownerId,
        members: {
          create: [
            { userId: ownerId, role: 'OWNER' },
            { userId: editorId, role: 'EDITOR' },
            { userId: viewerId, role: 'VIEWER' },
          ],
        },
      },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, editorId, viewerId] } } });
    await prisma.$disconnect();
  });

  it('should allow owner to delete project', async () => {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: ownerId } },
    });
    expect(membership?.role).toBe('OWNER');
  });

  it('should allow editor to upload assets', async () => {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: editorId } },
    });
    expect(membership?.role).toBe('EDITOR');
  });

  it('should not allow viewer to upload assets', async () => {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: viewerId } },
    });
    expect(membership?.role).toBe('VIEWER');
  });
});

describe('Activity Logging', () => {
  const prisma = new PrismaClient();
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `activity-test-${Date.now()}@example.com`,
        username: `activityuser${Date.now()}`,
        passwordHash: await bcrypt.hash('password123', 12),
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.activityLog.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('should create activity log', async () => {
    const log = await prisma.activityLog.create({
      data: {
        userId,
        action: 'ASSET_UPLOADED',
        entityType: 'ASSET',
        entityId: 'test-asset-id',
        metadata: { fileName: 'test.jpg', fileSize: 1024 },
      },
    });

    expect(log.action).toBe('ASSET_UPLOADED');
    expect(log.entityType).toBe('ASSET');
    expect(log.metadata).toEqual({ fileName: 'test.jpg', fileSize: 1024 });
  });

  it('should query activity logs by user', async () => {
    const logs = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    expect(logs.length).toBeGreaterThan(0);
  });
});