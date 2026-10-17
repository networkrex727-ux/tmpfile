import React, { useState, useEffect } from 'react';
import {
  Download,
  Copy,
  Check,
  Trash2,
  Clock,
  Flame,
  FileText,
  Eye,
  ArrowLeft,
  QrCode,
  AlertTriangle,
  FileCode,
  Image as ImageIcon,
  Film,
  Music,
  FileArchive,
  File as GenericFile,
  ExternalLink,
} from 'lucide-react';
import { SerializedFile } from '../types';
import { formatBytes, formatTimeRemaining, getFileCategory } from '../utils/format';

interface FileViewerProps {
  fileId: string;
  onBack: () => void;
  onDeleteFile: (fileId: string, token: string) => Promise<boolean>;
}

export const FileViewer: React.FC<FileViewerProps> = ({
  fileId,
  onBack,
  onDeleteFile,
}) => {
  const [file, setFile] = useState<SerializedFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [deleteTokenInput, setDeleteTokenInput] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchFile() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/file/${fileId}`);
        if (!res.ok) {
          if (res.status === 410) {
            throw new Error('This temporary file has expired and been removed.');
          }
          if (res.status === 404) {
            throw new Error('File not found. It may have expired or been deleted.');
          }
          throw new Error('Failed to load file details.');
        }
        const data = await res.json();
        if (isMounted) {
          setFile(data);
          const cat = getFileCategory(data.mimeType, data.name);
          if (cat === 'code' || cat === 'document') {
            fetchTextContent(data.rawUrl);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error loading file');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchFile();
    return () => {
      isMounted = false;
    };
  }, [fileId]);

  const fetchTextContent = async (rawUrl: string) => {
    setLoadingText(true);
    try {
      const res = await fetch(rawUrl);
      if (res.ok) {
        const text = await res.text();
        setTextContent(text.slice(0, 50000));
      }
    } catch (e) {
      console.warn('Could not load text preview:', e);
    } finally {
      setLoadingText(false);
    }
  };

  const handleCopy = () => {
    if (!file) return;
    navigator.clipboard.writeText(file.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDelete = async () => {
    if (!file || !deleteTokenInput.trim()) return;
    setIsDeleting(true);
    const ok = await onDeleteFile(file.id, deleteTokenInput.trim());
    setIsDeleting(false);
    if (ok) {
      setShowDeleteModal(false);
      setError('File was permanently deleted.');
    } else {
      alert('Invalid delete token.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-mono text-neutral-400">Loading temporary file...</p>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">Unavailable or Expired</h3>
        <p className="text-sm text-neutral-400 font-mono">{error}</p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Upload Another File</span>
        </button>
      </div>
    );
  }

  const cat = getFileCategory(file.mimeType, file.name);
  const timeInfo = formatTimeRemaining(file.expiresAt);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Uploads</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQr(!showQr)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium border border-neutral-800 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mobile QR</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 text-xs font-medium border border-neutral-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Early</span>
          </button>
        </div>
      </div>

      {file.isBurnAfterReading && (
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-2xl p-4 flex items-center gap-3 text-rose-200 text-xs">
          <Flame className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
          <div>
            <strong className="text-white block">Self-Destruct Active (Burn After Reading)</strong>
            <span>This file is configured to be deleted from disk and servers immediately upon first download!</span>
          </div>
        </div>
      )}

      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center shrink-0 text-cyan-400 shadow-inner">
              {cat === 'image' && <ImageIcon className="w-7 h-7" />}
              {cat === 'video' && <Film className="w-7 h-7" />}
              {cat === 'audio' && <Music className="w-7 h-7" />}
              {cat === 'archive' && <FileArchive className="w-7 h-7" />}
              {cat === 'code' && <FileCode className="w-7 h-7" />}
              {cat === 'pdf' && <FileText className="w-7 h-7" />}
              {cat === 'other' && <GenericFile className="w-7 h-7" />}
            </div>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate max-w-md sm:max-w-lg" title={file.name}>
                {file.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-mono text-neutral-400">
                <span className="font-semibold text-neutral-200">{formatBytes(file.size)}</span>
                <span>•</span>
                <span>{file.mimeType}</span>
                <span>•</span>
                <span>{file.downloadCount} {file.downloadCount === 1 ? 'download' : 'downloads'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
            </button>

            <a
              href={file.downloadUrl}
              download
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-neutral-950 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </a>
          </div>
        </div>

        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Time Remaining:</span>
              <strong className="text-cyan-300">{timeInfo.text}</strong>
            </span>
            <span className="text-neutral-500">Plan: {file.expirationPlan.toUpperCase()}</span>
          </div>
          <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${timeInfo.progressPercent}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-teal-400" />
              File Content Preview
            </span>
            <a
              href={file.rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
            >
              <span>Open Raw Stream</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 min-h-[200px] flex items-center justify-center p-4">
            {cat === 'image' && (
              <img
                src={file.rawUrl}
                alt={file.name}
                className="max-h-[500px] max-w-full rounded-lg object-contain shadow-md"
              />
            )}

            {cat === 'video' && (
              <video
                src={file.rawUrl}
                controls
                className="max-h-[500px] max-w-full rounded-lg shadow-md"
              />
            )}

            {cat === 'audio' && (
              <div className="w-full max-w-md py-6">
                <audio src={file.rawUrl} controls className="w-full" />
              </div>
            )}

            {(cat === 'code' || cat === 'document') && (
              <div className="w-full">
                {loadingText ? (
                  <p className="text-xs font-mono text-neutral-500 text-center py-8">Loading text preview...</p>
                ) : textContent !== null ? (
                  <pre className="text-xs font-mono text-neutral-300 p-4 overflow-x-auto max-h-96 leading-relaxed">
                    {textContent}
                  </pre>
                ) : (
                  <p className="text-xs font-mono text-neutral-500 text-center py-8">Text preview unavailable.</p>
                )}
              </div>
            )}

            {cat === 'pdf' && (
              <div className="text-center py-12 space-y-3">
                <FileText className="w-12 h-12 text-rose-400 mx-auto" />
                <p className="text-xs text-neutral-400">PDF document ready for direct view or download.</p>
                <a
                  href={file.rawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 rounded-lg"
                >
                  <span>Open PDF in new tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {(cat === 'archive' || cat === 'other') && (
              <div className="text-center py-12 space-y-3">
                <GenericFile className="w-12 h-12 text-neutral-500 mx-auto" />
                <p className="text-xs text-neutral-400 font-mono">
                  Binary format ({file.mimeType}). Download to inspect.
                </p>
                <a
                  href={file.downloadUrl}
                  download
                  className="inline-flex items-center gap-2 px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 rounded-xl"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download ({formatBytes(file.size)})</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {showQr && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowQr(false)}
        >
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-base font-bold text-white">Scan to Download on Mobile</h4>
            <div className="bg-white p-4 rounded-xl inline-block mx-auto">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  file.url
                )}`}
                alt="File QR Code"
                className="w-44 h-44"
              />
            </div>
            <p className="font-mono text-xs text-neutral-400 truncate bg-neutral-950 p-2 rounded-lg border border-neutral-800">
              {file.url}
            </p>
            <button
              type="button"
              onClick={() => setShowQr(false)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Delete File Immediately</h4>
                <p className="text-xs text-neutral-400">Enter your uploader Delete Token to scrub this file early.</p>
              </div>
            </div>

            <input
              type="text"
              placeholder="del_..."
              value={deleteTokenInput}
              onChange={(e) => setDeleteTokenInput(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-rose-500"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || !deleteTokenInput.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
