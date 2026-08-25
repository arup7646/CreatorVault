import { prisma } from '../utils/prisma';
import { NotFoundError, AuthorizationError, ValidationError } from '../utils/errors';

export const tagService = {
  async getAll(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { where: { userId } } },
    });

    if (!project || project.members.length === 0) {
      throw new NotFoundError('Project not found or access denied');
    }

    return prisma.tag.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { assets: true } } },
    });
  },

  async create(projectId: string, userId: string, name: string, color?: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { where: { userId } } },
    });

    if (!project || project.members.length === 0) {
      throw new NotFoundError('Project not found or access denied');
    }

    const membership = project.members[0];
    if (membership.role === 'VIEWER') {
      throw new AuthorizationError('Insufficient permissions');
    }

    const tag = await prisma.tag.create({
      data: { name, projectId, color: color || '#3B82F6' },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'TAG_CREATED',
        entityType: 'TAG',
        entityId: tag.id,
        metadata: { name, projectId },
      },
    });

    return tag;
  },

  async update(projectId: string, userId: string, tagId: string, data: { name?: string; color?: string }) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { where: { userId } } },
    });

    if (!project || project.members.length === 0) {
      throw new NotFoundError('Project not found or access denied');
    }

    const membership = project.members[0];
    if (membership.role === 'VIEWER') {
      throw new AuthorizationError('Insufficient permissions');
    }

    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag || tag.projectId !== projectId) {
      throw new NotFoundError('Tag not found');
    }

    if (data.name && data.name !== tag.name) {
      const existing = await prisma.tag.findUnique({ where: { projectId_name: { projectId, name: data.name } } });
      if (existing) {
        throw new ValidationError('Tag name already exists');
      }
    }

    const updated = await prisma.tag.update({
      where: { id: tagId },
      data: { name: data.name, color: data.color },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'TAG_UPDATED',
        entityType: 'TAG',
        entityId: tagId,
        metadata: { changes: Object.keys(data) },
      },
    });

    return updated;
  },

  async delete(projectId: string, userId: string, tagId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { where: { userId } } },
    });

    if (!project || project.members.length === 0) {
      throw new NotFoundError('Project not found or access denied');
    }

    const membership = project.members[0];
    if (membership.role === 'VIEWER') {
      throw new AuthorizationError('Insufficient permissions');
    }

    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag || tag.projectId !== projectId) {
      throw new NotFoundError('Tag not found');
    }

    await prisma.tag.delete({ where: { id: tagId } });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'TAG_DELETED',
        entityType: 'TAG',
        entityId: tagId,
        metadata: { name: tag.name },
      },
    });
  },
};