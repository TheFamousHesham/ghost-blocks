import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectOEmbedProvider } from '../src/enrichers/oembed.js';

test('detects YouTube watch URLs', () => {
  const p = detectOEmbedProvider('https://www.youtube.com/watch?v=abc');
  assert.ok(p);
  assert.equal(p?.type, 'video');
});

test('detects youtu.be short URLs', () => {
  const p = detectOEmbedProvider('https://youtu.be/abc');
  assert.ok(p);
});

test('detects Vimeo URLs', () => {
  const p = detectOEmbedProvider('https://vimeo.com/123456');
  assert.ok(p);
  assert.equal(p?.type, 'video');
});

test('detects Twitter and X URLs', () => {
  assert.ok(detectOEmbedProvider('https://twitter.com/user/status/123'));
  assert.ok(detectOEmbedProvider('https://x.com/user/status/123'));
});

test('does NOT match arbitrary URLs containing provider names', () => {
  // Critical: regex is anchored with ^https?:// to prevent SSRF bypass
  // via paths like /youtube.com/watch
  assert.equal(detectOEmbedProvider('http://internal-host/youtube.com/watch?v=x'), null);
  assert.equal(detectOEmbedProvider('http://evil.com?youtube.com/watch'), null);
});

test('returns null for non-supported URLs', () => {
  assert.equal(detectOEmbedProvider('https://example.com/page'), null);
  assert.equal(detectOEmbedProvider('not a url'), null);
});
