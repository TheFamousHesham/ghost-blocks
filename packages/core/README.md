# ghost-blocks

[![npm version](https://img.shields.io/npm/v/ghost-blocks.svg)](https://www.npmjs.com/package/ghost-blocks)
[![License](https://img.shields.io/npm/l/ghost-blocks.svg)](../../LICENSE)

Node.js library for publishing to [Ghost CMS](https://ghost.org) using a simple, flat content blocks format. Internally builds Lexical documents and handles JWT authentication.

## Install

```bash
npm install ghost-blocks
```

Requires Node.js 18+.

## Authentication

Create a custom integration in Ghost Admin:

1. **Settings → Integrations → Add custom integration**
2. Copy the **Admin API Key** (format: `{id}:{hex_secret}`)

The library uses this key to generate short-lived JWT tokens internally on every request.

## Usage

### Basic post

```typescript
import { GhostPublisher } from 'ghost-blocks';

const publisher = new GhostPublisher({
  url: 'https://my-site.ghost.io',
  adminKey: process.env.GHOST_ADMIN_KEY!,
});

const post = await publisher.createPost({
  title: 'Hello, world',
  content: [
    { type: 'paragraph', text: 'My first post.' },
  ],
  status: 'published',
});

console.log(post.url);
```

### Rich content

```typescript
await publisher.createPost({
  title: 'Weekly Market Update',
  status: 'draft',
  excerpt: 'This week in finance.',
  tags: ['Markets', 'Weekly', '#internal-research'],
  feature_image: 'https://example.com/hero.jpg',
  content: [
    { type: 'paragraph', text: 'Opening with **bold** and *italic*.' },
    { type: 'heading', level: 2, text: 'Key Takeaways' },
    { type: 'callout', text: 'S&P 500 up 2.3% this week.', emoji: '📈', color: 'green' },
    { type: 'image', src: 'https://example.com/chart.png', alt: 'Chart' },
    { type: 'divider' },
    { type: 'button', text: 'Read More', url: 'https://example.com', alignment: 'center' },
    { type: 'paywall' },
    { type: 'paragraph', text: 'Premium content here.' },
  ],
  seo: {
    meta_title: 'Weekly Market Update',
    meta_description: 'This week in finance — concise analysis under 160 chars.',
  },
  newsletter: {
    send: true,
    slug: 'weekly-newsletter',
    segment: 'status:free',
  },
});
```

### Update a post

`updatePost` automatically fetches the current `updated_at` for collision detection — you don't need to manage it yourself.

```typescript
await publisher.updatePost(postId, {
  title: 'Updated title',
  content: [{ type: 'paragraph', text: 'Replaced.' }],
});
```

> **Note:** Tag and author arrays are *replaced*, not merged. Always send the full desired state.

### List posts

```typescript
const { posts, meta } = await publisher.browsePosts({
  status: 'published',
  tag: 'finance',
  limit: 10,
  order: 'published_at desc',
});
```

### Other operations

```typescript
const tags = await publisher.listTags();
const newsletters = await publisher.listNewsletters();
await publisher.deletePost(postId);

// Upload an image and use the returned URL in a content block
const url = await publisher.uploadImageFromPath('./hero.jpg');
```

## Content Block Reference

Every block has a `type` field. All other fields are documented below.

### Text blocks

```typescript
{ type: 'paragraph', text: string }
{ type: 'heading', text: string, level?: 1 | 2 | 3 | 4 | 5 | 6 }   // default level: 2
{ type: 'quote', text: string }
```

The `text` field supports inline markdown:
- `**bold**` → **bold**
- `*italic*` → *italic*
- `***bold italic***` → ***bold italic***
- `` `code` `` → `code`
- `[link text](url)` → clickable link

### Media blocks

```typescript
{ type: 'image', src: string, alt?: string, caption?: string, width?: number | 'wide' | 'full' }
{ type: 'gallery', images: Array<{ src, alt?, caption?, width?, height? }> }
{ type: 'video', src: string, caption?: string, thumbnail?: string }
{ type: 'audio', src: string, title?: string, duration?: number }
{ type: 'file', src: string, title?: string, filename?: string, caption?: string }
{ type: 'embed', url: string }   // YouTube, Vimeo, Twitter, Spotify, SoundCloud, CodePen — auto-detects via oEmbed
```

### Layout blocks

```typescript
{ type: 'divider' }
{ type: 'paywall' }
{ type: 'header', heading: string, subheading?: string, background_image?: string, button_text?: string, button_url?: string }
{ type: 'toggle', heading: string, content: string }
```

### Interactive blocks

```typescript
{ type: 'button', text: string, url: string, alignment?: 'left' | 'center' | 'right' }
{ type: 'callout', text: string, emoji?: string, color?: string }
{ type: 'bookmark', url: string, /* metadata auto-fetched from OpenGraph */ }
{ type: 'signup', heading?, subheading?, button_text?, button_color?, background_color?, ... }
{ type: 'call_to_action', text?, button_text?, button_url? }
{ type: 'product', title: string, description?, image?, button_text?, button_url?, rating? }
```

### Code/raw

```typescript
{ type: 'codeblock', code: string, language?: string, caption?: string }
{ type: 'html', html: string }
{ type: 'markdown', markdown: string }
```

### Email-only blocks

```typescript
{ type: 'email_content', html: string }   // Visible in email only, not on web
{ type: 'email_cta', text?: string, button_text?: string, button_url?: string, segment?: string }
```

## Advanced

### Skip enrichment for offline/test scenarios

By default, `bookmark` blocks fetch OpenGraph metadata and `embed` blocks fetch oEmbed data. Disable for tests:

```typescript
import { GhostPublisher, LexicalBuilder } from 'ghost-blocks';

const publisher = new GhostPublisher({ url, adminKey });
publisher.builder = new LexicalBuilder({ skipEnrichment: true });
```

### Build Lexical without publishing

```typescript
const lexical = await publisher.buildLexical([
  { type: 'paragraph', text: 'preview' },
]);
// lexical is a JSON string ready for Ghost's `lexical` field
```

### Direct API access

For advanced use cases, the underlying `GhostClient` is exposed:

```typescript
publisher.client.createPost({ title: 'Raw', lexical: '...' });
publisher.client.uploadImageBuffer(buffer, 'photo.jpg', 'image/jpeg');
```

## Security

This library was built with security in mind:

- **Timing-safe authentication** — JWT secrets compared with `crypto.timingSafeEqual`
- **SSRF protection** — `bookmark` and `embed` URLs are validated against private IP ranges and Docker hostnames before any HTTP request. Customize via `UrlValidator`:

  ```typescript
  import { UrlValidator, OpenGraphFetcher, LexicalBuilder } from 'ghost-blocks';

  const validator = new UrlValidator({
    extraBlockedHostnames: ['my-internal-service'],
  });
  const opengraph = new OpenGraphFetcher({ validator });
  const builder = new LexicalBuilder({ opengraph });
  ```

- **No code injection fields** — `codeinjection_head`/`codeinjection_foot` are intentionally not exposed (these inject arbitrary JS into every page).

## TypeScript

Full TypeScript types ship with the package. The main types you'll use:

```typescript
import type {
  GhostPublisher,
  ContentBlock,
  CreatePostInput,
  UpdatePostInput,
  PostSummary,
  PostStatus,
  PostVisibility,
  Tag,
  Newsletter,
} from 'ghost-blocks';
```

## License

MIT
