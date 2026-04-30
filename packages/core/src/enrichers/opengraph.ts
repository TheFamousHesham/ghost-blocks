// OpenGraph metadata fetcher for bookmark cards

import { UrlValidator } from '../url-validator.js';

export interface OpenGraphResult {
  url: string;
  title: string;
  description: string;
  icon: string;
  thumbnail: string;
  author: string;
  publisher: string;
}

export interface OpenGraphFetcherOptions {
  validator?: UrlValidator;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export class OpenGraphFetcher {
  private readonly validator: UrlValidator;
  private readonly fetch: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: OpenGraphFetcherOptions = {}) {
    this.validator = options.validator || new UrlValidator();
    this.fetch = options.fetch || globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 10000;
  }

  async fetchOpenGraph(url: string): Promise<OpenGraphResult> {
    const defaults: OpenGraphResult = {
      url,
      title: url,
      description: '',
      icon: '',
      thumbnail: '',
      author: '',
      publisher: '',
    };

    try {
      await this.validator.validate(url);

      const res = await this.fetch(url, {
        headers: {
          'User-Agent': 'ghost-blocks/0.1 (bookmark card)',
          Accept: 'text/html',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!res.ok) return defaults;

      const html = await res.text();
      return parseMetaTags(html, url);
    } catch {
      return defaults;
    }
  }
}

function parseMetaTags(html: string, url: string): OpenGraphResult {
  const get = (property: string): string => {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${property}["']`, 'i'),
      new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
      new RegExp(`<meta[^>]+name=["']twitter:${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:${property}["']`, 'i'),
    ];
    for (const pat of patterns) {
      const m = html.match(pat);
      if (m) return m[1]!;
    }
    return '';
  };

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const iconMatch =
    html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i) ||
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i);

  return {
    url,
    title: get('title') || (titleMatch ? titleMatch[1]!.trim() : url),
    description: get('description') || '',
    icon: iconMatch ? iconMatch[1]! : '',
    thumbnail: get('image') || '',
    author: get('author') || get('article:author') || '',
    publisher: get('site_name') || '',
  };
}
