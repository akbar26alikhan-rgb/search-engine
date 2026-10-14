import { SearchProvider, SearchResult, ProviderStatus, ProviderId } from './types.js';
import { BraveSearchProvider } from './brave.js';
import { GitHubSearchProvider } from './github.js';
import { WikipediaSearchProvider } from './wikipedia.js';
import { HackerNewsSearchProvider } from './hackernews.js';
import { DuckDuckGoSearchProvider } from './duckduckgo.js';

export class ProviderManager {
  private providers: Map<ProviderId, SearchProvider> = new Map();

  constructor() {
    this.register(new BraveSearchProvider());
    this.register(new GitHubSearchProvider());
    this.register(new WikipediaSearchProvider());
    this.register(new HackerNewsSearchProvider());
    this.register(new DuckDuckGoSearchProvider());
  }

  public register(provider: SearchProvider): void {
    this.providers.set(provider.id, provider);
  }

  public getProvider(id: ProviderId): SearchProvider | undefined {
    return this.providers.get(id);
  }

  public getAllStatuses(): ProviderStatus[] {
    return Array.from(this.providers.values()).map(p => p.getStatus());
  }

  public updateBraveKey(key: string): void {
    this.register(new BraveSearchProvider(key));
  }

  public async searchAll(query: string, options?: { limitPerProvider?: number; signal?: AbortSignal }): Promise<{ results: SearchResult[]; errors: Record<string, string> }> {
    const limit = options?.limitPerProvider || 8;
    const errors: Record<string, string> = {};
    const promises: Promise<SearchResult[]>[] = [];

    for (const [id, provider] of this.providers.entries()) {
      if (id === 'brave' && !provider.isConfigured()) {
        continue;
      }

      promises.push(
        provider.search(query, { limit, signal: options?.signal }).catch(err => {
          if (err.name === 'AbortError') throw err;
          errors[id] = err.message || 'Provider request failed';
          return [];
        })
      );
    }

    const settled = await Promise.all(promises);
    const flattened = settled.flat();
    return { results: flattened, errors };
  }
}

export const providerManager = new ProviderManager();
