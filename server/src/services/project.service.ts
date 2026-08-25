import { prisma } from '../utils/prisma';
import { AppError, NotFoundError, AuthorizationError, ValidationError } from '../utils/errors';
import { getStorageProvider, generateSafeFileName, isAllowedFileType } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';

export interface CreateProjectData {
  name: string;
  description?: string;
  tags?: string[];
}

export interface UpdateProjectData {
  name?: string;
  description?: string | null;
  isArchived?: boolean;
  coverImage?: string | null;
  tags?: string[];
}

export const projectService = {
  async create(userId: string, data: CreateProjectData) {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
        tags: data.tags?.length
          ? {
              create: data.tags.map(name => ({ name, color: '#3B82F6' })),
            }
          : undefined,
      },
      include: {
        owner: { select: { id: true, name: true, username: true, avatar: true } },
        members: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } },
        tags: true,
        _count: { select: { assets: true, members: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PROJECT_CREATED',
        entityType: 'PROJECT',
        entityId: project.id,
        metadata: { name: project.name },
      },
    });

    return project;
  },

  async getAll(userId: string, options: { archived?: boolean; page?: number; limit?: number; search?: string; sort?: string } = {}) {
    const { archived = false, page = 1, limit = 20, search, sort = 'newest' } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      members: { some: { userId } },
      isArchived: archived,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { updatedAt: 'desc' };
    if (sort === 'oldest') orderBy = { updatedAt: 'asc' };
    if (sort === 'name_asc') orderBy = { name: 'asc' };
    if (sort === 'name_desc') orderBy = { name: 'desc' };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          owner: { select: { id: true, name: true, username: true, avatar: true } },
          members: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } },
          tags: true,
          _count: { select: { assets: true, members: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return { projects, total, page, totalPages: Math.ceil(total / limit) };
  },

  async getById(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true, username: true, avatar: true } },
        members: { include: { user: { select: { id: true, name: true, username: true, avatar: true, email: true } } } },
        tags: true,
        _count: { select: { assets: true, members: true } },
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const membership = project.members.find(m => m.userId === userId);
    if (!membership) {
      throw new AuthorizationError('Not a member of this project');
    }

    return { ...project, userRole: membership.role };
  },

  async update(userId: string, projectId: string, data: UpdateProjectData) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const membership = project.members.find(m => m.userId === userId);
    if (!membership || membership.role === 'VIEWER') {
      throw new AuthorizationError('Insufficient permissions');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;

    if (data.tags !== undefined) {
      await prisma.tag.deleteMany({ where: { projectId } });
      if (data.tags.length > 0) {
        await prisma.tag.createMany({
          data: data.tags.map(name => ({ name, projectId, color: '#3B82F6' })),
          skipDuplicates: true,
        });
      }
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, username: true, avatar: true } },
        members: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } },
        tags: true,
        _count: { select: { assets: true, members: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PROJECT_UPDATED',
        entityType: 'PROJECT',
        entityId: projectId,
        metadata: { changes: Object.keys(data) },
      },
    });

    return updated;
  },

  async delete(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const membership = project.members.find(m => m.userId === userId);
    if (!membership || membership.role !== 'OWNER') {
      throw new AuthorizationError('Only owner can delete project');
    }

    const assets = await prisma.asset.findMany({
      where: { projectId, status: 'ACTIVE' },
      select: { storagePath: true },
    });

    const storage = getStorageProvider();
    for (const asset of assets) {
      await storage.delete(asset.storagePath).catch(() => {});
    }

    await prisma.project.delete({ where: { id: projectId } });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PROJECT_DELETED',
        entityType: 'PROJECT',
        entityId: projectId,
        metadata: { name: project.name },
      },
    });
  },

  async getMembers(projectId: string) {
    return prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, username: true, avatar: true, email: true } } },
      orderBy: { joinedAt: 'asc' },
    });
  },

  async inviteMember(projectId: string, inviterId: string, email: string, role: 'EDITOR' | 'VIEWER') {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const membership = project.members.find(m => m.userId === inviterId);
    if (!membership || membership.role === 'VIEWER') {
      throw new AuthorizationError('Insufficient permissions');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const existingMember = project.members.find(m => m.userId === user.id);
    if (existingMember) {
      throw new ValidationError('User is already a member');
    }

    const newMember = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role,
      },
      include: { user: { select: { id: true, name: true, username: true, avatar: true, email: true } } },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        senderId: inviterId,
        type: 'PROJECT_INVITATION',
        title: 'Project Invitation',
        message: `You've been invited to "${project.name}" as ${role.toLowerCase()}`,
        data: { projectId, role },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: inviterId,
        action: 'MEMBER_INVITED',
        entityType: 'PROJECT',
        entityId: projectId,
        metadata: { invitedUserId: user.id, role },
      },
    });

    return newMember;
  },

  async updateMemberRole(projectId: string, userId: string, targetUserId: string, role: 'EDITOR' | 'VIEWER') {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const membership = project.members.find(m => m.userId === userId);
    if (!membership || membership.role !== 'OWNER') {
      throw new AuthorizationError('Only owner can change roles');
    }

    const targetMember = project.members.find(m => m.userId === targetUserId);
    if (!targetMember) {
      throw new NotFoundError('Member not found');
    }

    if (targetMember.role === 'OWNER') {
      throw new ValidationError('Cannot change owner role');
    }

    const updated = await prisma.projectMember.update({
      where: { id: targetMember.id },
      data: { role },
      include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
    });

    await prisma.notification.create({
      data: {
        userId: targetUserId,
        senderId: userId,
        type: 'ROLE_CHANGE',
        title: 'Role Updated',
        message: `Your role in "${project.name}" has been changed to ${role.toLowerCase()}`,
        data: { projectId, role },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'MEMBER_ROLE_CHANGED',
        entityType: 'PROJECT',
        entityId: projectId,
        metadata: { targetUserId, newRole: role },
      },
    });

    return updated;
  },

  async removeMember(projectId: string, userId: string, targetUserId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const membership = project.members.find(m => m.userId === userId);
    if (!membership || membership.role === 'VIEWER') {
      throw new AuthorizationError('Insufficient permissions');
    }

    const targetMember = project.members.find(m => m.userId === targetUserId);
    if (!targetMember) {
      throw new NotFoundError('Member not found');
    }

    if (targetMember.role === 'OWNER') {
      throw new ValidationError('Cannot remove owner');
    }

    await prisma.projectMember.delete({ where: { id: targetMember.id } });

    await prisma.notification.create({
      data: {
        userId: targetUserId,
        senderId: userId,
        type: 'REMOVED_FROM_PROJECT',
        title: 'Removed from Project',
        message: `You have been removed from "${project.name}"`,
        data: { projectId },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'MEMBER_REMOVED',
        entityType: 'PROJECT',
        entityId: projectId,
        metadata: { removedUserId: targetUserId },
      },
    });
  },

  async leaveProject(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const membership = project.members.find(m => m.userId === userId);
    if (!membership) {
      throw new NotFoundError('Not a member of this project');
    }

    if (membership.role === 'OWNER') {
      if (project.members.length > 1) {
        throw new ValidationError('Transfer ownership before leaving');
      }
      await this.delete(userId, projectId);
      return;
    }

    await prisma.projectMember.delete({ where: { id: membership.id } });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'MEMBER_LEFT',
        entityType: 'PROJECT',
        entityId: projectId,
      },
    });
  },
};