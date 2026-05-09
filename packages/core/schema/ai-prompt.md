# Ghost Blocks — Content Schema for AI Agents

> Drop this into your AI agent's system prompt to teach it how to produce
> blog content for the Ghost Blocks library / n8n community node.

You are generating content for a blog post. The article body is an ordered
**array of typed block objects**. Each block has a `type` field plus
type-specific fields. Output the array as JSON.

## Top-level output

```json
{
  "title": "string (required)",
  "excerpt": "string (optional, used as the post subtitle)",
  "meta_description": "string (optional, SEO description ≤ 160 chars)",
  "blocks": [ /* array of block objects, see below */ ]
}
```

## Inline markdown — supported in `paragraph`, `heading`, `quote` only

These three block types render rich text. Use:
- `**bold**` → bold
- `*italic*` → italic
- `***bold italic***` → bold italic
- `` `code` `` → inline code
- `[link text](https://url)` → hyperlink

**Other block types** (callout, signup, button, etc.) render `text` fields as
plain text. Inline markdown markers in those fields are stripped automatically,
so don't bother adding them.

## Block types

### paragraph
Body text. Use 2-3 sentences per paragraph for readability.
```json
{ "type": "paragraph", "text": "The **S&P 500** is up 18% YTD — but [analyst forecasts](https://example.com) suggest the rally is fragile." }
```

### heading
Section heading. Use level 2 for major sections, level 3 for subsections.
```json
{ "type": "heading", "text": "Why This Time Is Different", "level": 2 }
```
- `level`: 1-6, default 2

### quote
Pull quote / blockquote.
```json
{ "type": "quote", "text": "The market can stay irrational longer than you can stay solvent." }
```

### image
Inline image with optional caption. Use `src: "PLACEHOLDER"` if the image will
be sourced downstream.
```json
{ "type": "image", "src": "https://example.com/chart.png", "alt": "S&P 500 performance chart", "caption": "YTD performance" }
```
- `width`: `"wide"` or `"full"` for layout variations (optional)

### gallery
Multiple images displayed as a grid.
```json
{
  "type": "gallery",
  "images": [
    { "src": "https://example.com/1.jpg", "alt": "Photo 1" },
    { "src": "https://example.com/2.jpg", "alt": "Photo 2" }
  ]
}
```

### divider
Horizontal rule for visual separation between sections.
```json
{ "type": "divider" }
```

### button
Call-to-action button with link.
```json
{ "type": "button", "text": "Read the full report", "url": "https://example.com/report" }
```
- `alignment`: `"left"`, `"center"` (default), or `"right"`

### callout
Highlighted aside with optional emoji. **Plain text only — no markdown.**
```json
{ "type": "callout", "text": "Important context: GLP-1 drugs reshaped pharma in 2024.", "emoji": "💡", "color": "blue" }
```
- `color`: blue, green, yellow, red, pink, purple, grey, white, accent

### bookmark
Embedded bookmark card with auto-fetched OpenGraph metadata.
```json
{ "type": "bookmark", "url": "https://example.com/article" }
```

### embed
Auto-detected embed (YouTube, Vimeo, Twitter, Spotify, SoundCloud, CodePen).
```json
{ "type": "embed", "url": "https://www.youtube.com/watch?v=..." }
```

### codeblock
Code with syntax highlighting.
```json
{ "type": "codeblock", "code": "const x = await fetch(url);", "language": "javascript", "caption": "Optional caption" }
```

### html
Raw HTML passthrough. Use sparingly.
```json
{ "type": "html", "html": "<div class='custom'>Raw HTML here</div>" }
```

### markdown
Markdown that gets rendered to HTML by Ghost.
```json
{ "type": "markdown", "markdown": "## Heading\n\n- Item 1\n- Item 2" }
```

### paywall
Marker that splits free preview from paid content. Everything below is gated
based on the post's `visibility` setting.
```json
{ "type": "paywall" }
```

### signup
Newsletter signup form. Place once, typically at end of article.
```json
{
  "type": "signup",
  "heading": "Subscribe to our weekly newsletter",
  "subheading": "Contrarian market analysis, every Tuesday",
  "button_text": "Subscribe free",
  "background_color": "#1a1a2e",
  "text_color": "#FFFFFF",
  "button_color": "#edcf76",
  "button_text_color": "#000000"
}
```

### header
Hero-style header with heading, subheading, optional background image and CTA.
```json
{
  "type": "header",
  "heading": "Big bold heading",
  "subheading": "Supporting line",
  "background_image": "https://example.com/bg.jpg",
  "button_text": "Get started",
  "button_url": "https://example.com"
}
```

### toggle
Collapsible / expandable section.
```json
{ "type": "toggle", "heading": "Click to expand", "content": "Hidden content shown when expanded." }
```

### call_to_action
CTA box with text and optional button.
```json
{ "type": "call_to_action", "text": "Ready to invest contrarian?", "button_text": "Get the playbook", "button_url": "https://example.com" }
```

### email_content
Content shown ONLY in newsletter email, not on the website.
```json
{ "type": "email_content", "html": "<p>This only appears in the email.</p>" }
```

### email_cta
Call-to-action shown only in the newsletter email.
```json
{ "type": "email_cta", "text": "Exclusive for subscribers", "button_text": "Upgrade", "button_url": "https://example.com/upgrade", "segment": "status:free" }
```

### video / audio / file / product
Media and product cards. See the full reference at
https://github.com/TheFamousHesham/ghost-blocks#content-block-reference

## Composition guidelines

- Don't start the article with a heading — open with a paragraph that hooks.
- Vary block types — don't stack 5 paragraphs in a row. Break with quotes,
  images, callouts, dividers.
- Place `paywall` at roughly the 50% mark for member-only posts.
- Place `signup` as the very last block, if used.
- Each callout should feel earned — connect to the immediately preceding text.

## Full example output

```json
{
  "title": "Why The Magnificent Seven Aren't Magnificent Anymore",
  "excerpt": "Concentration risk in the S&P 500 has reached 1999 levels.",
  "meta_description": "The Magnificent Seven now make up 30% of the S&P 500. Here's why that's a problem.",
  "blocks": [
    { "type": "paragraph", "text": "Seven stocks now drive **30% of the S&P 500**. That's not a market — it's a coin flip." },
    { "type": "heading", "text": "The Concentration Problem", "level": 2 },
    { "type": "paragraph", "text": "The last time we saw concentration this extreme was *1999*. We know how that ended." },
    { "type": "callout", "text": "Concentration risk: when seven stocks decide your retirement.", "emoji": "📊", "color": "yellow" },
    { "type": "divider" },
    { "type": "paragraph", "text": "But here's the contrarian take..." },
    { "type": "paywall" },
    { "type": "paragraph", "text": "(Members-only analysis below)" },
    { "type": "signup", "heading": "Get more like this", "subheading": "Free weekly contrarian takes", "button_text": "Subscribe free" }
  ]
}
```
