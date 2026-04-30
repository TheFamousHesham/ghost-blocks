import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LexicalBuilder } from '../src/lexical/builder.js';
import type { ContentBlock } from '../src/types.js';

const builder = new LexicalBuilder({ skipEnrichment: true });

async function buildAndParse(blocks: ContentBlock[]) {
  const json = await builder.build(blocks);
  return JSON.parse(json);
}

test('builds an empty document with default paragraph for empty input', async () => {
  const doc = await buildAndParse([]);
  assert.equal(doc.root.type, 'root');
  assert.equal(doc.root.children.length, 1);
  assert.equal(doc.root.children[0].type, 'paragraph');
});

test('builds a paragraph block', async () => {
  const doc = await buildAndParse([{ type: 'paragraph', text: 'hello' }]);
  assert.equal(doc.root.children[0].type, 'paragraph');
  assert.equal(doc.root.children[0].children[0].text, 'hello');
});

test('builds a heading with default level 2', async () => {
  const doc = await buildAndParse([{ type: 'heading', text: 'Title' }]);
  assert.equal(doc.root.children[0].type, 'extended-heading');
  assert.equal(doc.root.children[0].tag, 'h2');
});

test('builds a heading with custom level', async () => {
  const doc = await buildAndParse([{ type: 'heading', text: 'Sub', level: 3 }]);
  assert.equal(doc.root.children[0].tag, 'h3');
});

test('builds a divider', async () => {
  const doc = await buildAndParse([{ type: 'divider' }]);
  assert.equal(doc.root.children[0].type, 'horizontalrule');
});

test('builds an image card', async () => {
  const doc = await buildAndParse([
    { type: 'image', src: 'https://example.com/x.jpg', alt: 'X', caption: 'caption' },
  ]);
  const node = doc.root.children[0];
  assert.equal(node.type, 'image');
  assert.equal(node.src, 'https://example.com/x.jpg');
  assert.equal(node.alt, 'X');
  assert.equal(node.caption, 'caption');
  assert.equal(node.cardWidth, 'regular');
});

test('image card supports wide and full widths', async () => {
  const wide = await buildAndParse([{ type: 'image', src: 'a', width: 'wide' }]);
  assert.equal(wide.root.children[0].cardWidth, 'wide');
  const full = await buildAndParse([{ type: 'image', src: 'a', width: 'full' }]);
  assert.equal(full.root.children[0].cardWidth, 'full');
});

test('builds a callout card', async () => {
  const doc = await buildAndParse([
    { type: 'callout', text: 'Hi', emoji: '💡', color: 'green' },
  ]);
  const node = doc.root.children[0];
  assert.equal(node.type, 'callout');
  assert.equal(node.calloutText, 'Hi');
  assert.equal(node.calloutEmoji, '💡');
  assert.equal(node.backgroundColor, 'green');
});

test('builds a button card', async () => {
  const doc = await buildAndParse([
    { type: 'button', text: 'Click', url: 'https://x.com', alignment: 'left' },
  ]);
  const node = doc.root.children[0];
  assert.equal(node.type, 'button');
  assert.equal(node.buttonText, 'Click');
  assert.equal(node.buttonUrl, 'https://x.com');
  assert.equal(node.alignment, 'left');
});

test('builds a paywall card', async () => {
  const doc = await buildAndParse([{ type: 'paywall' }]);
  assert.equal(doc.root.children[0].type, 'paywall');
});

test('builds a signup card with the correct internal field names', async () => {
  // Critical: Ghost uses `header`/`subheader` internally, not heading/subheading
  const doc = await buildAndParse([
    {
      type: 'signup',
      heading: 'Subscribe',
      subheading: 'Free updates',
      button_text: 'Join',
      background_color: '#1a1a2e',
      button_color: '#edcf76',
      button_text_color: '#000000',
    },
  ]);
  const node = doc.root.children[0];
  assert.equal(node.type, 'signup');
  assert.equal(node.header, 'Subscribe');
  assert.equal(node.subheader, 'Free updates');
  assert.equal(node.buttonText, 'Join');
  assert.equal(node.backgroundColor, '#1a1a2e');
  assert.equal(node.buttonColor, '#edcf76');
  assert.equal(node.buttonTextColor, '#000000');
});

test('builds a code block', async () => {
  const doc = await buildAndParse([
    { type: 'codeblock', code: 'const x = 1', language: 'javascript', caption: 'demo' },
  ]);
  const node = doc.root.children[0];
  assert.equal(node.type, 'codeblock');
  assert.equal(node.code, 'const x = 1');
  assert.equal(node.language, 'javascript');
});

test('builds quote, html, markdown blocks', async () => {
  const doc = await buildAndParse([
    { type: 'quote', text: 'wisdom' },
    { type: 'html', html: '<div>raw</div>' },
    { type: 'markdown', markdown: '## md' },
  ]);
  assert.equal(doc.root.children[0].type, 'extended-quote');
  assert.equal(doc.root.children[1].type, 'html');
  assert.equal(doc.root.children[1].html, '<div>raw</div>');
  assert.equal(doc.root.children[2].type, 'markdown');
});

test('builds bookmark with skipEnrichment=true and provided metadata', async () => {
  const doc = await buildAndParse([
    {
      type: 'bookmark',
      url: 'https://example.com',
      title: 'Example',
      description: 'desc',
      author: 'Bob',
    },
  ]);
  const node = doc.root.children[0];
  assert.equal(node.type, 'bookmark');
  assert.equal(node.url, 'https://example.com');
  assert.equal(node.metadata.title, 'Example');
  assert.equal(node.metadata.description, 'desc');
});

test('builds embed with skipEnrichment=true', async () => {
  const doc = await buildAndParse([{ type: 'embed', url: 'https://youtube.com/watch?v=x' }]);
  const node = doc.root.children[0];
  assert.equal(node.type, 'embed');
  assert.equal(node.url, 'https://youtube.com/watch?v=x');
});

test('builds a complex multi-block document', async () => {
  const doc = await buildAndParse([
    { type: 'paragraph', text: 'Intro **bold** text.' },
    { type: 'heading', level: 2, text: 'Section' },
    { type: 'image', src: 'x.jpg', alt: 'X' },
    { type: 'divider' },
    { type: 'paywall' },
    { type: 'paragraph', text: 'Behind paywall.' },
  ]);
  assert.equal(doc.root.children.length, 6);
  assert.equal(doc.root.children[4].type, 'paywall');
});

test('throws for unknown block type', async () => {
  await assert.rejects(
    async () => buildAndParse([{ type: 'mystery' } as any]),
    /Unknown content block type/,
  );
});
