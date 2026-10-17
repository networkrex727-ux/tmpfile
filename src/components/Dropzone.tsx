import React, { useRef, useState, useMemo } from 'react';
import {
  UploadCloud,
  File,
  FolderUp,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FileArchive,
  FileText,
  Image,
  Film,
  Music,
  Trash2,
  ArrowUpRight,
  Layers,
} from 'lucide-react';
import { QueueItem } from '../types';
import { formatBytes, getFileCategory } from '../utils/format';

interface DropzoneProps {
  queue: QueueItem[];
  onAddFiles: (files: File[]) => void;
  onRemoveItem: (id: string) => void;
  onClearQueue: () => void;
  isUploading: boolean;
  overallProgress: number;
  onStartUpload: () => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  queue,
  onAddFiles,
  onRemoveItem,
  onClearQueue,
  isUploading,
  overallProgress,
  onStartUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onAddFiles(filesArray);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onAddFiles(filesArray);
      e.target.value = '';
    }
  };

  const totalSizeBytes = useMemo(() => {
    return queue.reduce((sum, item) => sum + item.file.size, 0);
  }, [queue]);

  const filteredQueue = useMemo(() => {
    if (!searchFilter.trim()) return queue;
    const q = searchFilter.toLowerCase();
    return queue.filter((item) => item.file.name.toLowerCase().includes(q));
  }, [queue, searchFilter]);

  const renderFileCategoryIcon = (file: File) => {
    const cat = getFileCategory(file.type, file.name);
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

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFileInputChange}
        // @ts-expect-error webkitdirectory is standard in browsers
        webkitdirectory="true"
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer overflow-hidden ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/20 scale-[0.99] ring-4 ring-cyan-500/20'
            : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700 hover:bg-neutral-900/50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-teal-500/20 to-neutral-800 flex items-center justify-center border border-cyan-500/30 group-hover:scale-105 transition-transform shadow-inner">
            <UploadCloud className="w-8 h-8 text-cyan-400" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Drop files here or <span className="text-cyan-400 underline decoration-cyan-500/40 underline-offset-4">browse</span>
            </h2>
            <p className="text-sm text-neutral-400">
              Supports <strong className="text-neutral-200">100+ files batch</strong> of any format (ZIP, PDF, ISO, MP4, APK, code, logs, binaries) up to 100MB each.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 shadow-sm transition-all"
            >
              <File className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select Files (Up to 150)</span>
            </button>

            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700/80 shadow-sm transition-all"
            >
              <FolderUp className="w-3.5 h-3.5 text-teal-400" />
              <span>Upload Entire Folder</span>
            </button>
          </div>
        </div>
      </div>

      {queue.length > 0 && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Upload Queue</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {queue.length} {queue.length === 1 ? 'file' : 'files'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Total size: <span className="font-mono text-neutral-200">{formatBytes(totalSizeBytes)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {queue.length > 5 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter queue..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-8 pr-2 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-48 font-mono"
                  />
                </div>
              )}

              {!isUploading && (
                <button
                  type="button"
                  onClick={onClearQueue}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 text-xs font-medium border border-neutral-700/60 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}

              <button
                type="button"
                onClick={onStartUpload}
                disabled={isUploading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-neutral-950 text-xs font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
              >
                {isUploading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    <span>Uploading ({overallProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Upload {queue.length} {queue.length === 1 ? 'File' : 'Files'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {isUploading && (
            <div className="space-y-1.5 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-cyan-400">Uploading files to TmpDrop...</span>
                <span className="text-neutral-300">{overallProgress}%</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full rounded-full transition-all duration-200"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1 divide-y divide-neutral-800/40">
            {filteredQueue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-neutral-800/40 transition-colors group text-xs"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
                    {renderFileCategoryIcon(item.file)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-neutral-200 truncate" title={item.file.name}>
                      {item.file.name}
                    </p>
                    <p className="text-[11px] font-mono text-neutral-500">
                      {formatBytes(item.file.size)} • {item.file.type || 'binary/raw'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-3 shrink-0">
                  {item.status === 'completed' && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Uploaded
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span className="flex items-center gap-1 text-[11px] text-rose-400 font-mono">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Failed
                    </span>
                  )}
                  {!isUploading && item.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-neutral-500 hover:text-rose-400 p-1 rounded transition-colors"
                      title="Remove from queue"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredQueue.length === 0 && searchFilter && (
            <p className="text-center text-xs text-neutral-500 py-4 font-mono">
              No files matching "{searchFilter}"
            </p>
          )}
        </div>
      )}
    </div>
  );
};
