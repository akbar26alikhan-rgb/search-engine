import initSqlJs, { Database as SqlDatabase } from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';

export interface HistoryItem {
  id: string;
  query: string;
  mode: 'quick' | 'deep';
  created_at: string;
  result_count: number;
}

export interface StoredReport {
  id: string;
  search_id: string;
  query: string;
  content: string;
  sources_json: string;
  created_at: string;
}

class AppDatabase {
  private db: SqlDatabase | null = null;
  private dbPath: string;
  private initialized = false;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = path.join(dataDir, 'deepseekr.db');
  }

  public async init(): Promise<void> {
    if (this.initialized && this.db) return;

    try {
      const SQL = await initSqlJs();
      if (fs.existsSync(this.dbPath)) {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(fileBuffer);
      } else {
        this.db = new SQL.Database();
      }

      this.createTables();
      this.initialized = true;
      this.persist();
    } catch (err) {
      console.error('Failed to initialize SQLite with sql.js, falling back to memory DB:', err);
      const SQL = await initSqlJs();
      this.db = new SQL.Database();
      this.createTables();
      this.initialized = true;
    }
  }

  private createTables(): void {
    if (!this.db) return;
    this.db.run(`
      CREATE TABLE IF NOT EXISTS search_history (
        id TEXT PRIMARY KEY,
        query TEXT NOT NULL,
        mode TEXT NOT NULL,
        result_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS research_reports (
        id TEXT PRIMARY KEY,
        search_id TEXT NOT NULL,
        query TEXT NOT NULL,
        content TEXT NOT NULL,
        sources_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS page_cache (
        url_hash TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT,
        text_content TEXT,
        created_at TEXT NOT NULL
      );
    `);
  }

  private persist(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      console.error('Failed to persist SQLite to disk:', err);
    }
  }

  public async saveSearchHistory(item: { id: string; query: string; mode: 'quick' | 'deep'; resultCount: number }): Promise<void> {
    await this.init();
    if (!this.db) return;

    const createdAt = new Date().toISOString();
    this.db.run(
      `INSERT OR REPLACE INTO search_history (id, query, mode, result_count, created_at) VALUES (?, ?, ?, ?, ?)`,
      [item.id, item.query, item.mode, item.resultCount, createdAt]
    );
    this.persist();
  }

  public async getSearchHistory(limit = 50): Promise<HistoryItem[]> {
    await this.init();
    if (!this.db) return [];

    const stmt = this.db.prepare(`SELECT id, query, mode, result_count, created_at FROM search_history ORDER BY created_at DESC LIMIT ?`);
    stmt.bind([limit]);
    const results: HistoryItem[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as unknown as { id: string; query: string; mode: 'quick' | 'deep'; result_count: number; created_at: string };
      results.push({
        id: row.id,
        query: row.query,
        mode: row.mode,
        result_count: row.result_count,
        created_at: row.created_at,
      });
    }
    stmt.free();
    return results;
  }

  public async deleteHistoryItem(id: string): Promise<boolean> {
    await this.init();
    if (!this.db) return false;
    this.db.run(`DELETE FROM search_history WHERE id = ?`, [id]);
    this.persist();
    return true;
  }

  public async clearHistory(): Promise<void> {
    await this.init();
    if (!this.db) return;
    this.db.run(`DELETE FROM search_history`);
    this.persist();
  }

  public async saveReport(report: { id: string; searchId: string; query: string; content: string; sources: unknown[] }): Promise<void> {
    await this.init();
    if (!this.db) return;

    const createdAt = new Date().toISOString();
    this.db.run(
      `INSERT OR REPLACE INTO research_reports (id, search_id, query, content, sources_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [report.id, report.searchId, report.query, report.content, JSON.stringify(report.sources), createdAt]
    );
    this.persist();
  }

  public async getReport(id: string): Promise<StoredReport | null> {
    await this.init();
    if (!this.db) return null;

    const stmt = this.db.prepare(`SELECT id, search_id, query, content, sources_json, created_at FROM research_reports WHERE id = ? OR search_id = ? LIMIT 1`);
    stmt.bind([id, id]);
    if (stmt.step()) {
      const row = stmt.getAsObject() as unknown as StoredReport;
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }
}

export const db = new AppDatabase();
