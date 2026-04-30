// Lexical card node builders for all Ghost card types.
// Field names match @tryghost/kg-default-nodes (verified against Ghost 6.x).

import type { LexicalNode } from '../types.js';
import { paragraphNode } from './text-parser.js';

interface ImageInput {
  src?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  cardWidth?: 'regular' | 'wide' | 'full';
}

export function imageCard(i: ImageInput): LexicalNode {
  return {
    type: 'image',
    version: 1,
    src: i.src || '',
    width: i.width || 0,
    height: i.height || 0,
    title: '',
    alt: i.alt || '',
    caption: i.caption || '',
    cardWidth: i.cardWidth || 'regular',
    href: '',
  };
}

interface GalleryInput {
  images?: Array<{
    src?: string;
    width?: number;
    height?: number;
    alt?: string;
    caption?: string;
    filename?: string;
  }>;
}

export function galleryCard(i: GalleryInput): LexicalNode {
  return {
    type: 'gallery',
    version: 1,
    images: (i.images || []).map((img, idx) => ({
      row: Math.floor(idx / 3),
      src: img.src || '',
      width: img.width || 0,
      height: img.height || 0,
      alt: img.alt || '',
      caption: img.caption || '',
      fileName: img.filename || '',
    })),
  };
}

export function dividerCard(): LexicalNode {
  return { type: 'horizontalrule', version: 1 };
}

interface ButtonInput {
  buttonText?: string;
  buttonUrl?: string;
  alignment?: 'left' | 'center' | 'right';
}

export function buttonCard(i: ButtonInput): LexicalNode {
  return {
    type: 'button',
    version: 1,
    buttonText: i.buttonText || '',
    buttonUrl: i.buttonUrl || '',
    alignment: i.alignment || 'center',
  };
}

interface BookmarkInput {
  url?: string;
  title?: string;
  description?: string;
  icon?: string;
  thumbnail?: string;
  author?: string;
  publisher?: string;
  caption?: string;
}

export function bookmarkCard(i: BookmarkInput): LexicalNode {
  return {
    type: 'bookmark',
    version: 1,
    url: i.url || '',
    metadata: {
      url: i.url || '',
      title: i.title || '',
      description: i.description || '',
      icon: i.icon || '',
      thumbnail: i.thumbnail || '',
      author: i.author || '',
      publisher: i.publisher || '',
    },
    caption: i.caption || '',
  };
}

interface CalloutInput {
  calloutEmoji?: string;
  calloutText?: string;
  backgroundColor?: string;
}

export function calloutCard(i: CalloutInput): LexicalNode {
  return {
    type: 'callout',
    version: 1,
    calloutEmoji: i.calloutEmoji || '',
    calloutText: i.calloutText || '',
    backgroundColor: i.backgroundColor || 'blue',
  };
}

interface ToggleInput {
  heading?: string;
  content?: string | LexicalNode[];
}

export function toggleCard(i: ToggleInput): LexicalNode {
  const content = i.content;
  const innerNodes = typeof content === 'string' ? [paragraphNode(content)] : content || [];
  return {
    type: 'toggle',
    version: 1,
    heading: i.heading || '',
    content: innerNodes,
  };
}

interface HeaderInput {
  backgroundImageSrc?: string;
  heading?: string;
  subheading?: string;
  buttonText?: string;
  buttonUrl?: string;
}

export function headerCard(i: HeaderInput): LexicalNode {
  return {
    type: 'header',
    version: 1,
    backgroundImageSrc: i.backgroundImageSrc || '',
    heading: i.heading || '',
    subheading: i.subheading || '',
    buttonEnabled: !!(i.buttonText && i.buttonUrl),
    buttonText: i.buttonText || '',
    buttonUrl: i.buttonUrl || '',
    size: 'small',
    style: 'dark',
  };
}

interface EmailCtaInput {
  html?: string;
  showButton?: boolean;
  buttonText?: string;
  buttonUrl?: string;
  showDividers?: boolean;
  segment?: string;
}

export function emailCtaCard(i: EmailCtaInput): LexicalNode {
  return {
    type: 'email-cta',
    version: 1,
    html: i.html || '',
    showButton: i.showButton !== false && !!i.buttonText,
    buttonText: i.buttonText || '',
    buttonUrl: i.buttonUrl || '',
    showDividers: i.showDividers !== false,
    segment: i.segment || '',
  };
}

interface EmailContentInput {
  html?: string;
}

export function emailCard(i: EmailContentInput): LexicalNode {
  return {
    type: 'email',
    version: 1,
    html: i.html || '',
  };
}

interface SignupInput {
  /** Note: Ghost uses `header` and `subheader` internally (not heading/subheading) */
  header?: string;
  subheader?: string;
  buttonText?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  backgroundColor?: string;
  textColor?: string;
  alignment?: 'left' | 'center';
  layout?: 'wide' | 'split' | 'full' | 'regular';
  backgroundImageSrc?: string;
  disclaimer?: string;
  successMessage?: string;
}

export function signupCard(i: SignupInput): LexicalNode {
  return {
    type: 'signup',
    version: 1,
    header: i.header || '',
    subheader: i.subheader || '',
    buttonText: i.buttonText || 'Subscribe',
    buttonColor: i.buttonColor || 'accent',
    buttonTextColor: i.buttonTextColor || '#FFFFFF',
    backgroundColor: i.backgroundColor || '#F0F0F0',
    textColor: i.textColor || '',
    alignment: i.alignment || 'center',
    layout: i.layout || 'wide',
    backgroundImageSrc: i.backgroundImageSrc || '',
    backgroundSize: 'cover',
    disclaimer: i.disclaimer || '',
    labels: [],
    successMessage: i.successMessage || 'Thanks for subscribing!',
    swapped: false,
  };
}

export function paywallCard(): LexicalNode {
  return { type: 'paywall', version: 1 };
}

interface CtaInput {
  htmlEditor?: string;
  showButton?: boolean;
  buttonText?: string;
  buttonUrl?: string;
  backgroundColor?: string;
  layout?: string;
  hasSponsorLabel?: boolean;
}

export function ctaCard(i: CtaInput): LexicalNode {
  return {
    type: 'call-to-action',
    version: 1,
    htmlEditor: i.htmlEditor || '',
    showButton: i.showButton !== false && !!i.buttonText,
    buttonText: i.buttonText || '',
    buttonUrl: i.buttonUrl || '',
    backgroundColor: i.backgroundColor || '#F0F0F0',
    layout: i.layout || 'minimal',
    hasSponsorLabel: i.hasSponsorLabel || false,
  };
}

export function htmlCard(i: { html?: string }): LexicalNode {
  return { type: 'html', version: 1, html: i.html || '' };
}

export function markdownCard(i: { markdown?: string }): LexicalNode {
  return { type: 'markdown', version: 1, markdown: i.markdown || '' };
}

interface CodeblockInput {
  code?: string;
  language?: string;
  caption?: string;
}

export function codeblockCard(i: CodeblockInput): LexicalNode {
  return {
    type: 'codeblock',
    version: 1,
    code: i.code || '',
    language: i.language || '',
    caption: i.caption || '',
  };
}

interface EmbedInput {
  url?: string;
  html?: string;
  embedType?: string;
  metadata?: Record<string, unknown>;
}

export function embedCard(i: EmbedInput): LexicalNode {
  return {
    type: 'embed',
    version: 1,
    url: i.url || '',
    html: i.html || '',
    embedType: i.embedType || 'rich',
    metadata: i.metadata || {},
  };
}

interface VideoInput {
  src?: string;
  caption?: string;
  thumbnailSrc?: string;
  customThumbnailSrc?: string;
  width?: number;
  height?: number;
}

export function videoCard(i: VideoInput): LexicalNode {
  return {
    type: 'video',
    version: 1,
    src: i.src || '',
    caption: i.caption || '',
    thumbnailSrc: i.thumbnailSrc || '',
    customThumbnailSrc: i.customThumbnailSrc || '',
    width: i.width || 0,
    height: i.height || 0,
    duration: 0,
    mimeType: '',
    loop: false,
    cardWidth: 'regular',
  };
}

interface AudioInput {
  src?: string;
  title?: string;
  duration?: number;
}

export function audioCard(i: AudioInput): LexicalNode {
  return {
    type: 'audio',
    version: 1,
    src: i.src || '',
    title: i.title || '',
    duration: i.duration || 0,
    mimeType: '',
  };
}

interface FileInput {
  src?: string;
  fileName?: string;
  fileTitle?: string;
  fileCaption?: string;
  fileSize?: number;
}

export function fileCard(i: FileInput): LexicalNode {
  return {
    type: 'file',
    version: 1,
    src: i.src || '',
    fileName: i.fileName || '',
    fileTitle: i.fileTitle || '',
    fileCaption: i.fileCaption || '',
    fileSize: i.fileSize || 0,
  };
}

interface ProductInput {
  productImageSrc?: string;
  productTitle?: string;
  productDescription?: string;
  productRatingEnabled?: boolean;
  productStarRating?: number;
  productButtonEnabled?: boolean;
  productButton?: string;
  productUrl?: string;
}

export function productCard(i: ProductInput): LexicalNode {
  return {
    type: 'product',
    version: 1,
    productImageSrc: i.productImageSrc || '',
    productTitle: i.productTitle || '',
    productDescription: i.productDescription || '',
    productRatingEnabled: i.productRatingEnabled || false,
    productStarRating: i.productStarRating || 0,
    productButtonEnabled: i.productButtonEnabled || false,
    productButton: i.productButton || '',
    productUrl: i.productUrl || '',
  };
}
