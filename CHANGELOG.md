# Changelog

All notable changes are documented here. This project follows [Semantic Versioning](https://semver.org/).

## ghost-blocks 0.3.1 — 2026-05-10

- Republished via GitHub Actions with npm provenance attestation (required for n8n community-node verification from May 2026 onwards).
- No code changes from 0.3.0.

## n8n-nodes-ghost-blocks 0.4.4 — 2026-05-10

- Republished via GitHub Actions with npm provenance attestation.
- No code changes from 0.4.3.
- Dependency bump: `ghost-blocks ^0.3.1`.

---

## ghost-blocks 0.3.0 — 2026-04-30

- Added `getAiPromptTemplate()` and `getContentBlocksJsonSchema()` helpers.
- Bundled `schema/ai-prompt.md` and `schema/blocks.schema.json` for AI agent consumers.

## ghost-blocks 0.2.0 — 2026-04-30

- Added `stripInlineMarkdown()` helper.
- Callout, signup, header, toggle, button cards now strip inline markdown from plain-text fields (Ghost renders these as literals otherwise).

## n8n-nodes-ghost-blocks 0.4.x — 2026-05-08 to 2026-05-10

- 0.4.3: Replaced two long notice fields with one concise hyperlinked notice.
- 0.4.2: Switched documentation URLs to GitHub.
- 0.4.1: Hosted docs on Ghost static files (temporary).
- 0.4.0: Added inline schema notice + JSON Schema link.
- 0.3.0: Simplified Content field — expression-friendly JSON input, removed visual block builder.
- 0.2.0: Added visual block builder (later removed in 0.3.0).

## 0.1.0 — 2026-04-30

Initial release.

### `ghost-blocks` (core library)

- `GhostPublisher` class — main entry point
- Lexical document builder with 24+ card types: paragraph, heading, quote, image, gallery, divider, button, bookmark, callout, toggle, header, signup, paywall, call-to-action, html, markdown, codeblock, embed, video, audio, file, product, email content, email CTA
- Inline markdown parser: `**bold**`, `*italic*`, `***bold italic***`, `` `code` ``, `[link](url)`
- Internal JWT auth — short-lived tokens generated per request from Admin API key
- SSRF protection via `UrlValidator` for bookmark/embed URL fetching
- oEmbed support for YouTube, Vimeo, Twitter/X, Spotify, SoundCloud, CodePen
- OpenGraph metadata fetching for bookmark cards
- Full TypeScript types
- 50 tests (44 unit + 6 live integration)

### `n8n-nodes-ghost-blocks`

- n8n community node wrapping the `ghost-blocks` library
- Resources: Post (CRUD), Tag (list), Newsletter (list), Health (test)
- Credential type with URL + Admin Key + API version
- Includes Ghost icon, descriptors, and operation routing
