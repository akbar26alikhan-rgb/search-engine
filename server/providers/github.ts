import { SearchProvider, SearchResult, ProviderStatus } from './types.js';

export class GitHubSearchProvider implements SearchProvider {
  public id = 'github' as const;
  public name = 'GitHub Repositories';
  private token: string;

  constructor(token?: string) {
    this.token = token || process.env.GITHUB_TOKEN || '';
  }

  public isConfigured(): boolean {
    return true;
  }

  public getStatus(): ProviderStatus {
    return {
      id: this.id,
      name: this.name,
      available: true,
      keyRequired: false,
      statusMessage: this.token
        ? 'Active with authenticated rate limit (5,000 req/hr).'
        : 'Active using public GitHub API (60 req/hr). Optional GITHUB_TOKEN increases limits.',
      docUrl: 'https://docs.github.com/en/rest/search/search#search-repositories',
    };
  }

  public async search(query: string, options?: { limit?: number; signal?: AbortSignal }): Promise<SearchResult[]> {
    const limit = options?.limit || 8;
    const url = new URL('https://api.github.com/search/repositories');
    url.searchParams.set('q', query);
    url.searchParams.set('sort', 'stars');
    url.searchParams.set('order', 'desc');
    url.searchParams.set('per_page', String(Math.min(limit, 20)));

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'DeepSeekr-Search-Engine/1.0',
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    try {
      const response = await fetch(url.toString(), {
        headers,
        signal: options?.signal,
      });

      if (response.status === 403 || response.status === 429) {
        console.warn('GitHub API rate limit reached');
        return [];
      }

      if (!response.ok) {
        console.error(`GitHub API error ${response.status}: ${await response.text()}`);
        return [];
      }

      const data = await response.json();
      const items = data.items || [];

      return items.map((repo: any): SearchResult => {
        const topics = Array.isArray(repo.topics) && repo.topics.length > 0 ? ` [${repo.topics.slice(0, 4).join(', ')}]` : '';
        const language = repo.language ? ` • ${repo.language}` : '';
        const stars = typeof repo.stargazers_count === 'number' ? repo.stargazers_count : 0;
        const description = (repo.description || 'Open source repository') + language + topics;

        return {
          id: `github-${repo.id}`,
          title: repo.full_name || repo.name,
          url: repo.html_url,
          displayUrl: repo.html_url.replace('https://', ''),
          domain: 'github.com',
          snippet: description,
          provider: 'github',
          category: 'github',
          starsOrScore: stars,
          authorOrOwner: repo.owner?.login,
          publishedDate: repo.updated_at ? repo.updated_at.split('T')[0] : undefined,
        };
      });
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      console.error('GitHub search error:', err.message);
      return [];
    }
  }
}
