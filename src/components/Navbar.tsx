import React from 'react';
import { Flame, Terminal, UploadCloud, History } from 'lucide-react';

interface NavbarProps {
  activeTab: 'upload' | 'api' | 'history' | 'viewer';
  setActiveTab: (tab: 'upload' | 'api' | 'history' | 'viewer') => void;
  recentCount: number;
  serverStats?: { activeFiles: number; formattedStorage: string };
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  recentCount,
  serverStats,
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('upload')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-500 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <div className="w-full h-full bg-neutral-950 rounded-[11px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white font-['Plus_Jakarta_Sans']">
                Tmp<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">Drop</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                Ephemeral
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono hidden sm:block">
              Zero-login temporary file transfer
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/80'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-cyan-400" />
            <span>Drop Files</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'api'
                ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/80'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
            }`}
          >
            <Terminal className="w-4 h-4 text-teal-400" />
            <span>Public API & CLI</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/80'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
            }`}
          >
            <History className="w-4 h-4 text-indigo-400" />
            <span>My Uploads</span>
            {recentCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {recentCount}
              </span>
            )}
          </button>
        </nav>

        {/* Server Status pill */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{serverStats?.activeFiles ?? 0} active files</span>
            <span className="text-neutral-600">•</span>
            <span>No login</span>
          </div>
        </div>
      </div>
    </header>
  );
};
