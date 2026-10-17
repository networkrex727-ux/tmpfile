import React, { useState } from 'react';
import {
  History,
  Copy,
  Check,
  Download,
  Trash2,
  Clock,
  Eye,
  Flame,
} from 'lucide-react';
import { LocalHistoryItem } from '../types';
import { formatTimeRemaining } from '../utils/format';

interface HistoryViewProps {
  history: LocalHistoryItem[];
  onClearHistory: () => void;
  onPreviewFile: (id: string) => void;
  onDeleteFile: (id: string, token: string) => Promise<boolean>;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onClearHistory,
  onPreviewFile,
  onDeleteFile,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (history.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
          <History className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">No Active Uploads in this Browser</h3>
        <p className="text-xs text-neutral-400">
          Files you upload from this browser session will appear here with expiration timers and your secret delete tokens.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">My Upload History</h2>
            <p className="text-xs text-neutral-400">
              Stored locally on this device. When files expire on the server, they self-scrub.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 text-xs font-medium border border-neutral-800 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Local List</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {history.map((item) => {
          const timeInfo = formatTimeRemaining(item.expiresAt);
          return (
            <div
              key={item.id}
              className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-200 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-[11px] font-mono text-neutral-500">
                      {item.formattedSize} • Plan: {item.expirationPlan.toUpperCase()}
                    </p>
                  </div>
                  {item.expirationPlan === 'burn' ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
                      <Flame className="w-3 h-3" /> Burn
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                      <Clock className="w-3 h-3" /> {timeInfo.text}
                    </span>
                  )}
                </div>

                <div className="bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-neutral-400 truncate max-w-[200px]">{item.fileUrl}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.fileUrl, item.id)}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 ml-2 shrink-0 font-medium"
                  >
                    {copiedId === item.id ? (
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
                    onClick={() => onPreviewFile(item.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>View</span>
                  </button>

                  <a
                    href={item.downloadUrl}
                    download
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/50 text-cyan-300 text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>

                {item.deleteToken && (
                  <button
                    type="button"
                    onClick={() => onDeleteFile(item.id, item.deleteToken)}
                    className="text-neutral-500 hover:text-rose-400 p-1.5 rounded hover:bg-rose-950/30 transition-colors"
                    title="Delete file now with your stored delete token"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
