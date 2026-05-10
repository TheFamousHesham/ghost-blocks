import {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  Icon,
} from 'n8n-workflow';

import { GhostPublisher, ContentBlock, CreatePostInput, UpdatePostInput, GhostApiError } from 'ghost-blocks';

interface Credentials {
  url: string;
  adminKey: string;
  apiVersion?: string;
}

export class GhostBlocks implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Ghost Blocks',
    name: 'ghostBlocks',
    icon: 'file:ghost.svg' as Icon,
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Publish to Ghost CMS using simple content blocks',
    defaults: { name: 'Ghost Blocks' },
    inputs: ['main'] as any,
    outputs: ['main'] as any,
    credentials: [{ name: 'ghostBlocksApi', required: true }],
    properties: [
      // ----------------------------------------------------------------
      // Resource
      // ----------------------------------------------------------------
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Post', value: 'post' },
          { name: 'Tag', value: 'tag' },
          { name: 'Newsletter', value: 'newsletter' },
          { name: 'Health', value: 'health' },
        ],
        default: 'post',
      },

      // ----------------------------------------------------------------
      // Post operations
      // ----------------------------------------------------------------
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['post'] } },
        options: [
          { name: 'Create', value: 'create', action: 'Create a post', description: 'Create a new post from content blocks' },
          { name: 'Update', value: 'update', action: 'Update a post', description: 'Update an existing post by ID' },
          { name: 'Get', value: 'get', action: 'Get a post', description: 'Get a single post by ID' },
          { name: 'Get Many', value: 'list', action: 'Get many posts', description: 'List posts with optional filters' },
          { name: 'Delete', value: 'delete', action: 'Delete a post', description: 'Delete a post by ID' },
        ],
        default: 'create',
      },

      // ---- Common: Post ID (for get/update/delete)
      {
        displayName: 'Post ID',
        name: 'postId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['post'], operation: ['get', 'update', 'delete'] } },
      },

      // ---- Create/Update: Title
      {
        displayName: 'Title',
        name: 'title',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['post'], operation: ['create'] } },
      },
      {
        displayName: 'Title',
        name: 'title',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['post'], operation: ['update'] } },
      },

      // ---- Create/Update: Content blocks (JSON or expression)
      {
        displayName:
          'Using an AI agent? Copy the <a href="https://github.com/TheFamousHesham/ghost-blocks/blob/master/packages/core/schema/ai-prompt.md" target="_blank">system prompt template</a> or use the <a href="https://github.com/TheFamousHesham/ghost-blocks/blob/master/packages/core/schema/blocks.schema.json" target="_blank">JSON Schema</a> for strict validation.',
        name: 'aiResourceLinks',
        type: 'notice',
        default: '',
        displayOptions: { show: { resource: ['post'], operation: ['create', 'update'] } },
      },
      {
        displayName: 'Content',
        name: 'content',
        type: 'json',
        default: '={{ $json.blocks }}',
        description:
          'JSON array of typed blocks. Each block has a "type" field plus type-specific fields. Wire from an upstream node via {{ $json.blocks }}.',
        displayOptions: { show: { resource: ['post'], operation: ['create', 'update'] } },
      },

      // ---- Create/Update: Additional fields collection
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['post'], operation: ['create', 'update'] } },
        options: [
          {
            displayName: 'Status',
            name: 'status',
            type: 'options',
            options: [
              { name: 'Draft', value: 'draft' },
              { name: 'Published', value: 'published' },
              { name: 'Scheduled', value: 'scheduled' },
            ],
            default: 'draft',
          },
          {
            displayName: 'Visibility',
            name: 'visibility',
            type: 'options',
            options: [
              { name: 'Public', value: 'public' },
              { name: 'Members', value: 'members' },
              { name: 'Paid', value: 'paid' },
            ],
            default: 'public',
          },
          {
            displayName: 'Featured',
            name: 'featured',
            type: 'boolean',
            default: false,
          },
          {
            displayName: 'Slug',
            name: 'slug',
            type: 'string',
            default: '',
            description: 'URL slug. Auto-generated from title if empty.',
          },
          {
            displayName: 'Excerpt',
            name: 'excerpt',
            type: 'string',
            typeOptions: { rows: 2 },
            default: '',
            description: 'Custom excerpt shown in feeds and previews.',
          },
          {
            displayName: 'Feature Image URL',
            name: 'feature_image',
            type: 'string',
            default: '',
          },
          {
            displayName: 'Feature Image Alt',
            name: 'feature_image_alt',
            type: 'string',
            default: '',
          },
          {
            displayName: 'Feature Image Caption',
            name: 'feature_image_caption',
            type: 'string',
            default: '',
          },
          {
            displayName: 'Tags',
            name: 'tags',
            type: 'string',
            default: '',
            description: 'Comma-separated tag names. Tags prefixed with # are internal.',
            placeholder: 'Finance, Markets, #internal-research',
          },
          {
            displayName: 'Authors',
            name: 'authors',
            type: 'string',
            default: '',
            description: 'Comma-separated author email addresses.',
            placeholder: 'editor@site.com, writer@site.com',
          },
          {
            displayName: 'Published At',
            name: 'published_at',
            type: 'dateTime',
            default: '',
            description: 'ISO 8601 datetime. Required for status=scheduled.',
          },
          {
            displayName: 'Canonical URL',
            name: 'canonical_url',
            type: 'string',
            default: '',
          },
          {
            displayName: 'Email Only',
            name: 'email_only',
            type: 'boolean',
            default: false,
            description: 'When true, the post is delivered by email only and not published on the site.',
          },
        ],
      },

      // ---- Create/Update: SEO fields
      {
        displayName: 'SEO Fields',
        name: 'seo',
        type: 'collection',
        placeholder: 'Add SEO Field',
        default: {},
        displayOptions: { show: { resource: ['post'], operation: ['create', 'update'] } },
        options: [
          { displayName: 'Meta Title', name: 'meta_title', type: 'string', default: '' },
          { displayName: 'Meta Description', name: 'meta_description', type: 'string', typeOptions: { rows: 2 }, default: '' },
          { displayName: 'OG Title', name: 'og_title', type: 'string', default: '' },
          { displayName: 'OG Description', name: 'og_description', type: 'string', typeOptions: { rows: 2 }, default: '' },
          { displayName: 'OG Image URL', name: 'og_image', type: 'string', default: '' },
          { displayName: 'Twitter Title', name: 'twitter_title', type: 'string', default: '' },
          { displayName: 'Twitter Description', name: 'twitter_description', type: 'string', typeOptions: { rows: 2 }, default: '' },
          { displayName: 'Twitter Image URL', name: 'twitter_image', type: 'string', default: '' },
        ],
      },

      // ---- Create/Update: Newsletter send
      {
        displayName: 'Send as Newsletter',
        name: 'newsletter',
        type: 'collection',
        placeholder: 'Configure Newsletter',
        default: {},
        displayOptions: { show: { resource: ['post'], operation: ['create', 'update'] } },
        options: [
          {
            displayName: 'Send',
            name: 'send',
            type: 'boolean',
            default: false,
            description: 'When true, deliver this post as a newsletter on publish.',
          },
          {
            displayName: 'Newsletter Slug',
            name: 'slug',
            type: 'string',
            default: '',
            description: 'Slug of the newsletter to send through (use "Newsletter > Get Many" to find).',
          },
          {
            displayName: 'Segment',
            name: 'segment',
            type: 'string',
            default: '',
            description: 'NQL filter for member targeting, e.g. "status:free" or "status:-free".',
          },
        ],
      },

      // ---- List options
      {
        displayName: 'Filters',
        name: 'filters',
        type: 'collection',
        placeholder: 'Add Filter',
        default: {},
        displayOptions: { show: { resource: ['post'], operation: ['list'] } },
        options: [
          {
            displayName: 'Status',
            name: 'status',
            type: 'options',
            options: [
              { name: 'Draft', value: 'draft' },
              { name: 'Published', value: 'published' },
              { name: 'Scheduled', value: 'scheduled' },
              { name: 'Sent', value: 'sent' },
            ],
            default: 'published',
          },
          { displayName: 'Tag', name: 'tag', type: 'string', default: '' },
          { displayName: 'Search (Title Contains)', name: 'search', type: 'string', default: '' },
          { displayName: 'Limit', name: 'limit', type: 'number', default: 15 },
          { displayName: 'Page', name: 'page', type: 'number', default: 1 },
          {
            displayName: 'Order',
            name: 'order',
            type: 'string',
            default: 'published_at desc',
            description: 'e.g. "published_at desc", "title asc"',
          },
          {
            displayName: 'Raw NQL Filter',
            name: 'filter',
            type: 'string',
            default: '',
            description: 'Advanced: raw NQL filter overriding the others.',
          },
        ],
      },

      // ----------------------------------------------------------------
      // Tag operations
      // ----------------------------------------------------------------
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['tag'] } },
        options: [
          { name: 'Get Many', value: 'list', action: 'Get many tags' },
        ],
        default: 'list',
      },

      // ----------------------------------------------------------------
      // Newsletter operations
      // ----------------------------------------------------------------
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['newsletter'] } },
        options: [
          { name: 'Get Many', value: 'list', action: 'Get many newsletters' },
        ],
        default: 'list',
      },

      // ----------------------------------------------------------------
      // Health operations
      // ----------------------------------------------------------------
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['health'] } },
        options: [
          { name: 'Test Connection', value: 'test', action: 'Test the connection to Ghost' },
        ],
        default: 'test',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const credentials = (await this.getCredentials('ghostBlocksApi')) as unknown as Credentials;
    const publisher = new GhostPublisher({
      url: credentials.url,
      adminKey: credentials.adminKey,
      apiVersion: credentials.apiVersion,
    });

    for (let i = 0; i < items.length; i++) {
      const resource = this.getNodeParameter('resource', i) as string;
      const operation = this.getNodeParameter('operation', i) as string;

      try {
        let result: unknown;

        if (resource === 'post') {
          result = await runPostOperation.call(this, publisher, operation, i);
        } else if (resource === 'tag' && operation === 'list') {
          result = await publisher.listTags();
        } else if (resource === 'newsletter' && operation === 'list') {
          result = await publisher.listNewsletters();
        } else if (resource === 'health' && operation === 'test') {
          const site = await publisher.client.getSite();
          result = { ok: true, site };
        } else {
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${resource}.${operation}`);
        }

        if (Array.isArray(result)) {
          for (const item of result) {
            returnData.push({ json: item as IDataObject });
          }
        } else {
          returnData.push({ json: result as IDataObject });
        }
      } catch (error) {
        if (this.continueOnFail()) {
          const message = error instanceof Error ? error.message : String(error);
          const ghostErrors = error instanceof GhostApiError ? error.ghostErrors : undefined;
          const errorJson: IDataObject = { error: message };
          if (ghostErrors) errorJson.ghost_errors = ghostErrors as unknown as IDataObject[];
          returnData.push({ json: errorJson, pairedItem: { item: i } });
          continue;
        }
        if (error instanceof Error) {
          throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
        }
        throw error;
      }
    }

    return [returnData];
  }
}

// ============================================================================
// Post operations
// ============================================================================

async function runPostOperation(
  this: IExecuteFunctions,
  publisher: GhostPublisher,
  operation: string,
  itemIndex: number,
): Promise<unknown> {
  if (operation === 'create' || operation === 'update') {
    const input = buildPostInput.call(this, itemIndex);
    if (operation === 'create') {
      if (!input.title) {
        throw new Error('Title is required when creating a post');
      }
      return publisher.createPost(input as CreatePostInput);
    }
    const postId = this.getNodeParameter('postId', itemIndex) as string;
    return publisher.updatePost(postId, input as UpdatePostInput);
  }

  if (operation === 'get') {
    const postId = this.getNodeParameter('postId', itemIndex) as string;
    return publisher.getPost(postId);
  }

  if (operation === 'list') {
    const filters = this.getNodeParameter('filters', itemIndex, {}) as Record<string, unknown>;
    const params: Record<string, unknown> = {};
    for (const k of ['status', 'tag', 'search', 'order', 'filter']) {
      if (filters[k]) params[k] = filters[k];
    }
    if (filters.limit != null) params.limit = filters.limit;
    if (filters.page != null) params.page = filters.page;
    const { posts } = await publisher.browsePosts(params as any);
    return posts;
  }

  if (operation === 'delete') {
    const postId = this.getNodeParameter('postId', itemIndex) as string;
    await publisher.deletePost(postId);
    return { id: postId, deleted: true };
  }

  throw new Error(`Unknown post operation: ${operation}`);
}

function buildPostInput(this: IExecuteFunctions, itemIndex: number): Partial<CreatePostInput> {
  const title = this.getNodeParameter('title', itemIndex, '') as string;
  const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as Record<
    string,
    unknown
  >;
  const seo = this.getNodeParameter('seo', itemIndex, {}) as Record<string, unknown>;
  const newsletter = this.getNodeParameter('newsletter', itemIndex, {}) as Record<string, unknown>;

  // Content can arrive as a JSON string (literal) or as a parsed array (from
  // an expression like {{ $json.blocks }}). Handle both.
  const contentParam = this.getNodeParameter('content', itemIndex, '') as string | unknown[];
  let content: ContentBlock[] | undefined;
  if (typeof contentParam === 'string') {
    if (contentParam.trim()) {
      try {
        content = JSON.parse(contentParam);
      } catch (e) {
        throw new Error(
          `Could not parse Content as JSON. Pass an array of block objects, or wire from an upstream node. ${(e as Error).message}`,
        );
      }
    }
  } else if (Array.isArray(contentParam)) {
    content = contentParam as ContentBlock[];
  }

  const input: Record<string, unknown> = {};
  if (title) input.title = title;
  if (content && Array.isArray(content) && content.length > 0) input.content = content;

  // Pass through string/boolean fields
  for (const k of [
    'status', 'visibility', 'featured', 'slug', 'excerpt',
    'feature_image', 'feature_image_alt', 'feature_image_caption',
    'canonical_url', 'email_only', 'published_at',
  ]) {
    if (additionalFields[k] !== undefined && additionalFields[k] !== '') {
      input[k] = additionalFields[k];
    }
  }

  // Tags / authors: comma-separated strings
  if (typeof additionalFields.tags === 'string' && additionalFields.tags) {
    input.tags = (additionalFields.tags as string)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof additionalFields.authors === 'string' && additionalFields.authors) {
    input.authors = (additionalFields.authors as string)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (Object.keys(seo).length > 0) input.seo = seo;
  if (newsletter.send && newsletter.slug) {
    input.newsletter = {
      send: true,
      slug: newsletter.slug as string,
      ...(newsletter.segment ? { segment: newsletter.segment as string } : {}),
    };
  }

  return input as Partial<CreatePostInput>;
}
