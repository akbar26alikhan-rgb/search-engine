import { SearchProvider, SearchResult, ProviderStatus } from './types.js';

export class WikipediaSearchProvider implements SearchProvider {
  public id = 'wikipedia' as const;
  public name = 'Wikipedia Knowledge';

  public isConfigured(): boolean {
    return true;
  }

  public getStatus(): ProviderStatus {
    return {
      id: this.id,
      name: this.name,
      available: true,
      keyRequired: false,
      statusMessage: 'Active using public MediaWiki API for encyclopedia and structured concepts.',
      docUrl: 'https://www.mediawiki.org/wiki/API:Search',
    };
  }

  public async search(query: string, options?: { limit?: number; signal?: AbortSignal }): Promise<SearchResult[]> {
    const limit = options?.limit || 5;
    const url = new URL('https://en.wikipedia.org/w/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('list', 'search');
    url.searchParams.set('srsearch', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('utf8', '1');
    url.searchParams.set('srlimit', String(Math.min(limit, 10)));

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'DeepSeekr-Search-Engine/1.0 (info@deepseekr.local)',
        },
        signal: options?.signal,
      });

      if (!response.ok) {
        console.error(`Wikipedia API error ${response.status}`);
        return [];
      }

      const data = await response.json();
      const items = data.query?.search || [];

      return items.map((item: any): SearchResult => {
        const cleanSnippet = (item.snippet || '')
          .replace(/<span class="searchmatch">/g, '')
          .replace(/<\/span>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/<[^>]*>?/gm, '');

        const articleSlug = encodeURIComponent(item.title.replace(/ /g, '_'));
        const articleUrl = `https://en.wikipedia.org/wiki/${articleSlug}`;

        return {
          id: `wiki-${item.pageid}`,
          title: item.title,
          url: articleUrl,
          displayUrl: `en.wikipedia.org/wiki/${item.title.replace(/ /g, '_')}`,
          domain: 'en.wikipedia.org',
          snippet: cleanSnippet || `Wikipedia encyclopedic entry for ${item.title}.`,
          provider: 'wikipedia',
          category: 'encyclopedia',
          publishedDate: item.timestamp ? item.timestamp.split('T')[0] : undefined,
        };
      });
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      console.error('Wikipedia search error:', err.message);
      return [];
    }
  }
}
