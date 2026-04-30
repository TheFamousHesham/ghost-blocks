// Thin HTTP client for the Ghost Admin API.

import FormData from 'form-data';
import fs from 'node:fs';
import { GhostAuth } from './auth.js';
import { GhostApiError } from './types.js';

export interface GhostClientOptions {
  url: string;
  adminKey: string;
  apiVersion?: string;
  fetch?: typeof fetch;
}

interface RequestOptions {
  body?: unknown;
  params?: Record<string, string | number | undefined | null>;
  isMultipart?: boolean;
}

export class GhostClient {
  readonly baseUrl: string;
  private readonly auth: GhostAuth;
  private readonly fetchFn: typeof fetch;

  constructor(options: GhostClientOptions) {
    this.baseUrl = `${options.url.replace(/\/+$/, '')}/ghost/api/admin`;
    this.auth = new GhostAuth(options.adminKey, options.apiVersion);
    this.fetchFn = options.fetch || globalThis.fetch;
  }

  async request<T = unknown>(method: string, endpoint: string, opts: RequestOptions = {}): Promise<T | null> {
    const url = new URL(`${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`);
    if (opts.params) {
      for (const [k, v] of Object.entries(opts.params)) {
        if (v != null) url.searchParams.set(k, String(v));
      }
    }

    const headers: Record<string, string> = this.auth.getHeaders();
    const fetchOpts: RequestInit & { body?: any } = { method, headers };

    if (opts.isMultipart && opts.body instanceof FormData) {
      delete headers['Content-Type'];
      Object.assign(headers, opts.body.getHeaders());
      fetchOpts.body = opts.body;
    } else if (opts.body !== undefined) {
      fetchOpts.body = JSON.stringify(opts.body);
    }

    fetchOpts.headers = headers;

    const res = await this.fetchFn(url.toString(), fetchOpts as RequestInit);
    if (res.status === 204) return null;

    const data = (await res.json()) as { errors?: Array<{ message?: string; type?: string }> };
    if (!res.ok) {
      const ghostErr = data.errors?.[0];
      const msg = ghostErr
        ? `Ghost API error: ${ghostErr.message || ghostErr.type} (${res.status})`
        : `Ghost API error: ${res.status}`;
      throw new GhostApiError(msg, res.status, data.errors);
    }
    return data as T;
  }

  // ==== Posts ====

  async createPost(postData: Record<string, unknown>, queryParams: Record<string, string> = {}) {
    return this.request<{ posts: any[] }>('POST', 'posts/', {
      body: { posts: [postData] },
      params: queryParams,
    });
  }

  async getPost(id: string, queryParams: Record<string, string> = {}) {
    return this.request<{ posts: any[] }>('GET', `posts/${id}/`, {
      params: { formats: 'html,lexical', include: 'tags,authors', ...queryParams },
    });
  }

  async getPostBySlug(slug: string, queryParams: Record<string, string> = {}) {
    return this.request<{ posts: any[] }>('GET', `posts/slug/${slug}/`, {
      params: { formats: 'html,lexical', include: 'tags,authors', ...queryParams },
    });
  }

  async browsePosts(queryParams: Record<string, string | number> = {}) {
    return this.request<{ posts: any[]; meta: any }>('GET', 'posts/', {
      params: { formats: 'html,lexical', include: 'tags,authors', ...queryParams },
    });
  }

  async updatePost(id: string, postData: Record<string, unknown>, queryParams: Record<string, string> = {}) {
    return this.request<{ posts: any[] }>('PUT', `posts/${id}/`, {
      body: { posts: [postData] },
      params: queryParams,
    });
  }

  async deletePost(id: string): Promise<void> {
    await this.request('DELETE', `posts/${id}/`);
  }

  // ==== Images ====

  async uploadImageFromPath(filePath: string, ref?: string) {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    if (ref) form.append('ref', ref);
    return this.request<{ images: Array<{ url: string }> }>('POST', 'images/upload/', {
      body: form,
      isMultipart: true,
    });
  }

  async uploadImageBuffer(buffer: Buffer, filename: string, contentType: string) {
    const form = new FormData();
    form.append('file', buffer, { filename, contentType });
    return this.request<{ images: Array<{ url: string }> }>('POST', 'images/upload/', {
      body: form,
      isMultipart: true,
    });
  }

  // ==== Tags ====

  async browseTags(queryParams: Record<string, string | number> = {}) {
    return this.request<{ tags: any[] }>('GET', 'tags/', {
      params: { limit: 'all', include: 'count.posts', ...queryParams },
    });
  }

  // ==== Newsletters ====

  async browseNewsletters(queryParams: Record<string, string> = {}) {
    return this.request<{ newsletters: any[] }>('GET', 'newsletters/', { params: queryParams });
  }

  // ==== Site ====

  async getSite() {
    return this.request<{ site: any }>('GET', 'site/');
  }
}
