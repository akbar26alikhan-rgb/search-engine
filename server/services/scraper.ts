import * as cheerio from 'cheerio';

export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  error?: string;
  bytesReceived: number;
}

export class SafeScraper {
  private static MAX_BYTES = 1024 * 1024;
  private static TIMEOUT_MS = 6000;

  public isUrlSafe(targetUrl: string): boolean {
    try {
      const parsed = new URL(targetUrl);

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }

      const host = parsed.hostname.toLowerCase();

      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '::1' ||
        host === '0.0.0.0' ||
        host.endsWith('.local') ||
        host.endsWith('.localhost') ||
        host.endsWith('.internal')
      ) {
        return false;
      }

      const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
      const match = host.match(ipv4Regex);
      if (match) {
        const [_, oct1, oct2] = match.map(Number);
        if (oct1 === 10) return false;
        if (oct1 === 172 && oct2 >= 16 && oct2 <= 31) return false;
        if (oct1 === 192 && oct2 === 168) return false;
        if (oct1 === 169 && oct2 === 254) return false;
        if (oct1 === 127) return false;
        if (oct1 === 0) return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  public async fetchAndExtract(targetUrl: string, signal?: AbortSignal): Promise<ScrapedPage> {
    if (!this.isUrlSafe(targetUrl)) {
      return {
        url: targetUrl,
        title: '',
        content: '',
        error: 'URL blocked by SSRF security policy',
        bytesReceived: 0,
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SafeScraper.TIMEOUT_MS);

    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DeepSeekr-Bot/1.0; +https://deepseekr.local/bot)',
          'Accept': 'text/html,application/xhtml+xml,text/plain;q=0.9',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return {
          url: targetUrl,
          title: '',
          content: '',
          error: `HTTP error ${response.status}`,
          bytesReceived: 0,
        };
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/xhtml+xml')) {
        return {
          url: targetUrl,
          title: '',
          content: '',
          error: `Skipped non-HTML media (${contentType.split(';')[0]})`,
          bytesReceived: 0,
        };
      }

      const text = await response.text();
      const bytesReceived = Buffer.byteLength(text, 'utf8');

      if (bytesReceived > SafeScraper.MAX_BYTES) {
        return {
          url: targetUrl,
          title: '',
          content: '',
          error: 'Content exceeded maximum permitted size (1MB)',
          bytesReceived,
        };
      }

      const $ = cheerio.load(text);
      $('script, style, noscript, iframe, svg, nav, footer, header, form, button').remove();

      const title = $('title').first().text().trim() || $('h1').first().text().trim() || 'Untitled Page';

      let rawContent = $('article, main, .content, #content, .post-content').text();
      if (!rawContent || rawContent.trim().length < 100) {
        rawContent = $('body').text();
      }

      const cleanContent = rawContent
        .replace(/\s+/g, ' ')
        .replace(/[\r\n\t]+/g, ' ')
        .trim()
        .slice(0, 4000);

      return {
        url: targetUrl,
        title,
        content: cleanContent,
        bytesReceived,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        return {
          url: targetUrl,
          title: '',
          content: '',
          error: 'Request timed out or cancelled',
          bytesReceived: 0,
        };
      }
      return {
        url: targetUrl,
        title: '',
        content: '',
        error: err.message || 'Fetch failed',
        bytesReceived: 0,
      };
    }
  }
}

export const safeScraper = new SafeScraper();
