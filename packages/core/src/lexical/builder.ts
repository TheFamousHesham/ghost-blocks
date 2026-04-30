// Lexical Document Builder
// Takes flat content blocks and produces a valid Lexical JSON document.

import type { ContentBlock, LexicalNode } from '../types.js';
import { paragraphNode, headingNode, quoteNode } from './text-parser.js';
import * as cards from './cards.js';
import { OEmbedFetcher } from '../enrichers/oembed.js';
import { OpenGraphFetcher } from '../enrichers/opengraph.js';

export interface LexicalBuilderOptions {
  oembed?: OEmbedFetcher;
  opengraph?: OpenGraphFetcher;
  /** When true, bookmark and embed blocks won't fetch external metadata. */
  skipEnrichment?: boolean;
}

export class LexicalBuilder {
  private readonly oembed: OEmbedFetcher;
  private readonly opengraph: OpenGraphFetcher;
  private readonly skipEnrichment: boolean;

  constructor(options: LexicalBuilderOptions = {}) {
    this.oembed = options.oembed || new OEmbedFetcher();
    this.opengraph = options.opengraph || new OpenGraphFetcher();
    this.skipEnrichment = options.skipEnrichment === true;
  }

  /**
   * Build a Lexical JSON document from a flat array of content blocks.
   * Returns the JSON-stringified document ready to send to Ghost as `lexical`.
   */
  async build(blocks: ContentBlock[] | undefined): Promise<string> {
    if (!blocks || blocks.length === 0) {
      return JSON.stringify(this.wrapRoot([paragraphNode('')]));
    }

    const children: LexicalNode[] = [];
    for (const block of blocks) {
      const node = await this.buildNode(block);
      if (node) children.push(node);
    }
    if (children.length === 0) {
      children.push(paragraphNode(''));
    }
    return JSON.stringify(this.wrapRoot(children));
  }

  private wrapRoot(children: LexicalNode[]) {
    return {
      root: {
        children,
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    };
  }

  private async buildNode(block: ContentBlock): Promise<LexicalNode | null> {
    switch (block.type) {
      case 'paragraph':
        return paragraphNode(block.text || '');

      case 'heading':
        return headingNode(block.text || '', block.level || 2);

      case 'quote':
        return quoteNode(block.text || '');

      case 'image': {
        const cardWidth =
          block.width === 'wide' || block.width === 'full' ? block.width : 'regular';
        return cards.imageCard({
          src: block.src,
          alt: block.alt,
          caption: block.caption,
          width: typeof block.width === 'number' ? block.width : 0,
          height: typeof block.height === 'number' ? block.height : 0,
          cardWidth,
        });
      }

      case 'gallery':
        return cards.galleryCard({ images: block.images });

      case 'divider':
        return cards.dividerCard();

      case 'button':
        return cards.buttonCard({
          buttonText: block.text,
          buttonUrl: block.url,
          alignment: block.alignment,
        });

      case 'bookmark': {
        let metadata = {
          title: block.title || '',
          description: block.description || '',
          icon: block.icon || '',
          thumbnail: block.thumbnail || '',
          author: block.author || '',
          publisher: block.publisher || '',
        };
        if (!this.skipEnrichment) {
          const og = await this.opengraph.fetchOpenGraph(block.url);
          metadata = {
            title: block.title || og.title,
            description: block.description || og.description,
            icon: block.icon || og.icon,
            thumbnail: block.thumbnail || og.thumbnail,
            author: block.author || og.author,
            publisher: block.publisher || og.publisher,
          };
        }
        return cards.bookmarkCard({ url: block.url, ...metadata, caption: block.caption });
      }

      case 'callout':
        return cards.calloutCard({
          calloutEmoji: block.emoji,
          calloutText: block.text,
          backgroundColor: block.color,
        });

      case 'toggle':
        return cards.toggleCard({ heading: block.heading, content: block.content });

      case 'header':
        return cards.headerCard({
          backgroundImageSrc: block.background_image,
          heading: block.heading,
          subheading: block.subheading,
          buttonText: block.button_text,
          buttonUrl: block.button_url,
        });

      case 'email_cta':
        return cards.emailCtaCard({
          html: block.text || block.html,
          buttonText: block.button_text,
          buttonUrl: block.button_url,
          segment: block.segment,
        });

      case 'email_content':
        return cards.emailCard({ html: block.html });

      case 'signup':
        return cards.signupCard({
          header: block.heading,
          subheader: block.subheading,
          buttonText: block.button_text,
          buttonColor: block.button_color,
          buttonTextColor: block.button_text_color,
          backgroundColor: block.background_color,
          textColor: block.text_color,
          alignment: block.alignment,
          layout: block.layout,
          backgroundImageSrc: block.background_image,
          disclaimer: block.disclaimer,
          successMessage: block.success_message,
        });

      case 'paywall':
        return cards.paywallCard();

      case 'call_to_action':
        return cards.ctaCard({
          htmlEditor: block.text || block.html,
          buttonText: block.button_text,
          buttonUrl: block.button_url,
          backgroundColor: block.background_color,
          layout: block.layout,
          hasSponsorLabel: block.sponsor_label,
        });

      case 'html':
        return cards.htmlCard({ html: block.html });

      case 'markdown':
        return cards.markdownCard({ markdown: block.markdown });

      case 'codeblock':
        return cards.codeblockCard({
          code: block.code,
          language: block.language,
          caption: block.caption,
        });

      case 'embed': {
        if (this.skipEnrichment) {
          return cards.embedCard({ url: block.url, html: block.html, embedType: 'rich', metadata: {} });
        }
        const oembed = await this.oembed.fetchOEmbed(block.url);
        return cards.embedCard({
          url: block.url,
          html: block.html || oembed.html,
          embedType: oembed.embedType,
          metadata: oembed.metadata,
        });
      }

      case 'video':
        return cards.videoCard({
          src: block.src,
          caption: block.caption,
          customThumbnailSrc: block.thumbnail,
        });

      case 'audio':
        return cards.audioCard({
          src: block.src,
          title: block.title,
          duration: block.duration,
        });

      case 'file':
        return cards.fileCard({
          src: block.src,
          fileName: block.filename,
          fileTitle: block.title,
          fileCaption: block.caption,
          fileSize: block.file_size,
        });

      case 'product':
        return cards.productCard({
          productImageSrc: block.image,
          productTitle: block.title,
          productDescription: block.description,
          productRatingEnabled: block.rating != null,
          productStarRating: block.rating || 0,
          productButtonEnabled: !!(block.button_text && block.button_url),
          productButton: block.button_text,
          productUrl: block.button_url,
        });

      default: {
        const unknownBlock = block as { type?: string };
        throw new Error(`Unknown content block type: ${unknownBlock.type}`);
      }
    }
  }
}
