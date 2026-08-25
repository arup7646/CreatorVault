import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@creatorvault.app' },
    update: {},
    create: {
      email: 'admin@creatorvault.app',
      username: 'admin',
      passwordHash,
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@creatorvault.app' },
    update: {},
    create: {
      email: 'manager@creatorvault.app',
      username: 'manager',
      passwordHash,
      name: 'Manager User',
      role: 'MANAGER',
      emailVerified: true,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@creatorvault.app' },
    update: {},
    create: {
      email: 'user@creatorvault.app',
      username: 'user',
      passwordHash,
      name: 'Regular User',
      role: 'USER',
      emailVerified: true,
    },
  });

  console.log('Created users:', { admin: admin.id, manager: manager.id, user: user.id });

  const project1 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Assets for the new website redesign project',
      ownerId: user.id,
      coverImage: null,
      members: {
        create: [
          { userId: user.id, role: 'OWNER' },
          { userId: manager.id, role: 'EDITOR' },
        ],
      },
      tags: {
        create: [
          { name: 'design', color: '#EC4899' },
          { name: 'frontend', color: '#3B82F6' },
          { name: 'ui', color: '#8B5CF6' },
        ],
      },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Marketing Campaign',
      description: 'Marketing materials and assets',
      ownerId: manager.id,
      coverImage: null,
      members: {
        create: [
          { userId: manager.id, role: 'OWNER' },
          { userId: user.id, role: 'VIEWER' },
        ],
      },
      tags: {
        create: [
          { name: 'marketing', color: '#F59E0B' },
          { name: 'social', color: '#EF4444' },
          { name: 'brand', color: '#6366F1' },
        ],
      },
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Personal Portfolio',
      description: 'My personal portfolio assets',
      ownerId: user.id,
      coverImage: null,
      members: {
        create: [{ userId: user.id, role: 'OWNER' }],
      },
      tags: {
        create: [
          { name: 'portfolio', color: '#14B8A6' },
          { name: 'personal', color: '#F97316' },
        ],
      },
    },
  });

  console.log('Created projects:', { project1: project1.id, project2: project2.id, project3: project3.id });

  const tags1 = await prisma.tag.findMany({ where: { projectId: project1.id } });
  const tags2 = await prisma.tag.findMany({ where: { projectId: project2.id } });
  const tags3 = await prisma.tag.findMany({ where: { projectId: project3.id } });

  const sampleAssets = [
    { projectId: project1.id, uploaderId: user.id, fileName: 'hero-banner.jpg', originalName: 'hero-banner.jpg', mimeType: 'image/jpeg', fileSize: BigInt(2456789), storagePath: 'projects/project1/assets/hero-banner.jpg', description: 'Main hero banner for homepage', tagIds: [tags1[0]?.id].filter(Boolean) },
    { projectId: project1.id, uploaderId: user.id, fileName: 'logo.svg', originalName: 'logo.svg', mimeType: 'image/svg+xml', fileSize: BigInt(12345), storagePath: 'projects/project1/assets/logo.svg', description: 'Company logo vector', tagIds: [tags1[0]?.id, tags1[2]?.id].filter(Boolean) },
    { projectId: project1.id, uploaderId: manager.id, fileName: 'style-guide.pdf', originalName: 'style-guide.pdf', mimeType: 'application/pdf', fileSize: BigInt(5678901), storagePath: 'projects/project1/assets/style-guide.pdf', description: 'Brand style guide document', tagIds: [tags1[1]?.id].filter(Boolean) },
    { projectId: project2.id, uploaderId: manager.id, fileName: 'campaign-video.mp4', originalName: 'campaign-video.mp4', mimeType: 'video/mp4', fileSize: BigInt(52428800), storagePath: 'projects/project2/assets/campaign-video.mp4', description: 'Main campaign video', tagIds: [tags2[0]?.id, tags2[1]?.id].filter(Boolean) },
    { projectId: project2.id, uploaderId: manager.id, fileName: 'social-graphics.zip', originalName: 'social-graphics.zip', mimeType: 'application/zip', fileSize: BigInt(10485760), storagePath: 'projects/project2/assets/social-graphics.zip', description: 'Social media graphics pack', tagIds: [tags2[1]?.id].filter(Boolean) },
    { projectId: project3.id, uploaderId: user.id, fileName: 'profile-photo.jpg', originalName: 'profile-photo.jpg', mimeType: 'image/jpeg', fileSize: BigInt(1024567), storagePath: 'projects/project3/assets/profile-photo.jpg', description: 'Profile photo for about page', tagIds: [tags3[0]?.id].filter(Boolean) },
  ];

  for (const asset of sampleAssets) {
    await prisma.asset.create({
      data: {
        projectId: asset.projectId,
        uploaderId: asset.uploaderId,
        fileName: asset.fileName,
        originalName: asset.originalName,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        storagePath: asset.storagePath,
        storageProvider: 'local',
        description: asset.description,
        tags: asset.tagIds.length > 0 ? { create: asset.tagIds.map(tagId => ({ tagId })) } : undefined,
      },
    });
  }

  console.log('Created sample assets');

  await prisma.notification.createMany({
    data: [
      { userId: user.id, senderId: manager.id, type: 'PROJECT_INVITATION', title: 'Project Invitation', message: 'You\'ve been invited to "Website Redesign" as editor', data: { projectId: project1.id, role: 'EDITOR' }, isRead: false },
      { userId: manager.id, senderId: user.id, type: 'PROJECT_INVITATION', title: 'Project Invitation', message: 'You\'ve been invited to "Marketing Campaign" as viewer', data: { projectId: project2.id, role: 'VIEWER' }, isRead: true },
      { userId: user.id, senderId: manager.id, type: 'ASSET_UPLOADED', title: 'New Asset Uploaded', message: 'New file "campaign-video.mp4" uploaded to "Marketing Campaign"', data: { projectId: project2.id }, isRead: false },
    ],
  });

  console.log('Created notifications');

  await prisma.activityLog.createMany({
    data: [
      { userId: user.id, action: 'USER_REGISTERED', entityType: 'USER', entityId: user.id },
      { userId: manager.id, action: 'USER_REGISTERED', entityType: 'USER', entityId: manager.id },
      { userId: admin.id, action: 'USER_REGISTERED', entityType: 'USER', entityId: admin.id },
      { userId: user.id, action: 'PROJECT_CREATED', entityType: 'PROJECT', entityId: project1.id, metadata: { name: project1.name } },
      { userId: manager.id, action: 'PROJECT_CREATED', entityType: 'PROJECT', entityId: project2.id, metadata: { name: project2.name } },
      { userId: user.id, action: 'PROJECT_CREATED', entityType: 'PROJECT', entityId: project3.id, metadata: { name: project3.name } },
      { userId: user.id, action: 'MEMBER_INVITED', entityType: 'PROJECT', entityId: project1.id, metadata: { invitedUserId: manager.id, role: 'EDITOR' } },
      { userId: manager.id, action: 'MEMBER_INVITED', entityType: 'PROJECT', entityId: project2.id, metadata: { invitedUserId: user.id, role: 'VIEWER' } },
    ],
  });

  console.log('Created activity logs');

  await prisma.favorite.createMany({
    data: [
      { userId: user.id, assetId: (await prisma.asset.findFirst({ where: { projectId: project1.id } }))?.id || '' },
      { userId: user.id, assetId: (await prisma.asset.findFirst({ where: { projectId: project3.id } }))?.id || '' },
    ].filter(d => d.assetId),
  });

  console.log('Created favorites');

  console.log('Seeding completed!');
  console.log('\nDemo credentials:');
  console.log('Admin: admin@creatorvault.app / password123');
  console.log('Manager: manager@creatorvault.app / password123');
  console.log('User: user@creatorvault.app / password123');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });