// Public types for the ghost-blocks library

export interface GhostPublisherOptions {
  /** Ghost site URL, e.g. "https://my-site.ghost.io" */
  url: string;
  /** Ghost Admin API key in the format "{id}:{hex_secret}" */
  adminKey: string;
  /** API version. Defaults to "v5.0". */
  apiVersion?: string;
  /** Optional fetch function override (useful for testing). Defaults to globalThis.fetch. */
  fetch?: typeof fetch;
}

// ============================================================================
// Content blocks (input format)
// ============================================================================

export type ContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | QuoteBlock
  | ImageBlock
  | GalleryBlock
  | DividerBlock
  | ButtonBlock
  | BookmarkBlock
  | CalloutBlock
  | ToggleBlock
  | HeaderBlock
  | EmailCtaBlock
  | EmailContentBlock
  | SignupBlock
  | PaywallBlock
  | CallToActionBlock
  | HtmlBlock
  | MarkdownBlock
  | CodeblockBlock
  | EmbedBlock
  | VideoBlock
  | AudioBlock
  | FileBlock
  | ProductBlock;

export interface ParagraphBlock {
  type: 'paragraph';
  /** Text supports inline markdown: **bold**, *italic*, `code`, [link](url) */
  text: string;
}

export interface HeadingBlock {
  type: 'heading';
  text: string;
  /** Heading level 1-6. Defaults to 2. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface QuoteBlock {
  type: 'quote';
  text: string;
}

export interface ImageBlock {
  type: 'image';
  src: string;
  alt?: string;
  caption?: string;
  /** Width: numeric pixel value, "wide", or "full" */
  width?: number | 'wide' | 'full';
  height?: number;
}

export interface GalleryBlock {
  type: 'gallery';
  images: Array<{
    src: string;
    alt?: string;
    caption?: string;
    width?: number;
    height?: number;
    filename?: string;
  }>;
}

export interface DividerBlock {
  type: 'divider';
}

export interface ButtonBlock {
  type: 'button';
  text: string;
  url: string;
  /** "left", "center", or "right". Defaults to "center". */
  alignment?: 'left' | 'center' | 'right';
}

export interface BookmarkBlock {
  type: 'bookmark';
  url: string;
  /** All metadata fields are optional — auto-fetched from OpenGraph if omitted */
  title?: string;
  description?: string;
  icon?: string;
  thumbnail?: string;
  author?: string;
  publisher?: string;
  caption?: string;
}

export interface CalloutBlock {
  type: 'callout';
  text: string;
  emoji?: string;
  /** Color name or hex value. Defaults to "blue". */
  color?: string;
}

export interface ToggleBlock {
  type: 'toggle';
  heading: string;
  content: string;
}

export interface HeaderBlock {
  type: 'header';
  heading: string;
  subheading?: string;
  background_image?: string;
  button_text?: string;
  button_url?: string;
}

export interface EmailCtaBlock {
  type: 'email_cta';
  text?: string;
  html?: string;
  button_text?: string;
  button_url?: string;
  segment?: string;
}

export interface EmailContentBlock {
  type: 'email_content';
  html: string;
}

export interface SignupBlock {
  type: 'signup';
  /** Note: Ghost stores this as `header` internally; we use the friendlier name */
  heading?: string;
  /** Note: Ghost stores this as `subheader` internally */
  subheading?: string;
  button_text?: string;
  button_color?: string;
  button_text_color?: string;
  background_color?: string;
  text_color?: string;
  alignment?: 'left' | 'center';
  layout?: 'wide' | 'split' | 'full' | 'regular';
  background_image?: string;
  disclaimer?: string;
  success_message?: string;
}

export interface PaywallBlock {
  type: 'paywall';
}

export interface CallToActionBlock {
  type: 'call_to_action';
  text?: string;
  html?: string;
  button_text?: string;
  button_url?: string;
  background_color?: string;
  layout?: string;
  sponsor_label?: boolean;
}

export interface HtmlBlock {
  type: 'html';
  html: string;
}

export interface MarkdownBlock {
  type: 'markdown';
  markdown: string;
}

export interface CodeblockBlock {
  type: 'codeblock';
  code: string;
  language?: string;
  caption?: string;
}

export interface EmbedBlock {
  type: 'embed';
  url: string;
  /** Optional pre-built HTML — otherwise fetched via oEmbed */
  html?: string;
}

export interface VideoBlock {
  type: 'video';
  src: string;
  caption?: string;
  thumbnail?: string;
}

export interface AudioBlock {
  type: 'audio';
  src: string;
  title?: string;
  duration?: number;
}

export interface FileBlock {
  type: 'file';
  src: string;
  title?: string;
  filename?: string;
  caption?: string;
  file_size?: number;
}

export interface ProductBlock {
  type: 'product';
  title: string;
  description?: string;
  image?: string;
  button_text?: string;
  button_url?: string;
  /** Star rating 0-5 */
  rating?: number;
}

// ============================================================================
// Post input/output
// ============================================================================

export type PostStatus = 'draft' | 'published' | 'scheduled';
export type PostVisibility = 'public' | 'members' | 'paid' | string;

export interface CreatePostInput {
  title: string;
  /** Content as flat blocks. Mutually exclusive with `html` and `lexical`. */
  content?: ContentBlock[];
  /** Raw HTML content (alternative to `content`). Auto-converted to Lexical via ?source=html. */
  html?: string;
  /** Pre-built Lexical JSON string (advanced). */
  lexical?: string;
  slug?: string;
  status?: PostStatus;
  featured?: boolean;
  visibility?: PostVisibility;
  /** ISO 8601 datetime. Required for status: 'scheduled'. */
  published_at?: string;
  excerpt?: string;
  feature_image?: string;
  feature_image_alt?: string;
  feature_image_caption?: string;
  canonical_url?: string;
  custom_template?: string;
  email_only?: boolean;
  /** Tag names (string) or tag objects */
  tags?: Array<string | { name: string; [key: string]: unknown }>;
  /** Author emails (string) or author objects */
  authors?: Array<string | { email?: string; id?: string; [key: string]: unknown }>;
  seo?: SeoFields;
  /** Send as newsletter on publish */
  newsletter?: { send: boolean; slug: string; segment?: string };
}

export interface SeoFields {
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
}

export interface UpdatePostInput extends Partial<Omit<CreatePostInput, 'title'>> {
  title?: string;
}

export interface PostSummary {
  id: string;
  uuid: string;
  url: string;
  status: string;
  title: string;
  slug: string;
  created_at?: string;
  updated_at: string;
  published_at?: string | null;
}

export interface BrowsePostsParams {
  status?: 'draft' | 'published' | 'scheduled' | 'sent';
  tag?: string;
  search?: string;
  limit?: number | 'all';
  page?: number;
  order?: string;
  /** Raw NQL filter override */
  filter?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  visibility?: string;
  post_count?: number;
}

export interface Newsletter {
  id: string;
  name: string;
  slug: string;
  status: string;
  sender_name?: string;
  sender_email?: string;
  subscribe_on_signup?: boolean;
}

// ============================================================================
// Lexical document types (internal but exported for advanced use)
// ============================================================================

export interface LexicalRoot {
  root: {
    children: LexicalNode[];
    direction: 'ltr' | 'rtl' | null;
    format: string;
    indent: number;
    type: 'root';
    version: 1;
  };
}

export type LexicalNode = Record<string, unknown> & { type: string; version: number };

// ============================================================================
// Errors
// ============================================================================

export class GhostApiError extends Error {
  override readonly name = 'GhostApiError';
  readonly status: number;
  readonly ghostErrors?: unknown[];

  constructor(message: string, status: number, ghostErrors?: unknown[]) {
    super(message);
    this.status = status;
    this.ghostErrors = ghostErrors;
  }
}
