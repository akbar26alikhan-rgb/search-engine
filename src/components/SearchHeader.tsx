import React, { useState, useEffect } from 'react';
import { Search, Zap, Microscope, X, ArrowRight } from 'lucide-react';

interface SearchHeaderProps {
  onSearch: (query: string, mode: 'quick' | 'deep') => void;
  isLoading: boolean;
  onCancel: () => void;
  currentQuery: string;
  currentMode: 'quick' | 'deep';
  isCompact?: boolean;
}

const SAMPLE_QUERIES = [
  'Zero-budget Vector Databases',
  'WebAssembly Component Model',
  'Postgres vs SQLite for Edge',
  'LLM Inference on Consumer GPU',
  'CRDTs in Collaborative Editing',
];

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  onSearch,
  isLoading,
  onCancel,
  currentQuery,
  currentMode,
  isCompact = false,
}) => {
  const [query, setQuery] = useState(currentQuery);
  const [mode, setMode] = useState<'quick' | 'deep'>(currentMode);

  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    setMode(currentMode);
  }, [currentMode]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSearch(query.trim(), mode);
  };

  return (
    <div className={`w-full transition-all duration-300 ${isCompact ? 'py-4' : 'pt-12 pb-8'}`}>
      <div className="max-w-3xl mx-auto px-4">
        {!isCompact && (
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
              Deep Search Beyond the Surface.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Multi-angle query planning, real codebases, peer engineering critiques, and automated research synthesis with zero AI slop.
            </p>
          </div>
        )}

        <div className="flex justify-center mb-4">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setMode('quick')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'quick'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Search</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('deep')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'deep'
                  ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Microscope className="w-3.5 h-3.5" />
              <span>Deep Research</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-white/20 rounded-md">
                Multi-Vector
              </span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative group">
          <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 focus-within:border-blue-500 dark:focus-within:border-blue-500 shadow-lg shadow-slate-200/50 dark:shadow-none transition-all">
            <div className="pl-4 text-slate-400">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === 'deep'
                  ? 'Ask a deep technical question, system architecture, or topic...'
                  : 'Search across web, GitHub, Wikipedia, and Hacker News...'
              }
              className="w-full py-4 pl-3 pr-28 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent outline-none"
            />

            {query && !isLoading && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1.5 mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="pr-2">
              {isLoading ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-500/25 transition-all"
                >
                  <span>Search</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </form>

        {!isCompact && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Try:</span>
            {SAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setQuery(q);
                  onSearch(q, mode);
                }}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
