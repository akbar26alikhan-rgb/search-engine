import React, { useState } from 'react';
import { ProviderStatus } from '../types/index.js';
import { X, CheckCircle2, AlertCircle, Key, ExternalLink } from 'lucide-react';

interface ProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: ProviderStatus[];
  geminiConfigured: boolean;
  onUpdateBraveKey: (key: string) => Promise<void>;
}

export const ProviderModal: React.FC<ProviderModalProps> = ({
  isOpen,
  onClose,
  providers,
  geminiConfigured,
  onUpdateBraveKey,
}) => {
  const [braveKey, setBraveKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateBraveKey(braveKey);
      setStatusMessage('Brave Search API key updated successfully!');
      setTimeout(() => setStatusMessage(''), 2500);
    } catch {
      setStatusMessage('Failed to update API key.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Search Providers & Model Integrations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              DeepSeekr coordinates modular open-source and free-tier providers for zero-budget research.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Google Gemini 3.8 Flash</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                  AI Model
                </span>
              </div>
              {geminiConfigured ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Active & Grounded
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" /> Heuristic Fallback
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Powers query planning matrix expansion and deep report synthesis. If key is missing, DeepSeekr automatically uses its deterministic heuristic query planner and structured synthesizer.
            </p>
          </div>

          {providers.map((p) => (
            <div
              key={p.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</span>
                  {p.keyRequired ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      API Key Required
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Free / Zero Key
                    </span>
                  )}
                </div>
                {p.available ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                    <AlertCircle className="w-4 h-4" /> Unconfigured
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
                {p.statusMessage}
              </p>
              <a
                href={p.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>Documentation & Setup</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}

          <div className="mt-4 p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
              <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Configure Brave Search API Key (Optional)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Brave Search offers a generous free tier of 2,000 queries per month at <a href="https://brave.com/search/api/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">brave.com/search/api</a>. If not configured, DeepSeekr automatically queries GitHub, Wikipedia, Hacker News, and DuckDuckGo.
            </p>
            <form onSubmit={handleSave} className="flex gap-2">
              <input
                type="password"
                placeholder="Enter BRAVE_SEARCH_API_KEY..."
                value={braveKey}
                onChange={(e) => setBraveKey(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={saving || !braveKey.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Updating...' : 'Save Key'}
              </button>
            </form>
            {statusMessage && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                {statusMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
