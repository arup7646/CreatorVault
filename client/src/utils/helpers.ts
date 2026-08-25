import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number | string): string {
  const numBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (numBytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'archive' | 'file' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'archive';
  if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('text')) return 'document';
  return 'file';
}

export function getFileIcon(mimeType: string): string {
  const type = getFileType(mimeType);
  switch (type) {
    case 'image': return 'file-image';
    case 'video': return 'file-video';
    case 'audio': return 'file-audio';
    case 'pdf': return 'file-text';
    case 'document': return 'file-text';
    case 'archive': return 'file-archive';
    default: return 'file';
  }
}

export function isPreviewable(mimeType: string): boolean {
  const type = getFileType(mimeType);
  return ['image', 'video', 'audio', 'pdf'].includes(type);
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getRoleColor(role: string): string {
  switch (role) {
    case 'ADMIN': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'MANAGER': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'OWNER': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'EDITOR': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'VIEWER': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
}

export function getNotificationIcon(type: string): string {
  switch (type) {
    case 'PROJECT_INVITATION': return 'user-plus';
    case 'ROLE_CHANGE': return 'user-cog';
    case 'ASSET_UPLOADED': return 'file-up';
    case 'REMOVED_FROM_PROJECT': return 'user-minus';
    default: return 'bell';
  }
}

export function getActivityIcon(action: string): string {
  if (action.includes('CREATED')) return 'plus-circle';
  if (action.includes('UPDATED') || action.includes('EDITED')) return 'edit';
  if (action.includes('DELETED')) return 'trash';
  if (action.includes('RESTORED')) return 'rotate-ccw';
  if (action.includes('UPLOADED')) return 'upload';
  if (action.includes('DOWNLOADED')) return 'download';
  if (action.includes('FAVORITED')) return 'star';
  if (action.includes('MOVED')) return 'arrow-right-left';
  if (action.includes('INVITED') || action.includes('MEMBER')) return 'users';
  if (action.includes('LOGIN') || action.includes('REGISTERED')) return 'log-in';
  if (action.includes('ROLE')) return 'shield';
  return 'activity';
}