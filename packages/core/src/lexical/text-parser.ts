// Parse markdown-like inline formatting into Lexical text nodes
// Supports: **bold**, *italic*, ***bold italic***, `code`, [text](url)

import type { LexicalNode } from '../types.js';

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_CODE = 16;

interface TextNode extends LexicalNode {
  detail: 0;
  format: number;
  mode: 'normal';
  style: '';
  text: string;
  type: 'extended-text';
}

interface LinkNode extends LexicalNode {
  children: TextNode[];
  direction: 'ltr';
  format: '';
  indent: 0;
  type: 'link';
  rel: 'noopener';
  target: null;
  title: '';
  url: string;
}

export function textNode(text: string, format = 0): TextNode {
  return {
    detail: 0,
    format,
    mode: 'normal',
    style: '',
    text,
    type: 'extended-text',
    version: 1,
  };
}

export function linkNode(text: string, url: string, format = 0): LinkNode {
  return {
    children: [textNode(text, format)],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'link',
    version: 1,
    rel: 'noopener',
    target: null,
    title: '',
    url,
  };
}

/**
 * Parse a string with inline markdown formatting into an array of Lexical nodes.
 * Order matters: links first, then ***bold italic***, then **bold**, then *italic*, then `code`.
 */
export function parseInlineText(input: string | undefined): (TextNode | LinkNode)[] {
  if (!input || typeof input !== 'string') return [textNode('')];

  const nodes: (TextNode | LinkNode)[] = [];
  const pattern = /(\[([^\]]+)\]\(([^)]+)\))|\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(textNode(input.slice(lastIndex, match.index)));
    }

    if (match[1]) {
      // Link: [text](url)
      nodes.push(linkNode(match[2]!, match[3]!));
    } else if (match[4]) {
      // Bold+Italic: ***text***
      nodes.push(textNode(match[4], FORMAT_BOLD | FORMAT_ITALIC));
    } else if (match[5]) {
      // Bold: **text**
      nodes.push(textNode(match[5], FORMAT_BOLD));
    } else if (match[6]) {
      // Italic: *text*
      nodes.push(textNode(match[6], FORMAT_ITALIC));
    } else if (match[7]) {
      // Code: `text`
      nodes.push(textNode(match[7], FORMAT_CODE));
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < input.length) {
    nodes.push(textNode(input.slice(lastIndex)));
  }

  if (nodes.length === 0) {
    nodes.push(textNode(input));
  }

  return nodes;
}

export function paragraphNode(text: string): LexicalNode {
  return {
    children: parseInlineText(text),
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'paragraph',
    version: 1,
  };
}

export function headingNode(text: string, level = 2): LexicalNode {
  const tag = `h${Math.min(Math.max(level, 1), 6)}`;
  return {
    children: parseInlineText(text),
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'extended-heading',
    version: 1,
    tag,
  };
}

export function quoteNode(text: string): LexicalNode {
  return {
    children: parseInlineText(text),
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'extended-quote',
    version: 1,
  };
}
