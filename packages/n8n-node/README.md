# n8n-nodes-ghost-blocks

[![npm version](https://img.shields.io/npm/v/n8n-nodes-ghost-blocks.svg)](https://www.npmjs.com/package/n8n-nodes-ghost-blocks)
[![License](https://img.shields.io/npm/l/n8n-nodes-ghost-blocks.svg)](../../LICENSE)

[n8n](https://n8n.io) community node for publishing to [Ghost CMS](https://ghost.org) using a simple, flat content blocks format.

This node wraps the [`ghost-blocks`](../core) library, so you get clean JSON in, complete posts out — no Lexical wrangling, no JWT tokens.

## Installation

In your n8n instance:

1. **Settings → Community Nodes → Install**
2. Enter the package name: `n8n-nodes-ghost-blocks`
3. Click **Install**

After installation, the **Ghost Blocks** node appears in the node panel under "Marketing" or by searching "ghost".

## Setup

### Get your Ghost Admin API key

1. In Ghost Admin: **Settings → Integrations → Add custom integration**
2. Name it (e.g. "n8n")
3. Copy the **Admin API Key** — it looks like `61234abc:f1f2f3...d4d5d6`

### Configure credentials in n8n

Add a new **Ghost Blocks API** credential with:

| Field | Value |
|---|---|
| Ghost URL | `https://my-site.ghost.io` (no trailing slash) |
| Admin API Key | The full `id:secret` key from Ghost |
| API Version | `v5.0` (default — leave as-is for most users) |

### Test the connection

Add a **Ghost Blocks** node, set Resource = **Health**, Operation = **Test Connection**, and execute. You should see your site info returned.

## Resources & Operations

### Post

| Operation | What it does |
|---|---|
| **Create** | Creates a new post from content blocks |
| **Update** | Updates an existing post by ID |
| **Get** | Fetches a single post by ID (full content + rendered HTML) |
| **Get Many** | Lists posts with filters (status, tag, search, etc.) |
| **Delete** | Deletes a post by ID |

### Tag

| Operation | What it does |
|---|---|
| **Get Many** | Lists all tags with post counts |

### Newsletter

| Operation | What it does |
|---|---|
| **Get Many** | Lists all newsletters (use the `slug` field for sending) |

### Health

| Operation | What it does |
|---|---|
| **Test Connection** | Verifies credentials by hitting `/admin/site/` |

## Creating a post

When you choose **Resource = Post, Operation = Create**, the node has these fields:

- **Title** — required
- **Content (Blocks JSON)** — array of content blocks (see below)
- **Additional Fields** — status, visibility, tags, feature image, slug, etc.
- **SEO Fields** — meta_title, meta_description, OG/Twitter overrides
- **Send as Newsletter** — toggle to deliver as a newsletter on publish

The **Content** field is a JSON array. The default value is a working example:

```json
[
  { "type": "paragraph", "text": "Hello with **bold** and *italic* and a [link](https://example.com)." },
  { "type": "heading", "level": 2, "text": "Section" },
  { "type": "divider" }
]
```

You can use n8n expressions to build the array dynamically from upstream nodes.

### Block types

The same block format as the [`ghost-blocks`](../core/README.md#content-block-reference) library. Most common:

```json
{ "type": "paragraph", "text": "Text with **bold**, *italic*, [links](url), and `code`." }
{ "type": "heading", "level": 2, "text": "Section" }
{ "type": "image", "src": "https://...", "alt": "...", "caption": "..." }
{ "type": "divider" }
{ "type": "callout", "text": "Note", "emoji": "💡", "color": "blue" }
{ "type": "button", "text": "Click", "url": "https://...", "alignment": "center" }
{ "type": "paywall" }
{ "type": "embed", "url": "https://www.youtube.com/watch?v=..." }
```

See the [full block reference](../core/README.md#content-block-reference) for all 24 block types.

## Example workflows

### Publish a draft from Google Sheets

```
[Trigger: New row in Sheet]
   ↓
[Code node: format content blocks from row data]
   ↓
[Ghost Blocks: Create Post (status=draft)]
   ↓
[Slack: Notify team for review]
```

### Auto-publish + email on a schedule

```
[Cron: Tuesdays at 9am]
   ↓
[Ghost Blocks: List drafts, status=draft, tag=ready-to-publish]
   ↓
[Loop over results]
   ↓
[Ghost Blocks: Update post — status=published, newsletter.send=true, slug=weekly]
```

### Sync from Notion

```
[Notion: Get database items]
   ↓
[Ghost Blocks: List posts (to find existing ones)]
   ↓
[IF: post exists?]
   YES → [Ghost Blocks: Update]
   NO  → [Ghost Blocks: Create]
```

## Tips

- **Newsletter slug**: To send as newsletter, you need the slug. Get it once via the **Newsletter > Get Many** operation, then hardcode it.
- **Tags are replaced**: When updating, tags overwrite the existing list. Always send the complete tag set.
- **Featured image**: Use a publicly-accessible URL. Ghost will mirror it to its CDN automatically.
- **Schedule for later**: Set `status` to `scheduled` and `published_at` to a future ISO 8601 datetime in additional fields.

## Authentication notes

This node doesn't use n8n's standard credential test mechanism because Ghost requires short-lived JWTs (5-minute expiry, HS256-signed with a hex-decoded secret). Instead, the **Health > Test Connection** operation provides equivalent functionality. JWT generation happens internally in the underlying `ghost-blocks` library.

## More tools for n8n users

If you build with n8n, you might also like:

- **[Nodey](https://getnodey.com)** *(launching soon)* — A mobile command centre for n8n. Run and debug your workflows from your phone, with an AI workflow builder, geo-fenced location-based triggers, and NFC triggers. The fastest way to put n8n in your pocket.
- **[n8n workflow templates](https://github.com/TheFamousHesham/n8n_workflows)** — A growing collection of production-ready n8n workflow templates for common automation patterns. Free to use and adapt.

## License

MIT
