# Changelog

All notable changes are documented here. This project follows [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-04-30

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
