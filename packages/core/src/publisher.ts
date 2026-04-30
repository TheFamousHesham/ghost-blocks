// High-level GhostPublisher class — the primary public API.

import { GhostClient } from './client.js';
import { LexicalBuilder } from './lexical/builder.js';
import type {
  BrowsePostsParams,
  CreatePostInput,
  GhostPublisherOptions,
  Newsletter,
  PostSummary,
  Tag,
  UpdatePostInput,
} from './types.js';

export class GhostPublisher {
  readonly client: GhostClient;
  readonly builder: LexicalBuilder;

  constructor(options: GhostPublisherOptions) {
    this.client = new GhostClient({
      url: options.url,
      adminKey: options.adminKey,
      apiVersion: options.apiVersion,
      fetch: options.fetch,
    });
    this.builder = new LexicalBuilder();
  }

  /**
   * Create a new post. If `content` blocks are provided, they're built into a
   * Lexical document automatically. Use `html` for raw HTML, or `lexical` for
   * a pre-built Lexical JSON string.
   */
  async createPost(input: CreatePostInput): Promise<PostSummary> {
    const { postData, queryParams } = await this.preparePostData(input);
    const result = await this.client.createPost(postData, queryParams);
    return toPostSummary(result!.posts[0]);
  }

  /**
   * Update a post. Automatically GETs the current `updated_at` for collision
   * detection so callers don't need to handle it.
   *
   * Note: tag/author arrays are *replaced*, not merged (Ghost API behavior).
   */
  async updatePost(id: string, input: UpdatePostInput): Promise<PostSummary> {
    const existing = await this.client.getPost(id);
    const current = existing!.posts[0];

    const { postData, queryParams } = await this.preparePostData(input as CreatePostInput);
    postData.updated_at = current.updated_at;

    const result = await this.client.updatePost(id, postData, queryParams);
    return toPostSummary(result!.posts[0]);
  }

  async getPost(id: string): Promise<any> {
    const result = await this.client.getPost(id);
    return result!.posts[0];
  }

  async getPostBySlug(slug: string): Promise<any> {
    const result = await this.client.getPostBySlug(slug);
    return result!.posts[0];
  }

  async browsePosts(params: BrowsePostsParams = {}): Promise<{ posts: any[]; meta: any }> {
    const queryParams: Record<string, string | number> = {};
    const filters: string[] = [];
    if (params.status) filters.push(`status:${params.status}`);
    if (params.tag) filters.push(`tag:${params.tag}`);
    if (params.search) filters.push(`title:~'${escapeNqlValue(params.search)}'`);
    if (filters.length > 0) queryParams.filter = filters.join('+');
    if (params.filter) queryParams.filter = params.filter; // raw override
    if (params.limit != null) queryParams.limit = params.limit;
    if (params.page != null) queryParams.page = params.page;
    if (params.order) queryParams.order = params.order;

    const result = await this.client.browsePosts(queryParams);
    return { posts: result!.posts, meta: result!.meta };
  }

  async deletePost(id: string): Promise<void> {
    await this.client.deletePost(id);
  }

  async listTags(): Promise<Tag[]> {
    const result = await this.client.browseTags();
    return (result!.tags || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      visibility: t.visibility,
      post_count: t.count?.posts,
    }));
  }

  async listNewsletters(): Promise<Newsletter[]> {
    const result = await this.client.browseNewsletters();
    return (result!.newsletters || []).map((n: any) => ({
      id: n.id,
      name: n.name,
      slug: n.slug,
      status: n.status,
      sender_name: n.sender_name,
      sender_email: n.sender_email,
      subscribe_on_signup: n.subscribe_on_signup,
    }));
  }

  /**
   * Upload an image to Ghost from a local file path. Returns the Ghost-hosted URL.
   */
  async uploadImageFromPath(filePath: string, ref?: string): Promise<string> {
    const result = await this.client.uploadImageFromPath(filePath, ref);
    return result!.images[0]!.url;
  }

  /**
   * Upload an image to Ghost from a Buffer. Returns the Ghost-hosted URL.
   */
  async uploadImageBuffer(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    const result = await this.client.uploadImageBuffer(buffer, filename, contentType);
    return result!.images[0]!.url;
  }

  /**
   * Build a Lexical JSON document from content blocks without creating a post.
   * Useful for previewing or for advanced workflows.
   */
  async buildLexical(content: CreatePostInput['content']): Promise<string> {
    return this.builder.build(content);
  }

  // ==========================================================================

  private async preparePostData(
    input: CreatePostInput,
  ): Promise<{ postData: Record<string, any>; queryParams: Record<string, string> }> {
    const postData: Record<string, any> = {};

    if (input.title !== undefined) postData.title = input.title;

    // Content: prefer `lexical` > `content` blocks > `html`
    if (input.lexical) {
      postData.lexical = input.lexical;
    } else if (input.content && input.content.length > 0) {
      postData.lexical = await this.builder.build(input.content);
    } else if (input.html) {
      postData.html = input.html;
    }

    // Simple fields
    const passthroughFields = [
      'slug', 'status', 'featured', 'visibility', 'published_at',
      'feature_image', 'feature_image_alt', 'feature_image_caption',
      'canonical_url', 'custom_template', 'email_only',
    ] as const;
    for (const field of passthroughFields) {
      const value = (input as any)[field];
      if (value !== undefined) postData[field] = value;
    }

    if (input.excerpt !== undefined) postData.custom_excerpt = input.excerpt;

    if (input.tags) {
      postData.tags = input.tags.map((t) => (typeof t === 'string' ? { name: t } : t));
    }
    if (input.authors) {
      postData.authors = input.authors.map((a) => (typeof a === 'string' ? { email: a } : a));
    }

    if (input.seo) {
      const seoMap: Record<string, string> = {
        meta_title: 'meta_title',
        meta_description: 'meta_description',
        og_title: 'og_title',
        og_description: 'og_description',
        og_image: 'og_image',
        twitter_title: 'twitter_title',
        twitter_description: 'twitter_description',
        twitter_image: 'twitter_image',
      };
      for (const [src, dst] of Object.entries(seoMap)) {
        const value = (input.seo as any)[src];
        if (value !== undefined) postData[dst] = value;
      }
    }

    const queryParams: Record<string, string> = {};
    if (input.html && !input.content && !input.lexical) queryParams.source = 'html';
    if (input.newsletter?.send && input.newsletter.slug) {
      queryParams.newsletter = input.newsletter.slug;
      if (input.newsletter.segment) queryParams.email_segment = input.newsletter.segment;
    }

    return { postData, queryParams };
  }
}

function toPostSummary(post: any): PostSummary {
  return {
    id: post.id,
    uuid: post.uuid,
    url: post.url,
    status: post.status,
    title: post.title,
    slug: post.slug,
    created_at: post.created_at,
    updated_at: post.updated_at,
    published_at: post.published_at,
  };
}

function escapeNqlValue(value: string): string {
  // Ghost NQL uses single-quoted strings; escape embedded quotes.
  return value.replace(/'/g, "\\'");
}
