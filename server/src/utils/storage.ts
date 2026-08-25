import { config } from '../config';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface StorageProvider {
  upload(file: Express.Multer.File, destination: string): Promise<string>;
  download(filePath: string): Promise<Buffer>;
  delete(filePath: string): Promise<void>;
  getPublicUrl(filePath: string): string;
}

class LocalStorageProvider implements StorageProvider {
  private basePath: string;

  constructor() {
    this.basePath = config.storage.localPath;
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  async upload(file: Express.Multer.File, destination: string): Promise<string> {
    await this.initialize();
    const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
    const filePath = path.join(this.basePath, destination, fileName);
    
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, file.buffer);
    
    return path.join(destination, fileName);
  }

  async download(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, filePath);
    return fs.readFile(fullPath);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath);
    await fs.unlink(fullPath).catch(() => {});
  }

  getPublicUrl(filePath: string): string {
    return `/api/files/${filePath}`;
  }
}

let storageProvider: StorageProvider | null = null;

export const getStorageProvider = (): StorageProvider => {
  if (!storageProvider) {
    storageProvider = new LocalStorageProvider();
  }
  return storageProvider;
};

export const initStorage = async (): Promise<void> => {
  const provider = getStorageProvider();
  if ('initialize' in provider) {
    await (provider as LocalStorageProvider).initialize();
  }
};

export const generateSafeFileName = (originalName: string): string => {
  const ext = path.extname(originalName).toLowerCase();
  const name = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 100);
  return `${name}_${uuidv4()}${ext}`;
};

export const getFileTypeFromMime = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'archive';
  if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('text')) return 'document';
  return 'file';
};

export const isAllowedFileType = (mimeType: string): boolean => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-zip-compressed',
  ];
  return allowedTypes.includes(mimeType);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};