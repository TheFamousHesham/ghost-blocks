# Ghost Blocks

Publish to [Ghost CMS](https://ghost.org) using a simple, flat content blocks format. Internally builds Lexical documents and handles JWT authentication, so you don't have to.

This monorepo contains two packages:

| Package | Description |
|---|---|
| [`ghost-blocks`](./packages/core) | Node.js library for publishing to Ghost. Use directly in any Node.js app. |
| [`n8n-nodes-ghost-blocks`](./packages/n8n-node) | n8n community node. Drag, drop, and publish from your n8n workflows. |

## Why this exists

Ghost stores content in [Lexical](https://lexical.dev) — a deeply nested JSON format with format flags, decorator nodes, and 24+ card types. Writing a complete article block by block is painful. Ghost's Admin API also requires short-lived JWT tokens (5-min expiry) generated from a hex-decoded HMAC secret, which most automation tools can't do natively.

Ghost Blocks lets you describe a post like this:

```js
{
  title: "My Article",
  content: [
    { type: "paragraph", text: "First paragraph with **bold** and *italic*." },
    { type: "heading", level: 2, text: "Section" },
    { type: "image", src: "https://...", alt: "Photo" },
    { type: "callout", text: "Important note", emoji: "💡", color: "blue" },
    { type: "paywall" },
    { type: "paragraph", text: "Behind the paywall." }
  ],
  status: "published"
}
```

…and it builds the full Lexical document, handles auth, and publishes to Ghost.

## Quick start

**Library:**

```bash
npm install ghost-blocks
```

```js
import { GhostPublisher } from 'ghost-blocks';

const publisher = new GhostPublisher({
  url: 'https://my-site.ghost.io',
  adminKey: 'YOUR_ID:YOUR_HEX_SECRET',
});

await publisher.createPost({
  title: 'Hello world',
  content: [{ type: 'paragraph', text: 'My first post **with formatting**.' }],
  status: 'published',
});
```

See [`packages/core/README.md`](./packages/core/README.md) for full documentation.

**n8n community node:**

In your n8n instance, go to **Settings → Community Nodes → Install** and enter `n8n-nodes-ghost-blocks`. Then add a **Ghost Blocks** node to any workflow.

See [`packages/n8n-node/README.md`](./packages/n8n-node/README.md) for setup details.

## Development

```bash
git clone https://github.com/heshamfm/ghost-blocks
cd ghost-blocks
npm install         # installs all workspaces
npm run build       # builds both packages
npm run test        # runs unit tests across all packages
```

To run integration tests against a live Ghost instance:

```bash
GHOST_URL=https://my-site.ghost.io \
GHOST_ADMIN_KEY=id:hex_secret \
npm run -w ghost-blocks test:integration
```

## License

MIT — see [LICENSE](./LICENSE).
