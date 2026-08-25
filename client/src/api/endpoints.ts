import api from './client';

export const authApi = {
  register: (data: { email: string; username: string; password: string; name?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: { name?: string; username?: string; bio?: string; email?: string }) =>
    api.patch('/users/me', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  updateAvatar: (avatarUrl: string) => api.post('/users/me/avatar', { avatarUrl }),
  getSessions: () => api.get('/auth/sessions'),
  revokeSession: (sessionId: string) => api.delete(`/auth/sessions/${sessionId}`),
  revokeAllSessions: () => api.post('/auth/sessions/revoke-all'),
  deleteAccount: (password: string) => api.delete('/auth/me', { data: { password } }),
};

export const projectApi = {
  create: (data: { name: string; description?: string; tags?: string[] }) =>
    api.post('/projects', data),
  getAll: (params?: { archived?: boolean; page?: number; limit?: number; search?: string; sort?: string }) =>
    api.get('/projects', { params }),
  getById: (id: string) => api.get(`/projects/${id}`),
  update: (id: string, data: { name?: string; description?: string | null; isArchived?: boolean; coverImage?: string | null; tags?: string[] }) =>
    api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  getMembers: (id: string) => api.get(`/projects/${id}/members`),
  inviteMember: (id: string, email: string, role: 'EDITOR' | 'VIEWER') =>
    api.post(`/projects/${id}/members`, { email, role }),
  updateMemberRole: (id: string, userId: string, role: 'EDITOR' | 'VIEWER') =>
    api.patch(`/projects/${id}/members/${userId}`, { role }),
  removeMember: (id: string, userId: string) => api.delete(`/projects/${id}/members/${userId}`),
  leaveProject: (id: string) => api.post(`/projects/${id}/leave`),
};

export const assetApi = {
  upload: (projectId: string, files: File[], description?: string, tagIds?: string[]) => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    if (description) formData.append('description', description);
    if (tagIds) formData.append('tagIds', JSON.stringify(tagIds));
    return api.post(`/projects/${projectId}/assets`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: (projectId: string, params?: {
    status?: 'ACTIVE' | 'DELETED';
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    fileType?: string;
    tags?: string;
    favorites?: boolean;
    dateFrom?: string;
    dateTo?: string;
    sizeMin?: number;
    sizeMax?: number;
  }) => api.get(`/projects/${projectId}/assets`, { params }),
  getById: (projectId: string, assetId: string) =>
    api.get(`/projects/${projectId}/assets/${assetId}`),
  update: (projectId: string, assetId: string, data: { fileName?: string; description?: string | null; tagIds?: string[] }) =>
    api.patch(`/projects/${projectId}/assets/${assetId}`, data),
  delete: (projectId: string, assetId: string, permanent?: boolean) =>
    api.delete(`/projects/${projectId}/assets/${assetId}`, { params: { permanent } }),
  restore: (projectId: string, assetId: string) =>
    api.post(`/projects/${projectId}/assets/${assetId}/restore`),
  toggleFavorite: (projectId: string, assetId: string) =>
    api.post(`/projects/${projectId}/assets/${assetId}/favorite`),
  getFavorites: (params?: { page?: number; limit?: number }) =>
    api.get('/assets/favorites', { params }),
  move: (projectId: string, assetId: string, targetProjectId: string) =>
    api.post(`/projects/${projectId}/assets/${assetId}/move`, { targetProjectId }),
  download: (projectId: string, assetId: string) =>
    api.get(`/projects/${projectId}/assets/${assetId}/download`, { responseType: 'blob' }),
  getFileUrl: (assetId: string) => api.get(`/projects/assets/${assetId}/url`),
  getStats: (projectId: string) => api.get(`/projects/${projectId}/assets/stats`),
};

export const searchApi = {
  search: (params: {
    q?: string;
    type?: 'all' | 'projects' | 'assets';
    fileType?: string;
    projectId?: string;
    tags?: string;
    dateFrom?: string;
    dateTo?: string;
    sizeMin?: number;
    sizeMax?: number;
    favorites?: boolean;
    sort?: string;
    page?: number;
    limit?: number;
  }) => api.get('/search', { params }),
  suggestions: (q: string) => api.get('/search/suggestions', { params: { q } }),
};

export const notificationApi = {
  getAll: (params?: { unreadOnly?: boolean; page?: number; limit?: number }) =>
    api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const activityApi = {
  getAll: (params?: { userId?: string; entityType?: string; entityId?: string; action?: string; page?: number; limit?: number }) =>
    api.get('/activity', { params }),
  getProjectActivity: (projectId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/activity/project/${projectId}`, { params }),
  getSystemStats: () => api.get('/activity/stats'),
};

export const adminApi = {
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string; sort?: string }) =>
    api.get('/admin/users', { params }),
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  updateUser: (id: string, data: { role?: string; isActive?: boolean }) =>
    api.patch(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getStats: () => api.get('/admin/stats'),
  getActivityLogs: (params?: { page?: number; limit?: number; userId?: string }) =>
    api.get('/admin/activity', { params }),
};

export const tagApi = {
  getAll: (projectId: string) => api.get(`/projects/${projectId}/tags`),
  create: (projectId: string, name: string, color?: string) =>
    api.post(`/projects/${projectId}/tags`, { name, color }),
  update: (projectId: string, tagId: string, data: { name?: string; color?: string }) =>
    api.patch(`/projects/${projectId}/tags/${tagId}`, data),
  delete: (projectId: string, tagId: string) =>
    api.delete(`/projects/${projectId}/tags/${tagId}`),
};