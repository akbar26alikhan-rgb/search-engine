import React from 'react';
import { ResearchProgress as ProgressType } from '../types/index.js';
import { Loader2, CheckCircle2, ShieldCheck, Sparkles, X, FileSearch } from 'lucide-react';

interface ResearchProgressProps {
  progress: ProgressType;
  onCancel: () => void;
}

export const ResearchProgress: React.FC<ResearchProgressProps> = ({ progress, onCancel }) => {
  const getStageIcon = () => {
    switch (progress.stage) {
      case 'planning':
        return <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />;
      case 'searching':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'scraping':
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case 'synthesizing':
        return <FileSearch className="w-4 h-4 text-indigo-500 animate-bounce" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default:
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 my-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg shadow-slate-200/40 dark:shadow-none">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
              {getStageIcon()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                {progress.stage === 'scraping' ? 'SSRF-Protected Source Extraction' : `${progress.stage} Pipeline`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {progress.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900">
              {progress.percentage}%
            </span>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Cancel Research"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-all duration-300 rounded-full"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        {progress.activeQueries && progress.activeQueries.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
              Complementary Search Vectors:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {progress.activeQueries.map((q, idx) => (
                <span
                  key={idx}
                  className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                >
                  {q}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
