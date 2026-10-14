export type ResultCategory = 'web' | 'github' | 'technical' | 'community' | 'encyclopedia';
export type ProviderId = 'brave' | 'github' | 'wikipedia' | 'hackernews' | 'duckduckgo';

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  displayUrl: string;
  domain: string;
  snippet: string;
  provider: ProviderId;
  category: ResultCategory;
  publishedDate?: string;
  authorOrOwner?: string;
  starsOrScore?: number;
  relevanceScore?: number;
  originalityScore?: number;
  uniquenessReason?: string;
  contribution?: string;
  isUniqueDiscovery?: boolean;
}

export interface ProviderStatus {
  id: ProviderId;
  name: string;
  available: boolean;
  keyRequired: boolean;
  statusMessage: string;
  docUrl: string;
}

export interface PlannedQuery {
  query: string;
  strategy: 'primary' | 'exact' | 'technical' | 'github' | 'community' | 'academic' | 'specialized';
  rationale: string;
}

export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  error?: string;
  bytesReceived: number;
}

export interface DeepResearchResult {
  searchId: string;
  query: string;
  mode: 'quick' | 'deep';
  results: SearchResult[];
  uniqueWebsites: SearchResult[];
  githubProjects: SearchResult[];
  technicalSources: SearchResult[];
  communityDiscussions: SearchResult[];
  scrapedPages: ScrapedPage[];
  reportMarkdown: string;
  plannedQueries: PlannedQuery[];
  durationMs: number;
}

export interface ResearchProgress {
  stage: 'initiating' | 'planning' | 'searching' | 'scraping' | 'ranking' | 'synthesizing' | 'completed' | 'cancelled' | 'error';
  message: string;
  percentage: number;
  activeQueries?: string[];
  resultsFound?: number;
  pagesScraped?: number;
}

export interface HistoryItem {
  id: string;
  query: string;
  mode: 'quick' | 'deep';
  created_at: string;
  result_count: number;
}
