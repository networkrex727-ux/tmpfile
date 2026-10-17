export type ExpirationPlan = '15m' | '1h' | '6h' | '12h' | '24h' | '3d' | '7d' | 'burn';

export interface PlanConfig {
  id: ExpirationPlan;
  label: string;
  durationLabel: string;
  description: string;
  badge?: string;
  iconName: string;
}

export interface SerializedFile {
  id: string;
  name: string;
  size: number;
  formattedSize: string;
  mimeType: string;
  uploadTimestamp: number;
  expiresAt: number;
  expirationPlan: ExpirationPlan;
  expiresInText: string;
  downloadCount: number;
  maxDownloads: number;
  isBurnAfterReading: boolean;
  batchId?: string;
  url: string;
  downloadUrl: string;
  rawUrl: string;
  deleteUrl: string;
  deleteToken?: string;
}

export interface UploadBatchResponse {
  success: boolean;
  count: number;
  expiresAt: number;
  expirationPlan: ExpirationPlan;
  files: SerializedFile[];
  batch?: {
    id: string;
    totalFiles: number;
    totalSize: number;
    formattedTotalSize: string;
    batchUrl: string;
    zipDownloadUrl: string;
    deleteToken: string;
  };
}

export interface QueueItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  result?: SerializedFile;
  error?: string;
}

export interface LocalHistoryItem {
  id: string;
  name: string;
  size: number;
  formattedSize: string;
  mimeType: string;
  expiresAt: number;
  expirationPlan: ExpirationPlan;
  deleteToken: string;
  downloadUrl: string;
  fileUrl: string;
  batchId?: string;
  uploadedAt: number;
}
