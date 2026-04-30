import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseInlineText } from '../src/lexical/text-parser.js';

test('parses plain text into a single text node', () => {
  const nodes = parseInlineText('hello world');
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0]!.type, 'extended-text');
  assert.equal((nodes[0] as any).text, 'hello world');
  assert.equal((nodes[0] as any).format, 0);
});

test('parses **bold** text', () => {
  const nodes = parseInlineText('hello **world**');
  assert.equal(nodes.length, 2);
  assert.equal((nodes[0] as any).text, 'hello ');
  assert.equal((nodes[0] as any).format, 0);
  assert.equal((nodes[1] as any).text, 'world');
  assert.equal((nodes[1] as any).format, 1);
});

test('parses *italic* text', () => {
  const nodes = parseInlineText('hello *world*');
  assert.equal(nodes.length, 2);
  assert.equal((nodes[1] as any).format, 2);
});

test('parses ***bold italic*** text', () => {
  const nodes = parseInlineText('***strong***');
  assert.equal(nodes.length, 1);
  assert.equal((nodes[0] as any).format, 3); // 1 (bold) | 2 (italic)
});

test('parses `code` inline', () => {
  const nodes = parseInlineText('use `npm install`');
  assert.equal(nodes.length, 2);
  assert.equal((nodes[1] as any).format, 16);
  assert.equal((nodes[1] as any).text, 'npm install');
});

test('parses [link](url)', () => {
  const nodes = parseInlineText('see [docs](https://example.com)');
  assert.equal(nodes.length, 2);
  assert.equal((nodes[0] as any).text, 'see ');
  assert.equal(nodes[1]!.type, 'link');
  assert.equal((nodes[1] as any).url, 'https://example.com');
  assert.equal((nodes[1] as any).children[0].text, 'docs');
});

test('handles multiple inline formats in one string', () => {
  const nodes = parseInlineText('**bold** and *italic* and `code` and [link](url)');
  // Plain "and " segments separate each formatted piece
  assert.equal(nodes.length, 7);
  assert.equal((nodes[0] as any).format, 1);  // bold
  assert.equal((nodes[2] as any).format, 2);  // italic
  assert.equal((nodes[4] as any).format, 16); // code
  assert.equal(nodes[6]!.type, 'link');
});

test('handles empty input', () => {
  const nodes = parseInlineText('');
  assert.equal(nodes.length, 1);
  assert.equal((nodes[0] as any).text, '');
});

test('handles undefined input', () => {
  const nodes = parseInlineText(undefined);
  assert.equal(nodes.length, 1);
  assert.equal((nodes[0] as any).text, '');
});
