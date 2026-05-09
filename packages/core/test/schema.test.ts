import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAiPromptTemplate, getContentBlocksJsonSchema } from '../src/schema.js';

test('getAiPromptTemplate returns the markdown system prompt', () => {
  const prompt = getAiPromptTemplate();
  assert.equal(typeof prompt, 'string');
  assert.match(prompt, /Ghost Blocks/, 'mentions Ghost Blocks');
  assert.match(prompt, /paragraph/, 'documents paragraph block');
  assert.match(prompt, /signup/, 'documents signup block');
  assert.match(prompt, /paywall/, 'documents paywall block');
});

test('getContentBlocksJsonSchema returns a valid JSON Schema object', () => {
  const schema = getContentBlocksJsonSchema() as any;
  assert.equal(typeof schema, 'object');
  assert.equal(schema.$schema, 'http://json-schema.org/draft-07/schema#');
  assert.equal(schema.type, 'object');
  assert.ok(schema.properties.blocks, 'has blocks property');
  assert.ok(schema.definitions.ParagraphBlock, 'has ParagraphBlock definition');
  assert.ok(schema.definitions.PaywallBlock, 'has PaywallBlock definition');
  assert.ok(schema.definitions.SignupBlock, 'has SignupBlock definition');
});

test('schema covers all major block types', () => {
  const schema = getContentBlocksJsonSchema() as any;
  const requiredBlockTypes = [
    'ParagraphBlock', 'HeadingBlock', 'QuoteBlock', 'ImageBlock',
    'GalleryBlock', 'DividerBlock', 'ButtonBlock', 'BookmarkBlock',
    'CalloutBlock', 'ToggleBlock', 'HeaderBlock', 'SignupBlock',
    'PaywallBlock', 'CallToActionBlock', 'HtmlBlock', 'MarkdownBlock',
    'CodeblockBlock', 'EmbedBlock', 'VideoBlock', 'AudioBlock',
    'FileBlock', 'ProductBlock', 'EmailContentBlock', 'EmailCtaBlock',
  ];
  for (const blockType of requiredBlockTypes) {
    assert.ok(schema.definitions[blockType], `schema includes ${blockType}`);
  }
});
