import { FileImage, FileVideo, FileAudio, FileText, FileArchive, File } from 'lucide-react';
import { getFileIcon } from '../../utils/helpers';

interface FileIconProps {
  mimeType: string;
  className?: string;
}

export function FileIcon({ mimeType, className }: FileIconProps) {
  const iconName = getFileIcon(mimeType);

  switch (iconName) {
    case 'file-image':
      return <FileImage className={className} />;
    case 'file-video':
      return <FileVideo className={className} />;
    case 'file-audio':
      return <FileAudio className={className} />;
    case 'file-text':
      return <FileText className={className} />;
    case 'file-archive':
      return <FileArchive className={className} />;
    default:
      return <File className={className} />;
  }
}