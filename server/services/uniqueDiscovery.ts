import { SearchResult } from '../providers/types.js';

const AGGREGATOR_DOMAINS = new Set([
  'youtube.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'pinterest.com',
  'tiktok.com',
  'medium.com',
  'linkedin.com',
]);

export class UniqueDiscoveryService {
  public analyzeUniqueWebsites(query: string, results: SearchResult[]): SearchResult[] {
    const queryTokens = new Set(
      query
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2)
    );

    const scored = results.map(item => {
      let relevance = 50;
      let originality = 50;

      const titleLower = item.title.toLowerCase();
      const snippetLower = item.snippet.toLowerCase();

      let matchCount = 0;
      queryTokens.forEach(t => {
        if (titleLower.includes(t)) matchCount += 2;
        if (snippetLower.includes(t)) matchCount += 1;
      });

      relevance += Math.min(matchCount * 7, 40);

      const isAggregator = AGGREGATOR_DOMAINS.has(item.domain);
      const isEduOrGov = item.domain.endsWith('.edu') || item.domain.endsWith('.gov') || item.domain.endsWith('.org');
      const isGitHub = item.domain === 'github.com';
      const isTechnicalDocs = item.domain.includes('docs.') || item.domain.includes('developer.') || item.domain.includes('wiki');

      if (isAggregator) {
        originality -= 20;
      } else if (isEduOrGov) {
        originality += 25;
      } else if (isGitHub) {
        originality += 20;
      } else if (isTechnicalDocs) {
        originality += 20;
      } else {
        originality += 15;
      }

      if (item.starsOrScore && item.starsOrScore > 50) {
        relevance += Math.min(Math.round(Math.log10(item.starsOrScore) * 6), 15);
      }

      if (item.publishedDate) {
        const year = parseInt(item.publishedDate.slice(0, 4), 10);
        if (year >= 2024) relevance += 5;
      }

      if (item.snippet.length > 120) {
        originality += 10;
      }

      const finalRelevance = Math.min(Math.max(relevance, 20), 99);
      const finalOriginality = Math.min(Math.max(originality, 20), 99);

      const { uniquenessReason, contribution } = this.deriveExplanation(item, finalOriginality);

      return {
        ...item,
        relevanceScore: finalRelevance,
        originalityScore: finalOriginality,
        uniquenessReason,
        contribution,
        isUniqueDiscovery: finalOriginality >= 65,
      };
    });

    return scored.sort((a, b) => {
      const scoreA = (a.relevanceScore || 50) * 0.6 + (a.originalityScore || 50) * 0.4;
      const scoreB = (b.relevanceScore || 50) * 0.6 + (b.originalityScore || 50) * 0.4;
      return scoreB - scoreA;
    });
  }

  private deriveExplanation(item: SearchResult, originality: number): { uniquenessReason: string; contribution: string } {
    if (item.category === 'github') {
      return {
        uniquenessReason: `Direct source code repository (${item.authorOrOwner || 'maintainer'}) with ${item.starsOrScore || 0} GitHub stars and active code implementation.`,
        contribution: 'Provides verifiable codebase, architecture designs, and hands-on operational tools rather than secondary commentary.',
      };
    }

    if (item.category === 'community') {
      return {
        uniquenessReason: `Peer-reviewed engineering debate on ${item.domain} with ${item.starsOrScore || 0} community upvotes.`,
        contribution: 'Reveals production pitfalls, edge-case trade-offs, and critical developer experiences omitted from official marketing.',
      };
    }

    if (item.category === 'encyclopedia') {
      return {
        uniquenessReason: 'Structured, neutrally curated reference synthesis with peer verification.',
        contribution: 'Establishes clear taxonomy, historical timelines, and foundational definitions of the subject.',
      };
    }

    if (originality >= 70) {
      return {
        uniquenessReason: `Specialized domain (${item.domain}) providing focused technical insights without generic syndication.`,
        contribution: 'Delivers domain-specific expertise, direct benchmarks, or detailed documentation distinct from general search engines.',
      };
    }

    return {
      uniquenessReason: `Indexed reference from ${item.domain} matching the core subject criteria.`,
      contribution: 'Supplements the search with primary web perspective and broader context.',
    };
  }
}

export const uniqueDiscoveryService = new UniqueDiscoveryService();
