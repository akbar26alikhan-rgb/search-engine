import React from 'react';
import { 
  Sun, 
  Moon, 
  History, 
  Settings2, 
  Compass, 
  Puzzle, 
  CloudLightning,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenHistory: () => void;
  onOpenProviders: () => void;
  onOpenCustomSearch: () => void;
  onOpenExtension: () => void;
  onOpenDeploy: () => void;
  historyCount: number;
  onResetSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onToggleTheme,
  onOpenHistory,
  onOpenProviders,
  onOpenCustomSearch,
  onOpenExtension,
  onOpenDeploy,
  historyCount,
  onResetSearch,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div 
          onClick={onResetSearch}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-violet-400">
                DeepSeekr
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block -mt-0.5">
              Multi-Source Deep Research Engine
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Custom Search Engine in Brave */}
          <button
            onClick={onOpenCustomSearch}
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Configure as Custom Search in Brave"
          >
            <Compass className="w-3.5 h-3.5 text-amber-500" />
            <span>Brave Engine</span>
          </button>

          {/* Browser Extension */}
          <button
            onClick={onOpenExtension}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Install Brave/Chromium Extension"
          >
            <Puzzle className="w-3.5 h-3.5 text-violet-500" />
            <span>Extension</span>
          </button>

          {/* Providers Status */}
          <button
            onClick={onOpenProviders}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="View Search Providers & API Keys"
          >
            <Settings2 className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Providers</span>
          </button>

          {/* Cloud Deploy Guide */}
          <button
            onClick={onOpenDeploy}
            className="hidden lg:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Zero-Budget Deployment Guide"
          >
            <CloudLightning className="w-3.5 h-3.5 text-emerald-500" />
            <span>Cloud Deploy</span>
          </button>

          {/* Search History */}
          <button
            onClick={onOpenHistory}
            className="relative inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Search History"
          >
            <History className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-[9px] font-bold text-white flex items-center justify-center">
                {historyCount > 9 ? '9+' : historyCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
