// ghost-blocks — public API exports

export { GhostPublisher } from './publisher.js';
export { GhostClient } from './client.js';
export { GhostAuth } from './auth.js';
export { LexicalBuilder } from './lexical/builder.js';
export { UrlValidator } from './url-validator.js';
export { OEmbedFetcher, detectOEmbedProvider } from './enrichers/oembed.js';
export { OpenGraphFetcher } from './enrichers/opengraph.js';

// Lexical primitives (advanced use)
export {
  parseInlineText,
  stripInlineMarkdown,
  textNode,
  linkNode,
  paragraphNode,
  headingNode,
  quoteNode,
} from './lexical/text-parser.js';
export * as cards from './lexical/cards.js';

// Schema helpers — expose the AI prompt template and JSON Schema
export { getAiPromptTemplate, getContentBlocksJsonSchema } from './schema.js';

// Types
export type {
  GhostPublisherOptions,
  ContentBlock,
  ParagraphBlock,
  HeadingBlock,
  QuoteBlock,
  ImageBlock,
  GalleryBlock,
  DividerBlock,
  ButtonBlock,
  BookmarkBlock,
  CalloutBlock,
  ToggleBlock,
  HeaderBlock,
  EmailCtaBlock,
  EmailContentBlock,
  SignupBlock,
  PaywallBlock,
  CallToActionBlock,
  HtmlBlock,
  MarkdownBlock,
  CodeblockBlock,
  EmbedBlock,
  VideoBlock,
  AudioBlock,
  FileBlock,
  ProductBlock,
  CreatePostInput,
  UpdatePostInput,
  PostStatus,
  PostVisibility,
  PostSummary,
  BrowsePostsParams,
  SeoFields,
  Tag,
  Newsletter,
  LexicalRoot,
  LexicalNode,
} from './types.js';
export { GhostApiError } from './types.js';
