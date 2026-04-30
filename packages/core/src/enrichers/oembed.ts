// oEmbed fetcher for embed cards (YouTube, Vimeo, Twitter, Spotify, etc.)

import { UrlValidator } from '../url-validator.js';

interface OEmbedProvider {
  pattern: RegExp;
  endpoint: string;
  type: 'video' | 'rich' | 'photo' | 'link';
}

const OEMBED_ENDPOINTS: OEmbedProvider[] = [
  { pattern: /^https?:\/\/(www\.)?youtube\.com\/watch/i, endpoint: 'https://www.youtube.com/oembed', type: 'video' },
  { pattern: /^https?:\/\/youtu\.be\//i, endpoint: 'https://www.youtube.com/oembed', type: 'video' },
  { pattern: /^https?:\/\/(www\.)?vimeo\.com\//i, endpoint: 'https://vimeo.com/api/oembed.json', type: 'video' },
  { pattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\//i, endpoint: 'https://publish.twitter.com/oembed', type: 'rich' },
  { pattern: /^https?:\/\/open\.spotify\.com\//i, endpoint: 'https://open.spotify.com/oembed', type: 'rich' },
  { pattern: /^https?:\/\/(www\.)?soundcloud\.com\//i, endpoint: 'https://soundcloud.com/oembed', type: 'rich' },
  { pattern: /^https?:\/\/(www\.)?codepen\.io\//i, endpoint: 'https://codepen.io/api/oembed', type: 'rich' },
];

export interface OEmbedResult {
  url: string;
  html: string;
  embedType: string;
  metadata: Record<string, unknown>;
}

export function detectOEmbedProvider(url: string): OEmbedProvider | null {
  for (const provider of OEMBED_ENDPOINTS) {
    if (provider.pattern.test(url)) return provider;
  }
  return null;
}

export interface OEmbedFetcherOptions {
  validator?: UrlValidator;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export class OEmbedFetcher {
  private readonly validator: UrlValidator;
  private readonly fetch: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: OEmbedFetcherOptions = {}) {
    this.validator = options.validator || new UrlValidator();
    this.fetch = options.fetch || globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 10000;
  }

  async fetchOEmbed(url: string): Promise<OEmbedResult> {
    const provider = detectOEmbedProvider(url);
    if (!provider) {
      return { url, html: '', embedType: 'rich', metadata: {} };
    }

    try {
      await this.validator.validate(url);

      const oembedUrl = `${provider.endpoint}?url=${encodeURIComponent(url)}&format=json`;
      const res = await this.fetch(oembedUrl, {
        headers: { 'User-Agent': 'ghost-blocks/0.1' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!res.ok) {
        return { url, html: '', embedType: provider.type, metadata: {} };
      }

      const data = (await res.json()) as Record<string, any>;
      return {
        url,
        html: data.html || '',
        embedType: data.type || provider.type,
        metadata: {
          url,
          title: data.title || '',
          author_name: data.author_name || '',
          author_url: data.author_url || '',
          provider_name: data.provider_name || '',
          provider_url: data.provider_url || '',
          thumbnail_url: data.thumbnail_url || '',
          thumbnail_width: data.thumbnail_width || 0,
          thumbnail_height: data.thumbnail_height || 0,
        },
      };
    } catch {
      return { url, html: '', embedType: provider.type, metadata: {} };
    }
  }
}
