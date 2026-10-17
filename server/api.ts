import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import JSZip from 'jszip';

export interface StoredFile {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadTimestamp: number;
  expiresAt: number;
  expirationPlan: '15m' | '1h' | '6h' | '12h' | '24h' | '3d' | '7d' | 'burn';
  downloadCount: number;
  maxDownloads: number;
  isBurnAfterReading: boolean;
  deleteToken: string;
  batchId?: string;
  isExpired: boolean;
  storageFilename: string;
  createdAt: string;
}

export interface BatchManifest {
  id: string;
  totalFiles: number;
  totalSize: number;
  expiresAt: number;
  expirationPlan: string;
  deleteToken: string;
  fileIds: string[];
  createdAt: string;
}

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
const DB_FILE = path.resolve(UPLOAD_DIR, 'metadata.json');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const filesMap = new Map<string, StoredFile>();
const batchesMap = new Map<string, BatchManifest>();

function loadMetadata() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data.files && Array.isArray(data.files)) {
        for (const file of data.files) {
          filesMap.set(file.id, file);
        }
      }
      if (data.batches && Array.isArray(data.batches)) {
        for (const b of data.batches) {
          batchesMap.set(b.id, b);
        }
      }
    }
  } catch (err) {
    console.error('Failed to load metadata file:', err);
  }
}

function saveMetadata() {
  try {
    const data = {
      files: Array.from(filesMap.values()),
      batches: Array.from(batchesMap.values()),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save metadata file:', err);
  }
}

loadMetadata();

export function calculateExpiration(plan: string): { durationMs: number; planKey: StoredFile['expirationPlan']; isBurn: boolean } {
  const norm = (plan || '24h').toLowerCase().trim();
  switch (norm) {
    case '15m':
      return { durationMs: 15 * 60 * 1000, planKey: '15m', isBurn: false };
    case '1h':
      return { durationMs: 60 * 60 * 1000, planKey: '1h', isBurn: false };
    case '6h':
      return { durationMs: 6 * 60 * 60 * 1000, planKey: '6h', isBurn: false };
    case '12h':
      return { durationMs: 12 * 60 * 60 * 1000, planKey: '12h', isBurn: false };
    case '3d':
      return { durationMs: 3 * 24 * 60 * 60 * 1000, planKey: '3d', isBurn: false };
    case '7d':
      return { durationMs: 7 * 24 * 60 * 60 * 1000, planKey: '7d', isBurn: false };
    case 'burn':
      return { durationMs: 24 * 60 * 60 * 1000, planKey: 'burn', isBurn: true };
    case '24h':
    default:
      return { durationMs: 24 * 60 * 60 * 1000, planKey: '24h', isBurn: false };
  }
}

function cleanupExpiredFiles() {
  const now = Date.now();
  let modified = false;

  for (const [id, file] of filesMap.entries()) {
    const isOverdue = now > file.expiresAt;
    const isExhausted = file.maxDownloads > 0 && file.downloadCount >= file.maxDownloads;

    if (isOverdue || isExhausted || file.isExpired) {
      const filePath = path.join(UPLOAD_DIR, file.storageFilename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error(`Failed to delete file ${filePath}:`, e);
        }
      }
      filesMap.delete(id);
      modified = true;
    }
  }

  for (const [batchId, batch] of batchesMap.entries()) {
    const remaining = batch.fileIds.filter(fId => filesMap.has(fId));
    if (remaining.length === 0 || now > batch.expiresAt) {
      batchesMap.delete(batchId);
      modified = true;
    }
  }

  if (modified) {
    saveMetadata();
  }
}

setInterval(cleanupExpiredFiles, 30 * 1000);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const unique = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    files: 150,
    fileSize: 100 * 1024 * 1024,
  },
});

export const apiApp = express();

apiApp.use(cors());
apiApp.use(express.json());
apiApp.use(express.urlencoded({ extended: true }));

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getBaseUrl(req: Request): string {
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
  const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
  return `${proto}://${host}`;
}

function serializeFile(file: StoredFile, baseUrl: string, includeToken = false) {
  const now = Date.now();
  const msRemaining = Math.max(0, file.expiresAt - now);
  const minutesRemaining = Math.round(msRemaining / (60 * 1000));
  const hoursRemaining = (msRemaining / (60 * 60 * 1000)).toFixed(1);

  return {
    id: file.id,
    name: file.originalName,
    size: file.size,
    formattedSize: formatBytes(file.size),
    mimeType: file.mimeType,
    uploadTimestamp: file.uploadTimestamp,
    expiresAt: file.expiresAt,
    expirationPlan: file.expirationPlan,
    expiresInText: msRemaining <= 0 ? 'Expired' : msRemaining < 3600000 ? `${minutesRemaining}m` : `${hoursRemaining}h`,
    downloadCount: file.downloadCount,
    maxDownloads: file.maxDownloads,
    isBurnAfterReading: file.isBurnAfterReading,
    batchId: file.batchId,
    url: `${baseUrl}/f/${file.id}`,
    downloadUrl: `${baseUrl}/api/file/${file.id}/download`,
    rawUrl: `${baseUrl}/api/file/${file.id}/raw`,
    deleteUrl: `${baseUrl}/api/file/${file.id}`,
    ...(includeToken ? { deleteToken: file.deleteToken } : {}),
  };
}

// 1. Health & Server Info
apiApp.get('/api/info', (req: Request, res: Response) => {
  const activeCount = filesMap.size;
  let totalBytes = 0;
  for (const f of filesMap.values()) {
    totalBytes += f.size;
  }

  res.json({
    status: 'online',
    appName: 'TmpDrop API',
    version: '1.0.0',
    activeFiles: activeCount,
    totalStorageBytes: totalBytes,
    formattedStorage: formatBytes(totalBytes),
    supportedPlans: ['15m', '1h', '6h', '12h', '24h', '3d', '7d', 'burn'],
    maxFilesPerBatch: 150,
    maxFileSize: '100MB',
  });
});

// 2. Multi-file upload endpoint (Supports 1 to 150 files)
apiApp.post('/api/upload', upload.any(), (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files provided. Send multipart/form-data with "file" or "files" field.' });
    return;
  }

  const requestedPlan = (req.body.expires || req.query.expires || '24h') as string;
  const { durationMs, planKey, isBurn: planIsBurn } = calculateExpiration(requestedPlan);
  const explicitBurn = req.body.burn === 'true' || req.query.burn === 'true' || req.body.burn === true;
  const isBurn = planIsBurn || explicitBurn;

  let maxDownloads = 0;
  if (isBurn) {
    maxDownloads = 1;
  } else if (req.body.maxDownloads || req.query.maxDownloads) {
    maxDownloads = parseInt((req.body.maxDownloads || req.query.maxDownloads) as string, 10) || 0;
  }

  const now = Date.now();
  const expiresAt = now + durationMs;
  const baseUrl = getBaseUrl(req);
  const batchId = files.length > 1 ? `b_${crypto.randomBytes(6).toString('hex')}` : undefined;
  const batchDeleteToken = `del_${crypto.randomBytes(12).toString('hex')}`;

  const createdFiles: StoredFile[] = [];
  const createdFileIds: string[] = [];
  let totalBatchSize = 0;

  for (const file of files) {
    let shortId = crypto.randomBytes(4).toString('hex');
    while (filesMap.has(shortId)) {
      shortId = crypto.randomBytes(5).toString('hex');
    }

    const deleteToken = `del_${crypto.randomBytes(12).toString('hex')}`;
    const stored: StoredFile = {
      id: shortId,
      originalName: file.originalname || 'unnamed_file',
      size: file.size,
      mimeType: file.mimetype || 'application/octet-stream',
      uploadTimestamp: now,
      expiresAt,
      expirationPlan: isBurn ? 'burn' : planKey,
      downloadCount: 0,
      maxDownloads,
      isBurnAfterReading: isBurn,
      deleteToken,
      batchId,
      isExpired: false,
      storageFilename: file.filename,
      createdAt: new Date().toISOString(),
    };

    filesMap.set(shortId, stored);
    createdFiles.push(stored);
    createdFileIds.push(shortId);
    totalBatchSize += file.size;
  }

  if (batchId) {
    const batchManifest: BatchManifest = {
      id: batchId,
      totalFiles: createdFiles.length,
      totalSize: totalBatchSize,
      expiresAt,
      expirationPlan: isBurn ? 'burn' : planKey,
      deleteToken: batchDeleteToken,
      fileIds: createdFileIds,
      createdAt: new Date().toISOString(),
    };
    batchesMap.set(batchId, batchManifest);
  }

  saveMetadata();

  const responseFiles = createdFiles.map(f => serializeFile(f, baseUrl, true));

  res.status(201).json({
    success: true,
    count: createdFiles.length,
    expiresAt,
    expirationPlan: isBurn ? 'burn' : planKey,
    files: responseFiles,
    ...(batchId
      ? {
          batch: {
            id: batchId,
            totalFiles: createdFiles.length,
            totalSize: totalBatchSize,
            formattedTotalSize: formatBytes(totalBatchSize),
            batchUrl: `${baseUrl}/b/${batchId}`,
            zipDownloadUrl: `${baseUrl}/api/batch/${batchId}/zip`,
            deleteToken: batchDeleteToken,
          },
        }
      : {}),
  });
});

// 3. Raw stream upload for CLI / curl --upload-file
apiApp.put('/api/upload/:filename', (req: Request, res: Response) => {
  const rawFilename = req.params.filename || 'uploaded_stream.bin';
  const requestedPlan = (req.query.expires || '24h') as string;
  const { durationMs, planKey, isBurn } = calculateExpiration(requestedPlan);

  const shortId = crypto.randomBytes(4).toString('hex');
  const ext = path.extname(rawFilename);
  const storageFilename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
  const targetPath = path.join(UPLOAD_DIR, storageFilename);

  const writeStream = fs.createWriteStream(targetPath);
  let totalBytes = 0;

  req.on('data', (chunk) => {
    totalBytes += chunk.length;
  });

  req.pipe(writeStream);

  writeStream.on('finish', () => {
    const now = Date.now();
    const expiresAt = now + durationMs;
    const baseUrl = getBaseUrl(req);
    const deleteToken = `del_${crypto.randomBytes(12).toString('hex')}`;

    const stored: StoredFile = {
      id: shortId,
      originalName: rawFilename,
      size: totalBytes,
      mimeType: (req.headers['content-type'] as string) || 'application/octet-stream',
      uploadTimestamp: now,
      expiresAt,
      expirationPlan: isBurn ? 'burn' : planKey,
      downloadCount: 0,
      maxDownloads: isBurn ? 1 : 0,
      isBurnAfterReading: isBurn,
      deleteToken,
      isExpired: false,
      storageFilename,
      createdAt: new Date().toISOString(),
    };

    filesMap.set(shortId, stored);
    saveMetadata();

    const acceptsJson = req.headers.accept?.includes('application/json');
    if (acceptsJson) {
      res.status(201).json(serializeFile(stored, baseUrl, true));
    } else {
      res.setHeader('Content-Type', 'text/plain');
      res.status(201).send(`${baseUrl}/f/${shortId}\nDownload: ${baseUrl}/api/file/${shortId}/download\nDelete: ${baseUrl}/api/file/${shortId}?token=${deleteToken}\n`);
    }
  });

  writeStream.on('error', (err) => {
    console.error('Stream write error:', err);
    res.status(500).json({ error: 'Failed to write uploaded stream' });
  });
});

// 4. File metadata endpoint
apiApp.get('/api/file/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const file = filesMap.get(id);

  if (!file) {
    res.status(404).json({ error: 'File not found or expired' });
    return;
  }

  if (Date.now() > file.expiresAt || file.isExpired) {
    res.status(410).json({ error: 'File has expired and is no longer available' });
    return;
  }

  const baseUrl = getBaseUrl(req);
  res.json(serializeFile(file, baseUrl, false));
});

// 5. Download file endpoint
apiApp.get(['/api/file/:id/download', '/d/:id'], (req: Request, res: Response) => {
  const id = req.params.id;
  const file = filesMap.get(id);

  if (!file) {
    res.status(404).send('File not found or expired.');
    return;
  }

  if (Date.now() > file.expiresAt || file.isExpired) {
    res.status(410).send('File has expired.');
    return;
  }

  const filePath = path.join(UPLOAD_DIR, file.storageFilename);
  if (!fs.existsSync(filePath)) {
    res.status(404).send('File data missing on server.');
    return;
  }

  file.downloadCount += 1;
  const shouldBurn = file.isBurnAfterReading || (file.maxDownloads > 0 && file.downloadCount >= file.maxDownloads);

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
  res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
  res.setHeader('Content-Length', file.size.toString());

  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);

  readStream.on('end', () => {
    if (shouldBurn) {
      file.isExpired = true;
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error('Failed to unlink burned file:', e);
      }
      filesMap.delete(id);
    }
    saveMetadata();
  });
});

// 6. Raw file preview endpoint
apiApp.get(['/api/file/:id/raw', '/raw/:id'], (req: Request, res: Response) => {
  const id = req.params.id;
  const file = filesMap.get(id);

  if (!file) {
    res.status(404).send('File not found or expired.');
    return;
  }

  if (Date.now() > file.expiresAt || file.isExpired) {
    res.status(410).send('File has expired.');
    return;
  }

  const filePath = path.join(UPLOAD_DIR, file.storageFilename);
  if (!fs.existsSync(filePath)) {
    res.status(404).send('File data missing on server.');
    return;
  }

  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
  res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
  res.setHeader('Content-Length', file.size.toString());

  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
});

// 7. Delete file endpoint
apiApp.delete('/api/file/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const token = (req.query.token as string) || (req.headers['x-delete-token'] as string) || req.body?.deleteToken;

  const file = filesMap.get(id);
  if (!file) {
    res.status(404).json({ error: 'File not found or already deleted' });
    return;
  }

  if (!token || token !== file.deleteToken) {
    res.status(403).json({ error: 'Invalid or missing delete token' });
    return;
  }

  const filePath = path.join(UPLOAD_DIR, file.storageFilename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error('Error unlinking file:', e);
    }
  }

  filesMap.delete(id);
  saveMetadata();

  res.json({ success: true, message: `File ${file.originalName} deleted successfully` });
});

// 8. Batch metadata endpoint
apiApp.get('/api/batch/:id', (req: Request, res: Response) => {
  const batchId = req.params.id;
  const batch = batchesMap.get(batchId);

  if (!batch) {
    res.status(404).json({ error: 'Batch not found or expired' });
    return;
  }

  const baseUrl = getBaseUrl(req);
  const activeFiles: ReturnType<typeof serializeFile>[] = [];

  for (const fId of batch.fileIds) {
    const f = filesMap.get(fId);
    if (f && !f.isExpired && Date.now() <= f.expiresAt) {
      activeFiles.push(serializeFile(f, baseUrl, false));
    }
  }

  res.json({
    id: batch.id,
    totalFiles: activeFiles.length,
    totalSize: activeFiles.reduce((acc, f) => acc + f.size, 0),
    expiresAt: batch.expiresAt,
    expirationPlan: batch.expirationPlan,
    zipDownloadUrl: `${baseUrl}/api/batch/${batch.id}/zip`,
    files: activeFiles,
  });
});

// 9. Download all batch files as ZIP archive
apiApp.get(['/api/batch/:id/zip', '/zip/:id'], async (req: Request, res: Response) => {
  const batchId = req.params.id;
  const batch = batchesMap.get(batchId);

  if (!batch) {
    res.status(404).send('Batch not found or expired.');
    return;
  }

  const zip = new JSZip();
  let validFilesCount = 0;

  for (const fId of batch.fileIds) {
    const file = filesMap.get(fId);
    if (file && !file.isExpired && Date.now() <= file.expiresAt) {
      const filePath = path.join(UPLOAD_DIR, file.storageFilename);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath);
        zip.file(file.originalName, content);
        validFilesCount++;
      }
    }
  }

  if (validFilesCount === 0) {
    res.status(404).send('No active files remain in this batch.');
    return;
  }

  try {
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    res.setHeader('Content-Disposition', `attachment; filename="tmpdrop-batch-${batchId}.zip"`);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', zipBuffer.length.toString());
    res.send(zipBuffer);
  } catch (err) {
    console.error('Error generating batch zip:', err);
    res.status(500).send('Error packaging zip file.');
  }
});

// Connect middleware bridge for Vite dev server
export function apiMiddleware(req: any, res: any, next: NextFunction) {
  const url = req.url || '';
  if (
    url.startsWith('/api/') ||
    url.startsWith('/d/') ||
    url.startsWith('/raw/') ||
    url.startsWith('/zip/')
  ) {
    return apiApp(req, res, next);
  }
  next();
}
