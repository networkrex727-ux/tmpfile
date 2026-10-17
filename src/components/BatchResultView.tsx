import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  Download,
  Share2,
  Trash2,
  Eye,
  FileArchive,
  QrCode,
  FileText,
  Clock,
  Flame,
  Search,
  PlusCircle,
  FileCode,
  Image,
  Film,
  Music,
  File,
} from 'lucide-react';
import { UploadBatchResponse, SerializedFile } from '../types';
import { formatTimeRemaining, getFileCategory } from '../utils/format';

interface BatchResultViewProps {
  result: UploadBatchResponse;
  onUploadMore: () => void;
  onPreviewFile: (fileId: string) => void;
  onDeleteFile: (fileId: string, token: string) => Promise<boolean>;
}

export const BatchResultView: React.FC<BatchResultViewProps> = ({
  result,
  onUploadMore,
  onPreviewFile,
  onDeleteFile,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedBatch, setCopiedBatch] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const activeFiles = useMemo(() => {
    return result.files.filter((f) => !deletedIds.has(f.id));
  }, [result.files, deletedIds]);

  const filteredFiles = useMemo(() => {
    if (!searchFilter.trim()) return activeFiles;
    const q = searchFilter.toLowerCase();
    return activeFiles.filter((f) => f.name.toLowerCase().includes(q));
  }, [activeFiles, searchFilter]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyBatchLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedBatch(true);
    setTimeout(() => setCopiedBatch(false), 2000);
  };

  const handleExportLinks = (format: 'text' | 'markdown' | 'json') => {
    let output = '';
    if (format === 'text') {
      output = activeFiles.map((f) => `${f.name}: ${f.url}`).join('\n');
    } else if (format === 'markdown') {
      output = activeFiles.map((f) => `- [${f.name}](${f.url}) (${f.formattedSize})`).join('\n');
    } else {
      output = JSON.stringify(activeFiles, null, 2);
    }
    navigator.clipboard.writeText(output);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const handleDelete = async (file: SerializedFile) => {
    if (!file.deleteToken) return;
    const ok = await onDeleteFile(file.id, file.deleteToken);
    if (ok) {
      setDeletedIds((prev) => new Set(prev).add(file.id));
    }
  };

  const renderFileCategoryIcon = (file: SerializedFile) => {
    const cat = getFileCategory(file.mimeType, file.name);
    switch (cat) {
      case 'image':
        return <Image className="w-4 h-4 text-emerald-400" />;
      case 'video':
        return <Film className="w-4 h-4 text-purple-400" />;
      case 'audio':
        return <Music className="w-4 h-4 text-pink-400" />;
      case 'archive':
        return <FileArchive className="w-4 h-4 text-amber-400" />;
      case 'code':
        return <FileCode className="w-4 h-4 text-cyan-400" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-400" />;
      default:
        return <File className="w-4 h-4 text-neutral-400" />;
    }
  };

  const remainingInfo = formatTimeRemaining(result.expiresAt);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-950/40 via-neutral-900/60 to-teal-950/40 border border-cyan-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {result.count === 1 ? 'File Uploaded Successfully!' : `Batch of ${result.count} Files Uploaded!`}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {result.expirationPlan.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1 font-mono">
                {result.expirationPlan === 'burn' ? (
                  <span className="flex items-center gap-1 text-rose-400">
                    <Flame className="w-3.5 h-3.5" /> Self-destructs after 1st download
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Clock className="w-3.5 h-3.5" /> {remainingInfo.text}
                  </span>
                )}
                <span>•</span>
                <span>No account required</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {result.batch?.zipDownloadUrl && (
              <a
                href={result.batch.zipDownloadUrl}
                download
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download All as ZIP</span>
              </a>
            )}

            <button
              type="button"
              onClick={onUploadMore}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              <span>Upload More</span>
            </button>
          </div>
        </div>

        {result.batch && (
          <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-neutral-300 font-mono truncate">
              <Share2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="text-neutral-400">Batch Bundle Link:</span>
              <span className="text-cyan-400 truncate">{result.batch.batchUrl}</span>
            </div>
            <button
              type="button"
              onClick={() => copyBatchLink(result.batch!.batchUrl)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700/80 transition-colors shrink-0"
            >
              {copiedBatch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBatch ? 'Copied Bundle Link!' : 'Copy Bundle Link'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Uploaded Files ({activeFiles.length})
          </h3>
          {activeFiles.length > 5 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search file name..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500 font-mono w-48"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 font-mono">Export links:</span>
          <button
            type="button"
            onClick={() => handleExportLinks('text')}
            className="px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-mono text-neutral-300 transition-colors"
            title="Copy all file links as plain text"
          >
            {copiedExport ? 'Copied!' : 'Text'}
          </button>
          <button
            type="button"
            onClick={() => handleExportLinks('markdown')}
            className="px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-mono text-neutral-300 transition-colors"
            title="Copy as Markdown links"
          >
            Markdown
          </button>
          <button
            type="button"
            onClick={() => handleExportLinks('json')}
            className="px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-mono text-neutral-300 transition-colors"
            title="Copy JSON list"
          >
            JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className="bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700/80 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all group"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
                    {renderFileCategoryIcon(file)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-neutral-200 truncate group-hover:text-cyan-300 transition-colors" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[11px] font-mono text-neutral-500">
                      {file.formattedSize} • {file.mimeType.split('/')[1] || 'bin'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setQrModalUrl(file.url)}
                  className="text-neutral-500 hover:text-cyan-400 p-1 rounded hover:bg-neutral-800 transition-colors shrink-0"
                  title="Show QR Code"
                >
                  <QrCode className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-400 truncate max-w-[200px]">{file.url}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(file.url, file.id)}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 ml-2 shrink-0 font-medium"
                >
                  {copiedId === file.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onPreviewFile(file.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
                  title="Preview in browser"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Preview</span>
                </button>

                <a
                  href={file.downloadUrl}
                  download
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/50 text-cyan-300 text-xs font-medium transition-colors"
                  title="Direct download file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>

              {file.deleteToken && (
                <button
                  type="button"
                  onClick={() => handleDelete(file)}
                  className="text-neutral-500 hover:text-rose-400 p-1.5 rounded hover:bg-rose-950/30 transition-colors"
                  title="Delete file permanently now"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {qrModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setQrModalUrl(null)}
        >
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-base font-bold text-white">Scan to Download</h4>
            <p className="text-xs text-neutral-400">
              Scan with your phone camera to download directly to your mobile device.
            </p>
            <div className="bg-white p-4 rounded-xl inline-block shadow-inner mx-auto">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  qrModalUrl
                )}`}
                alt="File QR Code"
                className="w-44 h-44"
              />
            </div>
            <div className="font-mono text-xs text-neutral-400 truncate bg-neutral-950 p-2 rounded-lg border border-neutral-800">
              {qrModalUrl}
            </div>
            <button
              type="button"
              onClick={() => setQrModalUrl(null)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
