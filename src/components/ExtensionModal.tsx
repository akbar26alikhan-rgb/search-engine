import React from 'react';
import { X, Puzzle, Monitor } from 'lucide-react';

interface ExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExtensionModal: React.FC<ExtensionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <Puzzle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Brave Browser Extension
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manifest V3 extension for instant selection & page research.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">⚡ Quick Popup Search</span>
              <p className="text-slate-600 dark:text-slate-400 text-xs">Execute searches directly from the browser toolbar without leaving your tab.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">📋 Highlight & Right-Click</span>
              <p className="text-slate-600 dark:text-slate-400 text-xs">Right-click any selected technical concept to trigger instant deep inquiry.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-violet-500" />
              Installation Steps in Brave:
            </h3>
            <ol className="list-decimal ml-4 space-y-2 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
              <li>
                Open Brave and navigate to <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-xs">brave://extensions</code>.
              </li>
              <li>
                In the top right corner, toggle <strong>Developer mode</strong> to <strong>ON</strong>.
              </li>
              <li>
                Click the <strong>Load unpacked</strong> button in the top left.
              </li>
              <li>
                Select the <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-xs">/extension</code> directory located in the project repository.
              </li>
              <li>
                DeepSeekr will appear in your extensions list. Pin it to your Brave toolbar for 1-click access!
              </li>
            </ol>
          </div>

          <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 text-xs text-violet-900 dark:text-violet-300">
            <strong>Zero Secrets in Extension</strong>: The extension talks directly to the backend API (<code className="font-mono">/api/search</code>) and contains zero embedded API tokens or private keys.
          </div>
        </div>
      </div>
    </div>
  );
};
