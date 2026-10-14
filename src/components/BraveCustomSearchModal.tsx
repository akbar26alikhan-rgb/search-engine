import React, { useState } from 'react';
import { X, Copy, Check, Compass, Smartphone, Monitor } from 'lucide-react';

interface BraveCustomSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BraveCustomSearchModal: React.FC<BraveCustomSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedShortcut, setCopiedShortcut] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const searchPattern = `${currentOrigin}/search?q=%s`;
  const shortcut = ':ds';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(searchPattern);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyShortcut = () => {
    navigator.clipboard.writeText(shortcut);
    setCopiedShortcut(true);
    setTimeout(() => setCopiedShortcut(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Brave Custom Search Engine Setup
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trigger DeepSeekr instantly from your Brave URL address bar.
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
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-2">
              <Monitor className="w-4 h-4 text-blue-500" />
              <span>Desktop Setup (Brave Browser)</span>
            </div>
            <ol className="list-decimal ml-4 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                In Brave, go to <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-xs">brave://settings/searchEngines</code>
              </li>
              <li>Under <strong>Site search</strong>, click the <strong>Add</strong> button.</li>
              <li>Fill in the fields as follows:</li>
            </ol>

            <div className="mt-3 space-y-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Search Engine Name</label>
                <input
                  type="text"
                  readOnly
                  value="DeepSeekr"
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[11px] font-semibold text-slate-500">Shortcut (Keyword)</label>
                  <button onClick={handleCopyShortcut} className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5">
                    {copiedShortcut ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedShortcut ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={shortcut}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[11px] font-semibold text-slate-500">URL with %s in place of query</label>
                  <button onClick={handleCopyUrl} className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5">
                    {copiedUrl ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={searchPattern}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-semibold"
                />
              </div>
            </div>

            <p className="mt-3 text-[11px] text-slate-500">
              💡 <strong>Usage</strong>: Type <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">:ds react 19</code> in Brave's URL bar and press Enter!
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-2">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Brave on Android</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
              Brave on Android supports searching any site via the OpenSearch standard (already built into DeepSeekr via <code className="font-mono">/opensearch.xml</code>):
            </p>
            <ul className="list-disc ml-4 space-y-1 text-xs text-slate-600 dark:text-slate-300">
              <li>Open DeepSeekr in Brave Android and perform one search.</li>
              <li>Brave automatically discovers the search engine. Go to <strong>Settings ➔ Search engines</strong> to select it as default.</li>
              <li>Alternatively, tap the 3 dots ➔ <strong>"Add to Home screen"</strong> for instant 1-tap app access.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
