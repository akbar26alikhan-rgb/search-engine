import { SearchResult } from '../providers/types.js';

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'ref_src',
  'fbclid',
  'gclid',
  'msclkid',
  'mc_eid',
  '_ga',
  '_gl',
  'igshid',
  'si',
]);

export class Deduplicator {
  public normalizeUrl(rawUrl: string): string {
    try {
      const parsed = new URL(rawUrl);

      parsed.hostname = parsed.hostname.toLowerCase();
      parsed.protocol = parsed.protocol.toLowerCase();

      if ((parsed.protocol === 'http:' && parsed.port === '80') || (parsed.protocol === 'https:' && parsed.port === '443')) {
        parsed.port = '';
      }

      parsed.hash = '';

      const paramsToRemove: string[] = [];
      parsed.searchParams.forEach((_, key) => {
        const lowerKey = key.toLowerCase();
        if (TRACKING_PARAMS.has(lowerKey) || lowerKey.startsWith('utm_')) {
          paramsToRemove.push(key);
        }
      });
      paramsToRemove.forEach(p => parsed.searchParams.delete(p));

      let cleanPath = parsed.pathname;
      if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
        cleanPath = cleanPath.slice(0, -1);
      }
      parsed.pathname = cleanPath;

      return parsed.toString();
    } catch {
      return rawUrl.trim();
    }
  }

  private jaccardSimilarity(textA: string, textB: string): number {
    const tokensA = new Set(
      textA
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2)
    );
    const tokensB = new Set(
      textB
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2)
    );

    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersectionCount = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) intersectionCount++;
    }

    const unionCount = new Set([...tokensA, ...tokensB]).size;
    return unionCount > 0 ? intersectionCount / unionCount : 0;
  }

  public deduplicate(results: SearchResult[]): SearchResult[] {
    const seenUrls = new Set<string>();
    const deduplicated: SearchResult[] = [];

    for (const item of results) {
      const cleanUrl = this.normalizeUrl(item.url);
      if (seenUrls.has(cleanUrl)) {
        continue;
      }

      let isDuplicateTitle = false;
      for (const existing of deduplicated) {
        const sameDomain = existing.domain === item.domain;
        const titleSim = this.jaccardSimilarity(existing.title, item.title);

        if (sameDomain && titleSim > 0.8) {
          isDuplicateTitle = true;
          break;
        }

        if (titleSim > 0.92) {
          const snippetSim = this.jaccardSimilarity(existing.snippet, item.snippet);
          if (snippetSim > 0.75) {
            isDuplicateTitle = true;
            break;
          }
        }
      }

      if (isDuplicateTitle) {
        continue;
      }

      seenUrls.add(cleanUrl);
      deduplicated.push({
        ...item,
        url: cleanUrl,
        displayUrl: cleanUrl.replace(/^https?:\/\//, ''),
      });
    }

    return deduplicated;
  }

  public groupByDomain(results: SearchResult[]): Record<string, SearchResult[]> {
    const groups: Record<string, SearchResult[]> = {};
    for (const item of results) {
      const d = item.domain || 'other';
      if (!groups[d]) {
        groups[d] = [];
      }
      groups[d].push(item);
    }
    return groups;
  }
}

export const deduplicator = new Deduplicator();
