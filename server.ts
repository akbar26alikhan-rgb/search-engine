import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { createServer as createViteServer } from 'vite';

import { providerManager } from './server/providers/index.js';
import { geminiService } from './server/services/geminiService.js';
import { deepResearchPipeline } from './server/services/deepResearch.js';
import { db } from './server/db/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

const activeSearches = new Map<string, AbortController>();

app.use(cors());
app.use(express.json());

// Initialize SQLite database
db.init().catch(err => console.error('DB Init error:', err));

// OpenSearch XML description for Brave and Chromium
app.get('/opensearch.xml', (req: Request, res: Response) => {
  const host = req.get('host') || `localhost:${PORT}`;
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
  <ShortName>DeepSeekr</ShortName>
  <Description>AI Deep Research Search Engine</Description>
  <InputEncoding>UTF-8</InputEncoding>
  <Image width="16" height="16" type="image/x-icon">${baseUrl}/favicon.ico</Image>
  <Url type="text/html" template="${baseUrl}/search?q={searchTerms}"/>
  <Url type="application/x-suggestions+json" template="${baseUrl}/api/suggest?q={searchTerms}"/>
</OpenSearchDescription>`;

  res.header('Content-Type', 'application/opensearchdescription+xml');
  res.send(xml);
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    providers: providerManager.getAllStatuses(),
    geminiConfigured: geminiService.isConfigured(),
  });
});

// Search suggestions endpoint
app.get('/api/suggest', (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  if (!q) {
    return res.json([q, []]);
  }
  const suggestions = [
    q,
    `${q} architecture`,
    `${q} open source github`,
    `${q} benchmark comparison`,
    `${q} deep research report`,
  ];
  return res.json([q, suggestions]);
});

// Server-Sent Events (SSE) streaming search
app.get('/api/search/stream', async (req: Request, res: Response) => {
  const query = String(req.query.q || '').trim();
  const mode = (req.query.mode === 'deep' ? 'deep' : 'quick') as 'quick' | 'deep';
  const clientId = String(req.query.clientId || `client-${Date.now()}`);

  if (!query) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const controller = new AbortController();
  activeSearches.set(clientId, controller);

  req.on('close', () => {
    controller.abort();
    activeSearches.delete(clientId);
  });

  try {
    sendEvent('status', {
      stage: 'initiating',
      message: `Starting ${mode === 'deep' ? 'Deep Research' : 'Quick Search'} for: "${query}"`,
      percentage: 5,
    });

    const result = mode === 'deep'
      ? await deepResearchPipeline.executeDeepSearch(
          query,
          (progress) => sendEvent('progress', progress),
          controller.signal
        )
      : await deepResearchPipeline.executeQuickSearch(
          query,
          (progress) => sendEvent('progress', progress),
          controller.signal
        );

    sendEvent('complete', result);
  } catch (err: any) {
    if (err.name === 'AbortError' || err.message?.includes('cancelled')) {
      sendEvent('cancelled', { message: 'Search was cancelled by user' });
    } else {
      console.error('Search pipeline error:', err);
      sendEvent('error', { error: err.message || 'An unexpected error occurred during research' });
    }
  } finally {
    activeSearches.delete(clientId);
    res.end();
  }
});

// Cancel ongoing research
app.post('/api/search/cancel', (req: Request, res: Response) => {
  const { clientId } = req.body;
  if (clientId && activeSearches.has(clientId)) {
    const controller = activeSearches.get(clientId);
    controller?.abort();
    activeSearches.delete(clientId);
    return res.json({ success: true, message: 'Research process cancelled' });
  }
  res.json({ success: false, message: 'No active research found for client' });
});

// Synchronous JSON search fallback
app.post('/api/search', async (req: Request, res: Response) => {
  const { query, mode } = req.body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const searchMode = mode === 'deep' ? 'deep' : 'quick';
    const result = searchMode === 'deep'
      ? await deepResearchPipeline.executeDeepSearch(query.trim())
      : await deepResearchPipeline.executeQuickSearch(query.trim());

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Search execution failed' });
  }
});

// Search history endpoints
app.get('/api/history', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(String(req.query.limit || '40'), 10);
    const history = await db.getSearchHistory(limit);
    res.json({ history });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/history/:id', async (req: Request, res: Response) => {
  try {
    const success = await db.deleteHistoryItem(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/history/clear', async (req: Request, res: Response) => {
  try {
    await db.clearHistory();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Research report endpoint
app.get('/api/reports/:id', async (req: Request, res: Response) => {
  try {
    const report = await db.getReport(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dynamic provider configuration
app.post('/api/providers/config', (req: Request, res: Response) => {
  const { braveApiKey } = req.body;
  if (typeof braveApiKey === 'string') {
    providerManager.updateBraveKey(braveApiKey.trim());
  }
  res.json({
    success: true,
    providers: providerManager.getAllStatuses(),
  });
});

// Serve frontend in dev via Vite middlewares, or static dist in prod
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DeepSeekr] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start DeepSeekr server:', err);
});
