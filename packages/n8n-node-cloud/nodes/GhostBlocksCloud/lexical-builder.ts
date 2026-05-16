// Lexical document builder — pure logic, sandbox-compatible.
// No oEmbed/OpenGraph fetching (those need fs/dns/fetch which are blocked).

import { paragraphNode, headingNode, quoteNode } from './text-parser';
import * as cards from './cards';

export type ContentBlock = Record<string, any> & { type: string };

export function buildLexicalDocument(blocks: ContentBlock[] | undefined): string {
  if (!blocks || blocks.length === 0) {
    return JSON.stringify(wrapRoot([paragraphNode('')]));
  }
  const children: any[] = [];
  for (const block of blocks) {
    const node = buildNode(block);
    if (node) children.push(node);
  }
  if (children.length === 0) children.push(paragraphNode(''));
  return JSON.stringify(wrapRoot(children));
}

function wrapRoot(children: any[]) {
  return {
    root: {
      children,
      direction: 'ltr', format: '', indent: 0,
      type: 'root', version: 1,
    },
  };
}

function buildNode(block: ContentBlock): any | null {
  switch (block.type) {
    case 'paragraph': return paragraphNode(block.text || '');
    case 'heading':   return headingNode(block.text || '', block.level || 2);
    case 'quote':     return quoteNode(block.text || '');

    case 'image': {
      const cw = block.width === 'wide' || block.width === 'full' ? block.width : 'regular';
      return cards.imageCard({
        src: block.src, alt: block.alt, caption: block.caption,
        width: typeof block.width === 'number' ? block.width : 0,
        height: typeof block.height === 'number' ? block.height : 0,
        cardWidth: cw,
      });
    }
    case 'gallery': return cards.galleryCard({ images: block.images });
    case 'divider': return cards.dividerCard();

    case 'button': return cards.buttonCard({
      buttonText: block.text, buttonUrl: block.url, alignment: block.alignment,
    });

    case 'bookmark': return cards.bookmarkCard({
      url: block.url, title: block.title, description: block.description,
      icon: block.icon, thumbnail: block.thumbnail,
      author: block.author, publisher: block.publisher, caption: block.caption,
    });

    case 'callout': return cards.calloutCard({
      calloutEmoji: block.emoji, calloutText: block.text, backgroundColor: block.color,
    });

    case 'toggle': return cards.toggleCard({ heading: block.heading, content: block.content });

    case 'header': return cards.headerCard({
      backgroundImageSrc: block.background_image,
      heading: block.heading, subheading: block.subheading,
      buttonText: block.button_text, buttonUrl: block.button_url,
    });

    case 'email_cta': return cards.emailCtaCard({
      html: block.text || block.html,
      buttonText: block.button_text, buttonUrl: block.button_url,
      segment: block.segment,
    });

    case 'email_content': return cards.emailCard({ html: block.html });

    case 'signup': return cards.signupCard({
      header: block.heading, subheader: block.subheading,
      buttonText: block.button_text, buttonColor: block.button_color,
      buttonTextColor: block.button_text_color,
      backgroundColor: block.background_color, textColor: block.text_color,
      alignment: block.alignment, layout: block.layout,
      backgroundImageSrc: block.background_image,
      disclaimer: block.disclaimer, successMessage: block.success_message,
    });

    case 'paywall': return cards.paywallCard();

    case 'call_to_action': return cards.ctaCard({
      htmlEditor: block.text || block.html,
      buttonText: block.button_text, buttonUrl: block.button_url,
      backgroundColor: block.background_color, layout: block.layout,
      hasSponsorLabel: block.sponsor_label,
    });

    case 'html':      return cards.htmlCard({ html: block.html });
    case 'markdown':  return cards.markdownCard({ markdown: block.markdown });
    case 'codeblock': return cards.codeblockCard({ code: block.code, language: block.language, caption: block.caption });

    case 'embed': return cards.embedCard({ url: block.url, html: block.html });

    case 'video': return cards.videoCard({ src: block.src, caption: block.caption, customThumbnailSrc: block.thumbnail });
    case 'audio': return cards.audioCard({ src: block.src, title: block.title, duration: block.duration });
    case 'file':  return cards.fileCard({
      src: block.src, fileName: block.filename, fileTitle: block.title,
      fileCaption: block.caption, fileSize: block.file_size,
    });

    case 'product': return cards.productCard({
      productImageSrc: block.image, productTitle: block.title,
      productDescription: block.description,
      productRatingEnabled: block.rating != null,
      productStarRating: block.rating || 0,
      productButtonEnabled: !!(block.button_text && block.button_url),
      productButton: block.button_text, productUrl: block.button_url,
    });

    default: throw new Error(`Unknown content block type: ${(block as any).type}`);
  }
}
