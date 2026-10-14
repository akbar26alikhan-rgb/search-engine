import assert from 'node:assert';
import { BraveSearchProvider } from '../server/providers/brave.js';
import { GitHubSearchProvider } from '../server/providers/github.js';
import { WikipediaSearchProvider } from '../server/providers/wikipedia.js';
import { deduplicator } from '../server/services/deduplicator.js';
import { uniqueDiscoveryService } from '../server/services/uniqueDiscovery.js';
import { safeScraper } from '../server/services/scraper.js';
import { queryPlanner } from '../server/services/queryPlanner.js';
import { db } from '../server/db/database.js';
import { SearchResult } from '../server/providers/types.js';

let totalTests = 0;
let passedTests = 0;

async function test(name: string, fn: () => Promise<void> | void) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ✗ ${name}:`, err.message);
  }
}

async function runAllTests() {
  console.log('\n--- DeepSeekr Test Suite Starting ---\n');

  console.log('1. Provider Adapters & Missing API Keys');
  await test('Brave Search handles missing API key cleanly', () => {
    const unconfiguredBrave = new BraveSearchProvider('');
    assert.strictEqual(unconfiguredBrave.isConfigured(), false);
    const status = unconfiguredBrave.getStatus();
    assert.strictEqual(status.available, false);
    assert.strictEqual(status.keyRequired, true);
  });

  await test('Brave Search activates when API key provided', () => {
    const configuredBrave = new BraveSearchProvider('test_key_123');
    assert.strictEqual(configuredBrave.isConfigured(), true);
    assert.strictEqual(configuredBrave.getStatus().available, true);
  });

  await test('Wikipedia provider is active and provides doc URL', () => {
    const wiki = new WikipediaSearchProvider();
    assert.strictEqual(wiki.isConfigured(), true);
    assert.strictEqual(wiki.getStatus().available, true);
  });

  await test('GitHub provider reports correct status without token', () => {
    const gh = new GitHubSearchProvider('');
    assert.strictEqual(gh.isConfigured(), true);
    assert.strictEqual(gh.getStatus().keyRequired, false);
  });

  console.log('\n2. Result Normalization & Deduplication');
  await test('Deduplicator strips tracking parameters and trailing slashes', () => {
    const dirtyUrl = 'https://Example.com/docs/api/?utm_source=twitter&utm_medium=social&fbclid=XYZ123#overview';
    const cleanUrl = deduplicator.normalizeUrl(dirtyUrl);
    assert.strictEqual(cleanUrl, 'https://example.com/docs/api');
  });

  await test('Deduplicator normalizes default HTTP/HTTPS ports', () => {
    const httpPort = deduplicator.normalizeUrl('http://mysite.org:80/path/');
    const httpsPort = deduplicator.normalizeUrl('https://mysite.org:443/path/');
    assert.strictEqual(httpPort, 'http://mysite.org/path');
    assert.strictEqual(httpsPort, 'https://mysite.org/path');
  });

  await test('Deduplicator eliminates identical URLs and near-duplicate snippets', () => {
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: 'Complete Guide to React Server Components',
        url: 'https://blog.example.com/rsc?utm_source=feed',
        displayUrl: 'blog.example.com/rsc',
        domain: 'blog.example.com',
        snippet: 'A comprehensive walkthrough of React Server Components and their execution lifecycle.',
        provider: 'duckduckgo',
        category: 'web',
      },
      {
        id: '2',
        title: 'Complete Guide to React Server Components',
        url: 'https://blog.example.com/rsc?ref=newsletter',
        displayUrl: 'blog.example.com/rsc',
        domain: 'blog.example.com',
        snippet: 'A comprehensive walkthrough of React Server Components and their execution lifecycle.',
        provider: 'brave',
        category: 'web',
      },
    ];

    const deduplicated = deduplicator.deduplicate(mockResults);
    assert.strictEqual(deduplicated.length, 1);
  });

  await test('Deduplicator preserves distinct pages from the same domain', () => {
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: 'React Documentation Overview',
        url: 'https://react.dev/learn',
        displayUrl: 'react.dev/learn',
        domain: 'react.dev',
        snippet: 'Learn React fundamentals from the official guide.',
        provider: 'duckduckgo',
        category: 'technical',
      },
      {
        id: '2',
        title: 'React Hooks API Reference',
        url: 'https://react.dev/reference/react/useState',
        displayUrl: 'react.dev/reference/react/useState',
        domain: 'react.dev',
        snippet: 'Detailed reference and interactive examples for useState.',
        provider: 'duckduckgo',
        category: 'technical',
      },
    ];

    const deduplicated = deduplicator.deduplicate(mockResults);
    assert.strictEqual(deduplicated.length, 2);
    const grouped = deduplicator.groupByDomain(deduplicated);
    assert.strictEqual(grouped['react.dev'].length, 2);
  });

  console.log('\n3. Unique Website Discovery & Heuristic Ranking');
  await test('Unique discovery assigns higher originality to independent blogs & technical sites over aggregators', () => {
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: 'Video tutorial discussion',
        url: 'https://youtube.com/watch?v=123',
        displayUrl: 'youtube.com/watch?v=123',
        domain: 'youtube.com',
        snippet: 'A video stream replay about compilers.',
        provider: 'duckduckgo',
        category: 'web',
      },
      {
        id: '2',
        title: 'Internal Bytecode Architecture Analysis',
        url: 'https://bernstein-lab.mit.edu/compiler-paper',
        displayUrl: 'bernstein-lab.mit.edu/compiler-paper',
        domain: 'bernstein-lab.mit.edu',
        snippet: 'Peer-reviewed research and benchmarks on novel intermediate bytecode generation architectures.',
        provider: 'duckduckgo',
        category: 'technical',
      },
    ];

    const analyzed = uniqueDiscoveryService.analyzeUniqueWebsites('compiler architecture', mockResults);
    const mitResult = analyzed.find(r => r.domain === 'bernstein-lab.mit.edu')!;
    const ytResult = analyzed.find(r => r.domain === 'youtube.com')!;

    assert.ok(mitResult.originalityScore! > ytResult.originalityScore!);
    assert.ok(mitResult.uniquenessReason!.length > 0);
    assert.ok(mitResult.contribution!.length > 0);
  });

  console.log('\n4. SSRF & Malicious Web Content Protection');
  await test('SafeScraper blocks localhost and local IPs', () => {
    assert.strictEqual(safeScraper.isUrlSafe('http://localhost:3000/secret'), false);
    assert.strictEqual(safeScraper.isUrlSafe('http://127.0.0.1:8080/admin'), false);
    assert.strictEqual(safeScraper.isUrlSafe('http://0.0.0.0:80/'), false);
  });

  await test('SafeScraper blocks AWS/GCP cloud metadata IP (169.254.169.254)', () => {
    assert.strictEqual(safeScraper.isUrlSafe('http://169.254.169.254/latest/meta-data/'), false);
  });

  await test('SafeScraper blocks RFC1918 private corporate subnets', () => {
    assert.strictEqual(safeScraper.isUrlSafe('http://10.0.0.1/internal-db'), false);
    assert.strictEqual(safeScraper.isUrlSafe('http://192.168.1.1/router'), false);
    assert.strictEqual(safeScraper.isUrlSafe('http://172.16.5.10/admin'), false);
  });

  await test('SafeScraper allows legitimate public internet domains', () => {
    assert.strictEqual(safeScraper.isUrlSafe('https://en.wikipedia.org/wiki/Rust'), true);
    assert.strictEqual(safeScraper.isUrlSafe('https://github.com/torvalds/linux'), true);
  });

  console.log('\n5. Query Planning & Expansion');
  await test('Query planner produces non-empty complementary angles', async () => {
    const plans = await queryPlanner.planQueries('distributed consensus', 4);
    assert.ok(plans.length >= 2);
    const strategies = plans.map(p => p.strategy);
    assert.ok(strategies.includes('primary'));
  });

  await test('Query planner handles empty string gracefully', async () => {
    const plans = await queryPlanner.planQueries('', 4);
    assert.strictEqual(plans.length, 0);
  });

  console.log('\n6. SQLite Database & Persistence');
  await test('Database saves and retrieves search history', async () => {
    await db.init();
    const testId = `test-${Date.now()}`;
    await db.saveSearchHistory({
      id: testId,
      query: 'Test search query',
      mode: 'quick',
      resultCount: 5,
    });

    const history = await db.getSearchHistory(10);
    const found = history.find(h => h.id === testId);
    assert.ok(found);
    assert.strictEqual(found.query, 'Test search query');

    await db.deleteHistoryItem(testId);
    const historyAfter = await db.getSearchHistory(10);
    assert.strictEqual(historyAfter.some(h => h.id === testId), false);
  });

  await test('Database saves and retrieves research reports', async () => {
    const repId = `rep-test-${Date.now()}`;
    await db.saveReport({
      id: repId,
      searchId: 'search-123',
      query: 'Test Report Query',
      content: '# Report Title\n\nContent details here.',
      sources: [{ title: 'Source 1', url: 'https://example.com' }],
    });

    const rep = await db.getReport(repId);
    assert.ok(rep);
    assert.strictEqual(rep.query, 'Test Report Query');
    assert.ok(rep.content.includes('# Report Title'));
  });

  console.log(`\n--- Test Suite Completed: ${passedTests}/${totalTests} Passed ---\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
