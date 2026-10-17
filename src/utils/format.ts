export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatTimeRemaining(targetTimestamp: number): { text: string; isExpired: boolean; progressPercent: number } {
  const now = Date.now();
  const diff = targetTimestamp - now;

  if (diff <= 0) {
    return { text: 'Expired', isExpired: true, progressPercent: 0 };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return {
      text: `${days}d ${hours}h ${minutes}m left`,
      isExpired: false,
      progressPercent: Math.min(100, Math.max(5, (diff / (7 * 24 * 3600 * 1000)) * 100)),
    };
  }

  if (hours > 0) {
    return {
      text: `${hours}h ${minutes}m ${seconds}s left`,
      isExpired: false,
      progressPercent: Math.min(100, Math.max(5, (diff / (24 * 3600 * 1000)) * 100)),
    };
  }

  return {
    text: `${minutes}m ${seconds}s left`,
    isExpired: false,
    progressPercent: Math.min(100, Math.max(5, (diff / (3600 * 1000)) * 100)),
  };
}

export function getFileCategory(mimeType: string, filename: string): 'image' | 'video' | 'audio' | 'pdf' | 'code' | 'archive' | 'document' | 'other' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
    return 'image';
  }
  if (mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) {
    return 'video';
  }
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)) {
    return 'audio';
  }
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }
  if (
    mimeType.includes('javascript') ||
    mimeType.includes('typescript') ||
    mimeType.includes('json') ||
    mimeType.includes('xml') ||
    ['js', 'ts', 'tsx', 'jsx', 'json', 'py', 'go', 'rs', 'c', 'cpp', 'java', 'html', 'css', 'sql', 'sh', 'yaml', 'yml', 'md'].includes(ext)
  ) {
    return 'code';
  }
  if (
    mimeType.includes('zip') ||
    mimeType.includes('tar') ||
    mimeType.includes('gzip') ||
    mimeType.includes('7z') ||
    ['zip', 'tar', 'gz', 'bz2', '7z', 'rar', 'iso'].includes(ext)
  ) {
    return 'archive';
  }
  if (
    mimeType.includes('word') ||
    mimeType.includes('excel') ||
    mimeType.includes('sheet') ||
    ['doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'rtf'].includes(ext)
  ) {
    return 'document';
  }
  return 'other';
}
