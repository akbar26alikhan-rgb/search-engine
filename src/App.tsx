import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  DeepResearchResult, 
  ResearchProgress as ProgressType, 
  ProviderStatus, 
  HistoryItem,
  SearchResult 
} from './types/index.js';
import { Navbar } from './components/Navbar.js';
import { SearchHeader } from './components/SearchHeader.js';
import { ResearchProgress } from './components/ResearchProgress.js';
import { ResultCard } from './components/ResultCard.js';
import { ReportViewer } from './components/ReportViewer.js';
import { HistoryDrawer } from './components/HistoryDrawer.js';
import { ProviderModal } from './components/ProviderModal.js';
import { BraveCustomSearchModal } from './components/BraveCustomSearchModal.js';
import { ExtensionModal } from './components/ExtensionModal.js';
import { CloudDeploymentModal } from './components/CloudDeploymentModal.js';
import { 
  Globe, 
  Sparkles, 
  Code2, 
  BookOpen, 
  MessageSquare, 
  FileText, 
  Filter, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

type TabId = 'all' | 'unique' | 'github' | 'technical' | 'community' | 'report';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('deepseekr_theme');
      if (stored === 'light' || stored === 'dark') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('deepseekr_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [currentQuery, setCurrentQuery] = useState('');
  const [currentMode, setCurrentMode] = useState<'quick' | 'deep'>('quick');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressType | null>(null);
  const [researchData, setResearchData] = useState<DeepResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('all');

  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [minOriginality, setMinOriginality] = useState<number>(0);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [providersOpen, setProvidersOpen] = useState(false);
  const [customSearchOpen, setCustomSearchOpen] = useState(false);
  const [extensionOpen, setExtensionOpen] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [geminiConfigured, setGeminiConfigured] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const activeClientIdRef = useRef<string | null>(null);

  useEffect(() => {
    fetchHealth();
    fetchHistory();

    const params = new URLSearchParams(window.location.search);
    const qParam = params.get('q');
    const modeParam = params.get('mode');

    if (qParam && qParam.trim()) {
      const mode = modeParam === 'deep' ? 'deep' : 'quick';
      executeSearch(qParam.trim(), mode);
    }
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
        setGeminiConfigured(Boolean(data.geminiConfigured));
      }
    } catch (err) {
      console.warn('Could not load health endpoint:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.warn('Could not load search history:', err);
    }
  };

  const handleUpdateBraveKey = async (key: string) => {
    const res = await fetch('/api/providers/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ braveApiKey: key }),
    });
    if (res.ok) {
      const data = await res.json();
      setProviders(data.providers || []);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    await fetch(`/api/history/${id}`, { method: 'DELETE' });
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const handleClearHistory = async () => {
    await fetch('/api/history/clear', { method: 'POST' });
    setHistory([]);
  };

  const executeSearch = async (query: string, mode: 'quick' | 'deep') => {
    if (!query.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);
    setCurrentQuery(query);
    setCurrentMode(mode);
    setSelectedDomain(null);
    setMinOriginality(0);

    setActiveTab(mode === 'deep' ? 'report' : 'all');

    const newUrl = `${window.location.pathname}?q=${encodeURIComponent(query)}&mode=${mode}`;
    window.history.pushState({ query, mode }, '', newUrl);

    const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    activeClientIdRef.current = clientId;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setProgress({
      stage: 'initiating',
      message: `Starting ${mode === 'deep' ? 'Deep Research inquiry' : 'Quick Search'}...`,
      percentage: 5,
    });

    try {
      const streamUrl = `/api/search/stream?q=${encodeURIComponent(query)}&mode=${mode}&clientId=${clientId}`;
      const response = await fetch(streamUrl, {
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const eventBlock of events) {
          const lines = eventBlock.split('\n');
          let eventType = 'message';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.replace('event: ', '').trim();
            } else if (line.startsWith('data: ')) {
              eventData = line.replace('data: ', '').trim();
            }
          }

          if (eventData) {
            try {
              const parsed = JSON.parse(eventData);
              if (eventType === 'progress' || eventType === 'status') {
                setProgress(parsed);
              } else if (eventType === 'complete') {
                setResearchData(parsed);
                setProgress(null);
                setIsLoading(false);
                fetchHistory();
                return;
              } else if (eventType === 'cancelled') {
                setProgress(null);
                setIsLoading(false);
                return;
              } else if (eventType === 'error') {
                setError(parsed.error || 'Research failed');
                setProgress(null);
                setIsLoading(false);
                return;
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setProgress(null);
        setIsLoading(false);
        return;
      }

      console.warn('Streaming connection failed, falling back to standard POST:', err);
      try {
        const fallbackRes = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, mode }),
        });
        if (!fallbackRes.ok) throw new Error('Search failed');
        const data = await fallbackRes.json();
        setResearchData(data);
        fetchHistory();
      } catch (postErr: any) {
        setError(postErr.message || 'Search execution failed');
      } finally {
        setProgress(null);
        setIsLoading(false);
      }
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (activeClientIdRef.current) {
      fetch('/api/search/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: activeClientIdRef.current }),
      }).catch(() => {});
    }
    setIsLoading(false);
    setProgress(null);
  };

  const currentTabResults = useMemo(() => {
    if (!researchData) return [];

    let list: SearchResult[] = [];
    switch (activeTab) {
      case 'unique':
        list = researchData.uniqueWebsites;
        break;
      case 'github':
        list = researchData.githubProjects;
        break;
      case 'technical':
        list = researchData.technicalSources;
        break;
      case 'community':
        list = researchData.communityDiscussions;
        break;
      default:
        list = researchData.results;
    }

    if (selectedDomain) {
      list = list.filter(r => r.domain === selectedDomain);
    }

    if (minOriginality > 0) {
      list = list.filter(r => (r.originalityScore || 0) >= minOriginality);
    }

    return list;
  }, [researchData, activeTab, selectedDomain, minOriginality]);

  const domainCounts = useMemo(() => {
    if (!researchData) return [];
    const counts: Record<string, number> = {};
    for (const r of researchData.results) {
      counts[r.domain] = (counts[r.domain] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [researchData]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-blue-500 selection:text-white">
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenProviders={() => setProvidersOpen(true)}
        onOpenCustomSearch={() => setCustomSearchOpen(true)}
        onOpenExtension={() => setExtensionOpen(true)}
        onOpenDeploy={() => setDeployOpen(true)}
        historyCount={history.length}
        onResetSearch={() => {
          setResearchData(null);
          setCurrentQuery('');
          window.history.pushState({}, '', '/');
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pb-16">
        <SearchHeader
          onSearch={executeSearch}
          isLoading={isLoading}
          onCancel={handleCancel}
          currentQuery={currentQuery}
          currentMode={currentMode}
          isCompact={Boolean(researchData || isLoading)}
        />

        {isLoading && progress && (
          <ResearchProgress
            progress={progress}
            onCancel={handleCancel}
          />
        )}

        {error && (
          <div className="max-w-3xl mx-auto my-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between text-rose-700 dark:text-rose-300 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => executeSearch(currentQuery, currentMode)}
              className="flex items-center gap-1 font-semibold underline hover:no-underline text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {researchData && !isLoading && (
          <div className="mt-4">
            <div className="border-b border-slate-200 dark:border-slate-800 mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'all'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>All Sources</span>
                  <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {researchData.results.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('unique')}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'unique'
                      ? 'border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span>Unique Websites</span>
                  <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
                    {researchData.uniqueWebsites.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('github')}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'github'
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Code2 className="w-4 h-4 text-purple-500" />
                  <span>GitHub Projects</span>
                  <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {researchData.githubProjects.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('technical')}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'technical'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span>Technical Specs</span>
                  <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {researchData.technicalSources.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('community')}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'community'
                      ? 'border-amber-600 text-amber-600 dark:text-amber-400 dark:border-amber-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  <span>Community Discussions</span>
                  <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {researchData.communityDiscussions.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('report')}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'report'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span>Research Report</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    Cited
                  </span>
                </button>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 pb-2">
                Completed in <span className="font-semibold text-slate-700 dark:text-slate-300">{(researchData.durationMs / 1000).toFixed(1)}s</span>
              </div>
            </div>

            {activeTab === 'report' ? (
              <ReportViewer researchData={researchData} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-5">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5" /> Domain Diversity
                      </span>
                      {selectedDomain && (
                        <button
                          onClick={() => setSelectedDomain(null)}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedDomain(null)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedDomain === null
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>All Domains</span>
                        <span className="font-mono text-[11px] opacity-70">{researchData.results.length}</span>
                      </button>

                      {domainCounts.map(([domain, count]) => (
                        <button
                          key={domain}
                          onClick={() => setSelectedDomain(domain === selectedDomain ? null : domain)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            selectedDomain === domain
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="truncate pr-2">{domain}</span>
                          <span className="font-mono text-[11px] opacity-70">{count}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                      Originality Threshold
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      step="10"
                      value={minOriginality}
                      onChange={(e) => setMinOriginality(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                      <span>All (0%)</span>
                      <span>High (&ge;{minOriginality}%)</span>
                    </div>
                  </div>

                  {researchData.plannedQueries && researchData.plannedQueries.length > 1 && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                        Query Planning Matrix
                      </span>
                      <div className="space-y-2">
                        {researchData.plannedQueries.map((pq, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                            <span className="font-mono text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 block">
                              [{pq.strategy}]
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                              {pq.query}
                            </span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {pq.rationale}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-3 space-y-4">
                  {currentTabResults.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                      <Globe className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-semibold">No results match the active filter criteria.</p>
                      <button
                        onClick={() => {
                          setSelectedDomain(null);
                          setMinOriginality(0);
                        }}
                        className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-semibold underline"
                      >
                        Reset domain and originality filters
                      </button>
                    </div>
                  ) : (
                    currentTabResults.map((item, idx) => (
                      <ResultCard key={item.id} result={item} index={idx} />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onSelectQuery={(q, m) => executeSearch(q, m)}
        onDeleteItem={handleDeleteHistory}
        onClearHistory={handleClearHistory}
      />

      <ProviderModal
        isOpen={providersOpen}
        onClose={() => setProvidersOpen(false)}
        providers={providers}
        geminiConfigured={geminiConfigured}
        onUpdateBraveKey={handleUpdateBraveKey}
      />

      <BraveCustomSearchModal
        isOpen={customSearchOpen}
        onClose={() => setCustomSearchOpen(false)}
      />

      <ExtensionModal
        isOpen={extensionOpen}
        onClose={() => setExtensionOpen(false)}
      />

      <CloudDeploymentModal
        isOpen={deployOpen}
        onClose={() => setDeployOpen(false)}
      />
    </div>
  );
}
