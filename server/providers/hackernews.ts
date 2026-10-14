import { SearchProvider, SearchResult, ProviderStatus } from './types.js';

export class HackerNewsSearchProvider implements SearchProvider {
  public id = 'hackernews' as const;
  public name = 'Hacker News Community';

  public isConfigured(): boolean {
    return true;
  }

  public getStatus(): ProviderStatus {
    return {
      id: this.id,
      name: this.name,
      available: true,
      keyRequired: false,
      statusMessage: 'Active using public Algolia HN Search API for community engineering discussions.',
      docUrl: 'https://hn.algolia.com/api',
    };
  }

  public async search(query: string, options?: { limit?: number; signal?: AbortSignal }): Promise<SearchResult[]> {
    const limit = options?.limit || 8;
    const url = new URL('https://hn.algolia.com/api/v1/search');
    url.searchParams.set('query', query);
    url.searchParams.set('tags', '(story,poll)');
    url.searchParams.set('hitsPerPage', String(Math.min(limit, 20)));

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'DeepSeekr-Search-Engine/1.0',
        },
        signal: options?.signal,
      });

      if (!response.ok) {
        console.error(`Hacker News API error ${response.status}`);
        return [];
      }

      const data = await response.json();
      const hits = data.hits || [];

      return hits.map((hit: any): SearchResult => {
        const itemUrl = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
        let domain = 'news.ycombinator.com';
        try {
          if (hit.url) {
            domain = new URL(hit.url).hostname;
          }
        } catch {
          // fallback
        }

        const points = hit.points || 0;
        const commentCount = hit.num_comments || 0;
        const author = hit.author || 'unknown';
        const snippet = `${hit.title} (${points} points, ${commentCount} comments by ${author}). Discussion: https://news.ycombinator.com/item?id=${hit.objectID}`;

        return {
          id: `hn-${hit.objectID}`,
          title: hit.title || 'Hacker News Thread',
          url: itemUrl,
          displayUrl: itemUrl.replace(/^https?:\/\//, ''),
          domain,
          snippet,
          provider: 'hackernews',
          category: 'community',
          starsOrScore: points,
          authorOrOwner: author,
          publishedDate: hit.created_at ? hit.created_at.split('T')[0] : undefined,
        };
      });
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      console.error('Hacker News search error:', err.message);
      return [];
    }
  }
}
