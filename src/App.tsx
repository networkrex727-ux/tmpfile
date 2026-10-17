/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PlanSelector } from './components/PlanSelector';
import { Dropzone } from './components/Dropzone';
import { BatchResultView } from './components/BatchResultView';
import { PublicApiDocs } from './components/PublicApiDocs';
import { FileViewer } from './components/FileViewer';
import { HistoryView } from './components/HistoryView';
import {
  ExpirationPlan,
  QueueItem,
  UploadBatchResponse,
  LocalHistoryItem,
} from './types';
import {
  getLocalHistory,
  saveToLocalHistory,
  removeFromLocalHistory,
  clearLocalHistory,
} from './utils/storage';
import { testConnection } from './firebase';
import {
  Flame,
  Terminal,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'api' | 'history' | 'viewer'>('upload');
  const [selectedPlan, setSelectedPlan] = useState<ExpirationPlan>('24h');
  const [maxDownloads, setMaxDownloads] = useState<number>(0);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [lastBatchResult, setLastBatchResult] = useState<UploadBatchResponse | null>(null);
  const [viewerFileId, setViewerFileId] = useState<string | null>(null);
  const [localHistory, setLocalHistory] = useState<LocalHistoryItem[]>([]);
  const [serverStats, setServerStats] = useState<{ activeFiles: number; formattedStorage: string }>({
    activeFiles: 0,
    formattedStorage: '0 Bytes',
  });

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/f/')) {
      const id = path.replace('/f/', '').trim();
      if (id) {
        setViewerFileId(id);
        setActiveTab('viewer');
      }
    }

    const handlePopState = () => {
      const p = window.location.pathname;
      if (p.startsWith('/f/')) {
        const id = p.replace('/f/', '').trim();
        if (id) {
          setViewerFileId(id);
          setActiveTab('viewer');
        }
      } else {
        setViewerFileId(null);
        setActiveTab('upload');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    testConnection();
    setLocalHistory(getLocalHistory());

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/info');
        if (res.ok) {
          const data = await res.json();
          setServerStats({
            activeFiles: data.activeFiles,
            formattedStorage: data.formattedStorage,
          });
        }
      } catch (err) {
        console.warn('Could not load server stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAddFiles = useCallback((files: File[]) => {
    setQueue((prev) => {
      const existingNames = new Set(prev.map((i) => `${i.file.name}_${i.file.size}`));
      const newItems: QueueItem[] = [];

      for (const f of files) {
        const key = `${f.name}_${f.size}`;
        if (!existingNames.has(key)) {
          existingNames.add(key);
          newItems.push({
            id: Math.random().toString(36).substring(2, 9),
            file: f,
            status: 'pending',
            progress: 0,
          });
        }
      }

      return [...prev, ...newItems].slice(0, 150);
    });
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleClearQueue = useCallback(() => {
    setQueue([]);
    setOverallProgress(0);
  }, []);

  const handleStartUpload = async () => {
    if (queue.length === 0 || isUploading) return;

    setIsUploading(true);
    setOverallProgress(10);

    try {
      const formData = new FormData();
      for (const item of queue) {
        formData.append('files', item.file);
      }
      formData.append('expires', selectedPlan);
      if (maxDownloads > 0) {
        formData.append('maxDownloads', maxDownloads.toString());
      }
      if (selectedPlan === 'burn') {
        formData.append('burn', 'true');
      }

      const progressTimer = setInterval(() => {
        setOverallProgress((p) => (p < 85 ? p + 15 : p));
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressTimer);
      setOverallProgress(100);

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Failed to upload files');
      }

      const result: UploadBatchResponse = await response.json();

      saveToLocalHistory(result.files);
      setLocalHistory(getLocalHistory());

      setLastBatchResult(result);
      setQueue([]);
      setIsUploading(false);
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert(err.message || 'Upload error. Please try again.');
      setIsUploading(false);
      setOverallProgress(0);
    }
  };

  const handlePreviewFile = (fileId: string) => {
    setViewerFileId(fileId);
    setActiveTab('viewer');
    window.history.pushState(null, '', `/f/${fileId}`);
  };

  const handleBackFromViewer = () => {
    setViewerFileId(null);
    setActiveTab('upload');
    window.history.pushState(null, '', '/');
  };

  const handleDeleteFile = async (fileId: string, token: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/file/${fileId}?token=${encodeURIComponent(token)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        removeFromLocalHistory(fileId);
        setLocalHistory(getLocalHistory());
        return true;
      }
      return false;
    } catch (err) {
      console.error('Delete failed:', err);
      return false;
    }
  };

  const handleClearHistory = () => {
    clearLocalHistory();
    setLocalHistory([]);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-['Plus_Jakarta_Sans']">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'viewer') {
            setViewerFileId(null);
            window.history.pushState(null, '', '/');
          }
        }}
        recentCount={localHistory.length}
        serverStats={serverStats}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {activeTab === 'upload' && (
          <div className="space-y-8">
            {lastBatchResult ? (
              <BatchResultView
                result={lastBatchResult}
                onUploadMore={() => setLastBatchResult(null)}
                onPreviewFile={handlePreviewFile}
                onDeleteFile={handleDeleteFile}
              />
            ) : (
              <>
                <div className="text-center max-w-2xl mx-auto space-y-2">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                    Temporary File Hosting,{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">
                      Simplified
                    </span>
                  </h1>
                  <p className="text-sm text-neutral-400">
                    No sign-up. Drop up to <strong className="text-neutral-200">100+ files</strong> of any type, select your expiration time tile, and share instant direct download links.
                  </p>
                </div>

                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 shadow-xl">
                  <PlanSelector
                    selectedPlan={selectedPlan}
                    onSelectPlan={setSelectedPlan}
                    maxDownloads={maxDownloads}
                    setMaxDownloads={setMaxDownloads}
                  />
                </div>

                <Dropzone
                  queue={queue}
                  onAddFiles={handleAddFiles}
                  onRemoveItem={handleRemoveItem}
                  onClearQueue={handleClearQueue}
                  isUploading={isUploading}
                  overallProgress={overallProgress}
                  onStartUpload={handleStartUpload}
                />

                <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>
                      Prefer uploading from the command line? Run:{' '}
                      <code className="text-cyan-300 font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                        curl -F "file=@yourfile.zip" -F "expires={selectedPlan}" {window.location.origin}/api/upload
                      </code>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('api')}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold whitespace-nowrap"
                  >
                    <span>View Public API</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'api' && <PublicApiDocs />}

        {activeTab === 'history' && (
          <HistoryView
            history={localHistory}
            onClearHistory={handleClearHistory}
            onPreviewFile={handlePreviewFile}
            onDeleteFile={handleDeleteFile}
          />
        )}

        {activeTab === 'viewer' && viewerFileId && (
          <FileViewer
            fileId={viewerFileId}
            onBack={handleBackFromViewer}
            onDeleteFile={handleDeleteFile}
          />
        )}
      </main>

      <footer className="border-t border-neutral-800 bg-neutral-950/60 py-6 text-xs text-neutral-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-cyan-500" />
            <span className="font-semibold text-neutral-400">TmpDrop</span>
            <span>—</span>
            <span>Ephemeral File Sharing Platform & Public API</span>
          </div>

          <div className="flex items-center gap-4 text-neutral-500">
            <span>Automatic Scrubbing</span>
            <span>•</span>
            <span>Zero Tracking</span>
            <span>•</span>
            <span>No Auth Required</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
