import { describe, it, expect } from 'vitest';
import { 
  formatFileSize, 
  formatDate, 
  formatRelativeTime, 
  getFileType, 
  getFileIcon, 
  isPreviewable,
  cn,
  truncate,
  getInitials,
  getRoleColor,
  debounce
} from './helpers';

describe('Utility Functions', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
      expect(formatFileSize(1099511627776)).toBe('1 TB');
    });

    it('should handle string input', () => {
      expect(formatFileSize('1024')).toBe('1 KB');
      expect(formatFileSize('1048576')).toBe('1 MB');
    });

    it('should format with decimals', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date)).toBe('Jan 15, 2024');
    });

    it('should handle string input', () => {
      expect(formatDate('2024-01-15T10:30:00Z')).toBe('Jan 15, 2024');
    });
  });

  describe('getFileType', () => {
    it('should return correct file type for images', () => {
      expect(getFileType('image/jpeg')).toBe('image');
      expect(getFileType('image/png')).toBe('image');
      expect(getFileType('image/webp')).toBe('image');
      expect(getFileType('image/gif')).toBe('image');
    });

    it('should return correct file type for videos', () => {
      expect(getFileType('video/mp4')).toBe('video');
      expect(getFileType('video/webm')).toBe('video');
    });

    it('should return correct file type for audio', () => {
      expect(getFileType('audio/mpeg')).toBe('audio');
      expect(getFileType('audio/wav')).toBe('audio');
    });

    it('should return correct file type for documents', () => {
      expect(getFileType('application/pdf')).toBe('pdf');
      expect(getFileType('application/msword')).toBe('document');
      expect(getFileType('text/plain')).toBe('document');
    });

    it('should return correct file type for archives', () => {
      expect(getFileType('application/zip')).toBe('archive');
      expect(getFileType('application/x-zip-compressed')).toBe('archive');
    });

    it('should return file for unknown types', () => {
      expect(getFileType('application/octet-stream')).toBe('file');
    });
  });

  describe('isPreviewable', () => {
    it('should return true for previewable types', () => {
      expect(isPreviewable('image/jpeg')).toBe(true);
      expect(isPreviewable('video/mp4')).toBe(true);
      expect(isPreviewable('audio/mpeg')).toBe(true);
      expect(isPreviewable('application/pdf')).toBe(true);
    });

    it('should return false for non-previewable types', () => {
      expect(isPreviewable('application/zip')).toBe(false);
      expect(isPreviewable('application/octet-stream')).toBe(false);
    });
  });

  describe('cn (classnames)', () => {
    it('should merge classnames correctly', () => {
      expect(cn('base', 'extra')).toBe('base extra');
      expect(cn('base', false && 'conditional')).toBe('base');
      expect(cn('base', true && 'conditional')).toBe('base conditional');
    });

    it('should handle tailwind conflicts', () => {
      expect(cn('p-2 p-4')).toBe('p-4');
      expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
      expect(truncate('short', 10)).toBe('short');
    });

    it('should handle exact length', () => {
      expect(truncate('exact', 5)).toBe('exact');
    });
  });

  describe('getInitials', () => {
    it('should get initials from name', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Alice')).toBe('A');
      expect(getInitials('Bob Smith Johnson')).toBe('BS');
    });

    it('should handle empty string', () => {
      expect(getInitials('')).toBe('');
    });
  });

  describe('getRoleColor', () => {
    it('should return correct color classes', () => {
      expect(getRoleColor('ADMIN')).toContain('purple');
      expect(getRoleColor('MANAGER')).toContain('blue');
      expect(getRoleColor('OWNER')).toContain('yellow');
      expect(getRoleColor('EDITOR')).toContain('green');
      expect(getRoleColor('VIEWER')).toContain('gray');
      expect(getRoleColor('UNKNOWN')).toContain('gray');
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0;
      const debouncedFn = debounce(() => { callCount++; }, 50);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(callCount).toBe(0);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(callCount).toBe(1);
    });
  });
});