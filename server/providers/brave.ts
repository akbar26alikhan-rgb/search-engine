import { SearchProvider, SearchResult, ProviderStatus } from './types.js';

export class BraveSearchProvider implements SearchProvider {
  public id = 'brave' as const;
  public name = 'Brave Search';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.BRAVE_SEARCH_API_KEY || '';
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public getStatus(): ProviderStatus {
    const configured = this.isConfigured();
    return {
      id: this.id,
      name: this.name,
      available: configured,
      keyRequired: true,
      statusMessage: configured
        ? 'Configured and active for index-wide web search.'
        : 'API key not configured. Add BRAVE_SEARCH_API_KEY in .env (Free tier gives 2,000 queries/month at brave.com/search/api).',
      docUrl: 'https://brave.com/search/api/',
    };
  }

  public async search(query: string, options?: { limit?: number; signal?: AbortSignal }): Promise<SearchResult[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const limit = options?.limit || 10;
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.set('q', query);
    url.searchParams.set('count', String(Math.min(limit, 20)));
    url.searchParams.set('result_filter', 'web');

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': this.apiKey,
        },
        signal: options?.signal,
      });

      if (response.status === 429) {
        console.warn('Brave Search API rate limit reached (429)');
        return [];
      }

      if (!response.ok) {
        console.error(`Brave Search API error HTTP ${response.status}: ${await response.text()}`);
        return [];
      }

      const data = await response.json();
      const webResults = data.web?.results || [];

      return webResults.map((item: any, idx: number): SearchResult => {
        let domain = '';
        try {
          domain = new URL(item.url).hostname;
        } catch {
          domain = item.url;
        }

        return {
          id: `brave-${idx}-${Date.now()}`,
          title: item.title || 'Untitled',
          url: item.url,
          displayUrl: item.url,
          domain,
          snippet: item.description || '',
          provider: 'brave',
          category: 'web',
          publishedDate: item.page_age || item.age || undefined,
        };
      });
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      console.error('Brave search fetch error:', err.message);
      return [];
    }
  }
}
