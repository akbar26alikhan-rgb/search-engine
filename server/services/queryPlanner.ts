import { geminiService } from './geminiService.js';

export interface PlannedQuery {
  query: string;
  strategy: 'primary' | 'exact' | 'technical' | 'github' | 'community' | 'academic' | 'specialized';
  rationale: string;
}

export class QueryPlanner {
  public async planQueries(originalQuery: string, maxQueries = 5): Promise<PlannedQuery[]> {
    const trimmed = originalQuery.trim();
    if (!trimmed) return [];

    let queries: PlannedQuery[] = [];

    if (geminiService.isConfigured()) {
      try {
        const prompt = `You are DeepSeekr's query planning engine.
Given the user search query: "${trimmed}", create up to ${maxQueries} diverse, non-redundant search queries covering distinct angles.
Angles:
- primary: exact core topic
- technical: architectural specs, internal mechanics, RFCs, official docs
- github: open-source projects, tools, CLI, libraries
- community: user experiences, post-mortems, debates, HN, benchmark comparisons
- specialized: lesser-known tools, niche blogs, academic papers

Output STRICT JSON array ONLY:
[
  { "query": "...", "strategy": "primary" | "technical" | "github" | "community" | "specialized", "rationale": "..." }
]`;

        const aiResponse = await geminiService.generateText(prompt, 'You are an expert search engine query planner. Output only valid JSON.');
        if (aiResponse) {
          const cleaned = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed) && parsed.length > 0) {
            queries = parsed.map((item: any) => ({
              query: String(item.query || '').trim(),
              strategy: item.strategy || 'specialized',
              rationale: String(item.rationale || 'AI-generated search angle'),
            })).filter(q => q.query.length > 0);
          }
        }
      } catch (err) {
        console.warn('AI query planning failed, using heuristic planner:', err);
      }
    }

    if (queries.length === 0) {
      queries = this.heuristicPlan(trimmed, maxQueries);
    }

    return this.deduplicatePlannedQueries(queries, maxQueries);
  }

  private heuristicPlan(rawQuery: string, maxQueries: number): PlannedQuery[] {
    const list: PlannedQuery[] = [
      {
        query: rawQuery,
        strategy: 'primary',
        rationale: 'Direct subject search',
      },
    ];

    const words = rawQuery.toLowerCase().split(/\s+/);

    if (words.length > 1 && list.length < maxQueries) {
      list.push({
        query: `"${rawQuery}"`,
        strategy: 'exact',
        rationale: 'Exact phrase match for high-precision results',
      });
    }

    if (list.length < maxQueries) {
      list.push({
        query: `${rawQuery} architecture documentation specification`,
        strategy: 'technical',
        rationale: 'Official manuals, specifications, and architecture deep dives',
      });
    }

    if (list.length < maxQueries) {
      list.push({
        query: `${rawQuery} github repo open source`,
        strategy: 'github',
        rationale: 'Code repositories, reference implementations, and toolkits',
      });
    }

    if (list.length < maxQueries) {
      list.push({
        query: `${rawQuery} benchmark comparison site:news.ycombinator.com OR site:reddit.com`,
        strategy: 'community',
        rationale: 'Real-world developer discussions, benchmarks, and community critiques',
      });
    }

    if (list.length < maxQueries) {
      list.push({
        query: `${rawQuery} whitepaper research analysis`,
        strategy: 'academic',
        rationale: 'Deep scientific papers, benchmarks, and technical analyses',
      });
    }

    return list.slice(0, maxQueries);
  }

  private deduplicatePlannedQueries(queries: PlannedQuery[], limit: number): PlannedQuery[] {
    const seen = new Set<string>();
    const result: PlannedQuery[] = [];

    for (const item of queries) {
      const normalized = item.query.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push(item);
      }
      if (result.length >= limit) break;
    }

    return result;
  }
}

export const queryPlanner = new QueryPlanner();
