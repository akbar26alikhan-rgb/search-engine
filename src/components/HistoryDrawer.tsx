import React from 'react';
import { HistoryItem } from '../types/index.js';
import { X, Trash2, Clock, Search, Zap, Microscope } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectQuery: (query: string, mode: 'quick' | 'deep') => void;
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectQuery,
  onDeleteItem,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
      />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col z-10 shadow-2xl">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Search & Research History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {history.length > 0 && (
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500">{history.length} saved inquiries</span>
            <button
              onClick={onClearHistory}
              className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Trash2 className="w-3 h-3" /> Clear all
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No search history yet.</p>
              <p className="text-xs text-slate-500 mt-1">Previous searches and research inquiries will be saved in your persistent SQLite store.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="group relative flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all"
              >
                <div
                  onClick={() => {
                    onSelectQuery(item.query, item.mode);
                    onClose();
                  }}
                  className="flex-1 cursor-pointer pr-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {item.mode === 'deep' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                        <Microscope className="w-2.5 h-2.5" /> Deep
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        <Zap className="w-2.5 h-2.5" /> Quick
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {item.query}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  title="Delete from history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
