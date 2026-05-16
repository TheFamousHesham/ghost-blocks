# Ghost Blocks (and friends)

Tools for publishing to [Ghost CMS](https://ghost.org) — plus an unrelated [n8n trigger node](./packages/n8n-node-nodey) for the [Nodey mobile app](https://getnodey.com) that lives in the same monorepo.

This monorepo contains four packages:

| Package | Description | Audience |
|---|---|---|
| [`ghost-blocks`](./packages/core) | Node.js library for publishing to Ghost. Use directly in any Node.js app. | Any Node.js consumer |
| [`n8n-nodes-ghost-blocks`](./packages/n8n-node) | n8n community node, full features (image upload, bookmark/embed auto-enrichment). | **Self-hosted n8n** |
| [`n8n-nodes-ghost-blocks-cloud`](./packages/n8n-node-cloud) | n8n community node, slim verified-compatible edition. | **n8n Cloud** |
| [`n8n-nodes-nodey`](./packages/n8n-node-nodey) | n8n community trigger node — fires a workflow when an NFC tag is scanned via the [Nodey mobile app](https://getnodey.com). Verified-compatible. | **n8n Cloud + self-hosted** |

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
git clone https://github.com/TheFamousHesham/ghost-blocks
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

## Releasing

Releases are published to npm with **provenance attestations** via GitHub Actions — required for [n8n community-node verification](https://docs.n8n.io/integrations/creating-nodes/build/reference/verification-guidelines/) from May 2026 onwards.

To release a new version of either package:

1. Bump the `version` field in the relevant `packages/*/package.json`.
2. Update `CHANGELOG.md`.
3. Commit and push to `main`.
4. Create and push a tag matching the pattern `<package-name>@<version>`:
   ```bash
   git tag -a ghost-blocks@0.3.2 -m "Release ghost-blocks 0.3.2"
   git push origin ghost-blocks@0.3.2
   ```
5. The matching GitHub Action will build, test, verify the tag matches the package version, then publish with `--provenance`.

GitHub Actions secrets required:
- `NPM_TOKEN` — granular npm access token with publish rights on `ghost-blocks` and `n8n-nodes-ghost-blocks`.

## More from the author

- **[Nodey](https://getnodey.com)** *(launching soon)* — A mobile command centre for n8n. Run and debug workflows from your phone, with an AI workflow builder, geo-fenced location-based triggers, and NFC triggers.
- **[n8n workflow templates](https://github.com/TheFamousHesham/n8n_workflows)** — A growing collection of production-ready n8n workflow templates for common automation patterns. Free to use and adapt.

## License

MIT — see [LICENSE](./LICENSE).
