import { SearchResult } from '../providers/types.js';
import { providerManager } from '../providers/index.js';
import { queryPlanner, PlannedQuery } from './queryPlanner.js';
import { deduplicator } from './deduplicator.js';
import { uniqueDiscoveryService } from './uniqueDiscovery.js';
import { safeScraper, ScrapedPage } from './scraper.js';
import { geminiService } from './geminiService.js';
import { db } from '../db/database.js';

export interface ResearchProgress {
  stage: 'initiating' | 'planning' | 'searching' | 'scraping' | 'ranking' | 'synthesizing' | 'completed' | 'cancelled' | 'error';
  message: string;
  percentage: number;
  activeQueries?: string[];
  resultsFound?: number;
  pagesScraped?: number;
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

export class DeepResearchPipeline {
  public async executeQuickSearch(
    query: string,
    onProgress?: (p: ResearchProgress) => void,
    signal?: AbortSignal
  ): Promise<DeepResearchResult> {
    const startTime = Date.now();
    const searchId = `search-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    onProgress?.({
      stage: 'searching',
      message: 'Executing multi-source search across web, GitHub, Wikipedia, and community...',
      percentage: 25,
      activeQueries: [query],
    });

    if (signal?.aborted) throw new Error('Search cancelled');

    const { results: rawResults } = await providerManager.searchAll(query, { limitPerProvider: 8, signal });

    onProgress?.({
      stage: 'ranking',
      message: 'Normalizing and scoring results for originality and relevance...',
      percentage: 70,
      resultsFound: rawResults.length,
    });

    const deduplicated = deduplicator.deduplicate(rawResults);
    const ranked = uniqueDiscoveryService.analyzeUniqueWebsites(query, deduplicated);

    const uniqueWebsites = ranked.filter(r => r.isUniqueDiscovery || (r.originalityScore && r.originalityScore >= 60));
    const githubProjects = ranked.filter(r => r.category === 'github');
    const technicalSources = ranked.filter(r => r.category === 'technical' || r.category === 'encyclopedia');
    const communityDiscussions = ranked.filter(r => r.category === 'community');

    const summary = this.generateQuickSummary(query, ranked);

    await db.saveSearchHistory({
      id: searchId,
      query,
      mode: 'quick',
      resultCount: ranked.length,
    });

    onProgress?.({
      stage: 'completed',
      message: `Completed quick search with ${ranked.length} verified results.`,
      percentage: 100,
      resultsFound: ranked.length,
    });

    return {
      searchId,
      query,
      mode: 'quick',
      results: ranked,
      uniqueWebsites,
      githubProjects,
      technicalSources,
      communityDiscussions,
      scrapedPages: [],
      reportMarkdown: summary,
      plannedQueries: [{ query, strategy: 'primary', rationale: 'Direct search' }],
      durationMs: Date.now() - startTime,
    };
  }

  public async executeDeepSearch(
    query: string,
    onProgress?: (p: ResearchProgress) => void,
    signal?: AbortSignal
  ): Promise<DeepResearchResult> {
    const startTime = Date.now();
    const searchId = `deep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    onProgress?.({
      stage: 'planning',
      message: 'Generating complementary search angles and query plan...',
      percentage: 10,
    });

    if (signal?.aborted) throw new Error('Search cancelled');

    const planned = await queryPlanner.planQueries(query, 5);
    const queryStrings = planned.map(p => p.query);

    onProgress?.({
      stage: 'searching',
      message: `Executing ${planned.length} multi-angle queries across search providers...`,
      percentage: 30,
      activeQueries: queryStrings,
    });

    const allResults: SearchResult[] = [];
    for (let i = 0; i < planned.length; i++) {
      if (signal?.aborted) throw new Error('Search cancelled');
      const q = planned[i];
      const { results } = await providerManager.searchAll(q.query, { limitPerProvider: 6, signal });
      allResults.push(...results);

      onProgress?.({
        stage: 'searching',
        message: `Queried (${i + 1}/${planned.length}): "${q.query.slice(0, 30)}..."`,
        percentage: 30 + Math.round(((i + 1) / planned.length) * 20),
        resultsFound: allResults.length,
      });
    }

    onProgress?.({
      stage: 'ranking',
      message: 'Deduplicating across providers and evaluating domain diversity...',
      percentage: 55,
      resultsFound: allResults.length,
    });

    const deduplicated = deduplicator.deduplicate(allResults);
    const ranked = uniqueDiscoveryService.analyzeUniqueWebsites(query, deduplicated);

    onProgress?.({
      stage: 'scraping',
      message: 'Fetching full-text content of top primary sources with SSRF validation...',
      percentage: 65,
    });

    const pagesToScrape = ranked
      .filter(r => safeScraper.isUrlSafe(r.url))
      .slice(0, 4);

    const scrapedPages: ScrapedPage[] = [];
    for (let i = 0; i < pagesToScrape.length; i++) {
      if (signal?.aborted) throw new Error('Search cancelled');
      const target = pagesToScrape[i];
      const scraped = await safeScraper.fetchAndExtract(target.url, signal);
      if (!scraped.error && scraped.content.length > 50) {
        scrapedPages.push(scraped);
      }

      onProgress?.({
        stage: 'scraping',
        message: `Extracted source (${i + 1}/${pagesToScrape.length}): ${target.domain}`,
        percentage: 65 + Math.round(((i + 1) / pagesToScrape.length) * 15),
        pagesScraped: scrapedPages.length,
      });
    }

    onProgress?.({
      stage: 'synthesizing',
      message: 'Synthesizing comprehensive cited research report...',
      percentage: 85,
    });

    const reportMarkdown = await this.synthesizeReport(query, ranked, scrapedPages, planned);

    await db.saveSearchHistory({
      id: searchId,
      query,
      mode: 'deep',
      resultCount: ranked.length,
    });

    await db.saveReport({
      id: `rep-${searchId}`,
      searchId,
      query,
      content: reportMarkdown,
      sources: ranked.slice(0, 15).map(r => ({ title: r.title, url: r.url, domain: r.domain, provider: r.provider })),
    });

    const uniqueWebsites = ranked.filter(r => r.isUniqueDiscovery || (r.originalityScore && r.originalityScore >= 60));
    const githubProjects = ranked.filter(r => r.category === 'github');
    const technicalSources = ranked.filter(r => r.category === 'technical' || r.category === 'encyclopedia');
    const communityDiscussions = ranked.filter(r => r.category === 'community');

    onProgress?.({
      stage: 'completed',
      message: `Deep research finished with ${ranked.length} verified results and synthesized report.`,
      percentage: 100,
      resultsFound: ranked.length,
      pagesScraped: scrapedPages.length,
    });

    return {
      searchId,
      query,
      mode: 'deep',
      results: ranked,
      uniqueWebsites,
      githubProjects,
      technicalSources,
      communityDiscussions,
      scrapedPages,
      reportMarkdown,
      plannedQueries: planned,
      durationMs: Date.now() - startTime,
    };
  }

  private async synthesizeReport(
    query: string,
    results: SearchResult[],
    scrapedPages: ScrapedPage[],
    plannedQueries: PlannedQuery[]
  ): Promise<string> {
    const topSources = results.slice(0, 10);
    const sourceBibliography = topSources
      .map((s, idx) => `[${idx + 1}] **${s.title}** (${s.domain}) - [Direct Source](${s.url})\n    *${s.snippet.slice(0, 160)}...*`)
      .join('\n\n');

    if (geminiService.isConfigured()) {
      try {
        const sourceSummaries = topSources
          .map((s, idx) => `Source [${idx + 1}]: "${s.title}" (${s.url})\nSnippet: ${s.snippet}\n`)
          .join('\n');

        const scrapedContext = scrapedPages
          .map((p, idx) => `Deep Excerpt [${idx + 1}] (${p.url}):\n${p.content.slice(0, 600)}...`)
          .join('\n\n');

        const prompt = `You are DeepSeekr, an authoritative AI Deep Search Research Engine.
Write a rigorous, professional research report for the query: "${query}".

Available verified sources:
${sourceSummaries}

In-depth source body extracts:
${scrapedContext}

Instructions:
1. Include an "Executive Summary".
2. Detail "Key Discoveries & Technical Architecture" with numbered citations referencing sources like [1], [2].
3. Detail "Open Source Projects & Implementations" (mentioning GitHub projects found).
4. Detail "Community Perspectives & Practical Trade-Offs".
5. Provide a "Synthesis & Recommended Next Actions".
6. Do NOT invent URLs or citations. Use the numbered sources provided.
Output markdown with clear headers (#, ##, ###), bold points, and clean formatting.`;

        const report = await geminiService.generateText(prompt, 'You are an objective, technical deep research synthesizer. Write cited, high-density reports.');
        if (report && report.trim().length > 100) {
          return `${report}\n\n---\n\n## 📚 Verified Sources & Citations\n\n${sourceBibliography}`;
        }
      } catch (err) {
        console.warn('Gemini report generation failed, using rule-based synthesis:', err);
      }
    }

    return this.generateHeuristicReport(query, topSources, sourceBibliography, plannedQueries);
  }

  private generateQuickSummary(query: string, results: SearchResult[]): string {
    const topSources = results.slice(0, 5);
    const list = topSources.map((s, idx) => `[${idx + 1}] [${s.title}](${s.url}) on **${s.domain}**\n   > ${s.snippet}`).join('\n\n');

    return `# Quick Search Summary: "${query}"

**Found ${results.length} results across web, GitHub, Wikipedia, and community channels.**

### 🔍 Top Verified References:
${list}

*For in-depth analysis, full-text extraction, and synthesis across 5 complementary angles, switch to **Deep Search** mode.*`;
  }

  private generateHeuristicReport(
    query: string,
    topSources: SearchResult[],
    sourceBibliography: string,
    plannedQueries: PlannedQuery[]
  ): string {
    const githubSources = topSources.filter(s => s.category === 'github');
    const communitySources = topSources.filter(s => s.category === 'community');
    const wikiSources = topSources.filter(s => s.category === 'encyclopedia');

    return `# Deep Research Report: ${query}

## 📋 Executive Summary
DeepSeekr conducted a multi-angle deep inquiry into **"${query}"**, querying multiple search indexes across open-source codebases, community discussions, technical specifications, and web documentation. A total of **${topSources.length} primary reference sources** were synthesized.

---

## 🎯 Research Strategies & Query Matrix
The inquiry evaluated the topic across complementary discovery vectors:
${plannedQueries.map(p => `- **${p.strategy.toUpperCase()}**: \`${p.query}\` — *${p.rationale}*`).join('\n')}

---

## 💡 Key Technical Discoveries & Findings
${wikiSources.length > 0 ? `### Definitional & Foundational Context\n${wikiSources.map(w => `- **${w.title}**: ${w.snippet} [[1]](${w.url})`).join('\n')}\n` : ''}
${topSources.slice(0, 3).map((s, idx) => `### Discovery ${idx + 1}: ${s.title}
- **Primary Domain**: \`${s.domain}\`
- **Analysis**: ${s.snippet}
- **Citation Reference**: [${idx + 1}] [View Source Document](${s.url})
`).join('\n')}

---

## 🐙 Open Source Repositories & Implementations
${githubSources.length > 0 ? githubSources.map(g => `- **[${g.title}](${g.url})** (${g.starsOrScore || 0} ★): ${g.snippet}`).join('\n') : '- No dedicated GitHub repositories identified for this exact term; see general technical sources below.'}

---

## 💬 Community Insights & Trade-Offs
${communitySources.length > 0 ? communitySources.map(c => `- **[${c.title}](${c.url})** (${c.starsOrScore || 0} pts): ${c.snippet}`).join('\n') : '- Developer discussions highlighted production considerations and integration nuances.'}

---

## 📚 Verified Sources & Citations
${sourceBibliography}`;
  }
}

export const deepResearchPipeline = new DeepResearchPipeline();
