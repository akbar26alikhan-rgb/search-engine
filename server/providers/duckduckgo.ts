import * as cheerio from 'cheerio';
import { SearchProvider, SearchResult, ProviderStatus } from './types.js';

export class DuckDuckGoSearchProvider implements SearchProvider {
  public id = 'duckduckgo' as const;
  public name = 'DuckDuckGo Web';

  public isConfigured(): boolean {
    return true;
  }

  public getStatus(): ProviderStatus {
    return {
      id: this.id,
      name: this.name,
      available: true,
      keyRequired: false,
      statusMessage: 'Active using open-web search index for general web results without requiring an API key.',
      docUrl: 'https://duckduckgo.com',
    };
  }

  public async search(query: string, options?: { limit?: number; signal?: AbortSignal }): Promise<SearchResult[]> {
    const limit = options?.limit || 10;
    const results: SearchResult[] = [];

    try {
      const searchUrl = 'https://html.duckduckgo.com/html/';
      const body = new URLSearchParams({ q: query, b: '' });

      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 DeepSeekr/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        body: body.toString(),
        signal: options?.signal,
      });

      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);

        $('.result').each((idx, el) => {
          if (results.length >= limit) return;

          const titleEl = $(el).find('.result__title a');
          const snippetEl = $(el).find('.result__snippet');

          let rawHref = titleEl.attr('href') || '';
          const title = titleEl.text().trim();
          const snippet = snippetEl.text().trim();

          let finalUrl = rawHref;
          if (rawHref.includes('uddg=')) {
            try {
              const urlObj = new URL(rawHref, 'https://html.duckduckgo.com');
              const uddg = urlObj.searchParams.get('uddg');
              if (uddg) finalUrl = decodeURIComponent(uddg);
            } catch {
              // fallback
            }
          }

          if (finalUrl && finalUrl.startsWith('http') && title && !finalUrl.includes('duckduckgo.com/')) {
            let domain = '';
            try {
              domain = new URL(finalUrl).hostname;
            } catch {
              domain = finalUrl;
            }

            let category: SearchResult['category'] = 'web';
            if (domain.includes('github.com')) category = 'github';
            else if (domain.includes('stackoverflow.com') || domain.includes('docs.') || domain.includes('developer.')) category = 'technical';
            else if (domain.includes('reddit.com') || domain.includes('news.ycombinator.com')) category = 'community';
            else if (domain.includes('wikipedia.org')) category = 'encyclopedia';

            results.push({
              id: `ddg-${results.length}-${Date.now()}`,
              title,
              url: finalUrl,
              displayUrl: finalUrl.replace(/^https?:\/\//, ''),
              domain,
              snippet: snippet || `Result from ${domain}`,
              provider: 'duckduckgo',
              category,
            });
          }
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      console.warn('DuckDuckGo HTML search warning:', err.message);
    }

    if (results.length === 0) {
      try {
        const iaUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        const res = await fetch(iaUrl, { signal: options?.signal });
        if (res.ok) {
          const data = await res.json();
          if (data.AbstractURL && data.Heading) {
            results.push({
              id: `ddg-ia-${Date.now()}`,
              title: data.Heading,
              url: data.AbstractURL,
              displayUrl: data.AbstractURL,
              domain: new URL(data.AbstractURL).hostname,
              snippet: data.AbstractText || data.Heading,
              provider: 'duckduckgo',
              category: 'encyclopedia',
            });
          }

          if (Array.isArray(data.RelatedTopics)) {
            for (const topic of data.RelatedTopics.slice(0, 5)) {
              if (topic.FirstURL && topic.Text) {
                try {
                  const domain = new URL(topic.FirstURL).hostname;
                  results.push({
                    id: `ddg-topic-${results.length}`,
                    title: topic.Text.split(' - ')[0] || topic.Text,
                    url: topic.FirstURL,
                    displayUrl: topic.FirstURL,
                    domain,
                    snippet: topic.Text,
                    provider: 'duckduckgo',
                    category: 'web',
                  });
                } catch {
                  // ignore
                }
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') throw err;
        console.warn('DuckDuckGo Instant Answer error:', err.message);
      }
    }

    return results;
  }
}
