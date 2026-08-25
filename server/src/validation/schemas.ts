import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be at most 30 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long').regex(/[A-Z]/, 'Password must contain at least one uppercase letter').regex(/[a-z]/, 'Password must contain at least one lowercase letter').regex(/[0-9]/, 'Password must contain at least one number'),
    name: z.string().max(100, 'Name too long').optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long').regex(/[A-Z]/, 'Password must contain at least one uppercase letter').regex(/[a-z]/, 'Password must contain at least one lowercase letter').regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long').regex(/[A-Z]/, 'Password must contain at least one uppercase letter').regex(/[a-z]/, 'Password must contain at least one lowercase letter').regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().max(100, 'Name too long').optional(),
    username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be at most 30 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens').optional(),
    bio: z.string().max(500, 'Bio too long').optional(),
    email: z.string().email('Invalid email address').optional(),
  }),
});

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Project name is required').max(100, 'Name too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    tags: z.array(z.string().max(50)).max(10, 'Too many tags').optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Project name is required').max(100, 'Name too long').optional(),
    description: z.string().max(1000, 'Description too long').optional().nullable(),
    isArchived: z.boolean().optional(),
    coverImage: z.string().url().optional().nullable(),
    tags: z.array(z.string().max(50)).max(10, 'Too many tags').optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid project ID'),
  }),
});

export const projectIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid project ID'),
  }),
});

export const assetIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid asset ID'),
  }),
});

export const updateAssetSchema = z.object({
  body: z.object({
    fileName: z.string().min(1, 'File name is required').max(255, 'File name too long').optional(),
    description: z.string().max(2000, 'Description too long').optional().nullable(),
    tagIds: z.array(z.string().uuid()).max(20, 'Too many tags').optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid asset ID'),
  }),
});

export const moveAssetSchema = z.object({
  body: z.object({
    targetProjectId: z.string().uuid('Invalid target project ID'),
  }),
  params: z.object({
    id: z.string().uuid('Invalid asset ID'),
  }),
});

export const addTagsSchema = z.object({
  body: z.object({
    tagIds: z.array(z.string().uuid()).min(1, 'At least one tag required').max(20, 'Too many tags'),
  }),
  params: z.object({
    id: z.string().uuid('Invalid asset ID'),
  }),
});

export const searchSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    type: z.enum(['all', 'projects', 'assets']).optional(),
    fileType: z.string().optional(),
    projectId: z.string().uuid().optional(),
    tags: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    sizeMin: z.string().transform(Number).optional(),
    sizeMax: z.string().transform(Number).optional(),
    favorites: z.string().transform(val => val === 'true').optional(),
    sort: z.enum(['newest', 'oldest', 'name_asc', 'name_desc', 'size_desc', 'size_asc']).optional(),
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['EDITOR', 'VIEWER']),
  }),
  params: z.object({
    id: z.string().uuid('Invalid project ID'),
  }),
});

export const updateMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(['EDITOR', 'VIEWER']),
  }),
  params: z.object({
    id: z.string().uuid('Invalid project ID'),
    userId: z.string().uuid('Invalid user ID'),
  }),
});

export const createTagSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tag name is required').max(50, 'Tag name too long'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid project ID'),
  }),
});

export const updateTagSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tag name is required').max(50, 'Tag name too long').optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid project ID'),
    tagId: z.string().uuid('Invalid tag ID'),
  }),
});

export const notificationIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid notification ID'),
  }),
});

export const adminUserSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    search: z.string().optional(),
    role: z.enum(['USER', 'MANAGER', 'ADMIN']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    sort: z.enum(['newest', 'oldest', 'name_asc', 'name_desc', 'last_active']).optional(),
  }),
});

export const adminUpdateUserSchema = z.object({
  body: z.object({
    role: z.enum(['USER', 'MANAGER', 'ADMIN']).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
});