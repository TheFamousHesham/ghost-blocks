// Integration tests against a live Ghost instance.
// Requires GHOST_URL and GHOST_ADMIN_KEY env vars.
// Run with: GHOST_URL=... GHOST_ADMIN_KEY=... npm run test:integration

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GhostPublisher } from '../../src/index.js';

const GHOST_URL = process.env.GHOST_URL;
const GHOST_ADMIN_KEY = process.env.GHOST_ADMIN_KEY;

if (!GHOST_URL || !GHOST_ADMIN_KEY) {
  console.log('Skipping integration tests: GHOST_URL or GHOST_ADMIN_KEY not set');
  process.exit(0);
}

const publisher = new GhostPublisher({ url: GHOST_URL, adminKey: GHOST_ADMIN_KEY });
const TEST_PREFIX = 'ghost-blocks integration test';

test('lists newsletters', async () => {
  const newsletters = await publisher.listNewsletters();
  assert.ok(Array.isArray(newsletters));
  assert.ok(newsletters.length > 0, 'expected at least one newsletter');
});

test('lists tags', async () => {
  const tags = await publisher.listTags();
  assert.ok(Array.isArray(tags));
});

test('full lifecycle: create draft, get, update, delete', async () => {
  // Create
  const created = await publisher.createPost({
    title: `${TEST_PREFIX} - lifecycle`,
    status: 'draft',
    tags: ['ghost-blocks-test'],
    content: [
      { type: 'paragraph', text: 'Hello with **bold** and *italic*.' },
      { type: 'heading', level: 2, text: 'Section' },
      { type: 'divider' },
      { type: 'callout', text: 'Important', emoji: '💡', color: 'blue' },
    ],
  });
  assert.ok(created.id);
  assert.equal(created.status, 'draft');

  // Get
  const fetched = await publisher.getPost(created.id);
  assert.equal(fetched.id, created.id);
  assert.ok(fetched.lexical);
  assert.match(fetched.html, /<strong>bold<\/strong>/);
  assert.match(fetched.html, /<em>italic<\/em>/);
  assert.match(fetched.html, /<h2/);
  assert.match(fetched.html, /<hr/);
  assert.match(fetched.html, /kg-callout-card/);

  // Update
  const updated = await publisher.updatePost(created.id, {
    title: `${TEST_PREFIX} - lifecycle (updated)`,
    content: [{ type: 'paragraph', text: 'Replaced content.' }],
  });
  assert.equal(updated.title, `${TEST_PREFIX} - lifecycle (updated)`);

  // Delete
  await publisher.deletePost(created.id);
});

test('builds Lexical without creating a post', async () => {
  const lexical = await publisher.buildLexical([
    { type: 'paragraph', text: 'preview' },
  ]);
  const parsed = JSON.parse(lexical);
  assert.equal(parsed.root.children[0].type, 'paragraph');
});

test('signup card uses correct internal field names (header/subheader)', async () => {
  // This is the bug we identified during initial development —
  // make sure the library produces the correct Ghost-internal field names.
  const created = await publisher.createPost({
    title: `${TEST_PREFIX} - signup`,
    content: [
      {
        type: 'signup',
        heading: 'Subscribe Now',
        subheading: 'Free updates weekly',
        button_text: 'Join Free',
      },
    ],
  });

  const fetched = await publisher.getPost(created.id);
  assert.match(fetched.html, /Subscribe Now/, 'heading should be rendered');
  assert.match(fetched.html, /Free updates weekly/, 'subheading should be rendered');

  await publisher.deletePost(created.id);
});

test('cleanup any leftover test posts', async () => {
  const { posts } = await publisher.browsePosts({ status: 'draft', limit: 50 });
  const leftover = posts.filter((p: any) => p.title?.startsWith(TEST_PREFIX));
  for (const p of leftover) {
    await publisher.deletePost(p.id);
  }
});
