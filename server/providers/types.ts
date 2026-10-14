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

export interface SearchProvider {
  id: ProviderId;
  name: string;
  isConfigured(): boolean;
  getStatus(): ProviderStatus;
  search(query: string, options?: { limit?: number; signal?: AbortSignal }): Promise<SearchResult[]>;
}
