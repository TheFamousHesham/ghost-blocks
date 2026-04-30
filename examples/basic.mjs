// examples/basic.mjs — minimal example: create and delete a draft post
//
// Run with:
//   GHOST_URL=... GHOST_ADMIN_KEY=... node examples/basic.mjs

import { GhostPublisher } from 'ghost-blocks';

const publisher = new GhostPublisher({
  url: process.env.GHOST_URL,
  adminKey: process.env.GHOST_ADMIN_KEY,
});

const post = await publisher.createPost({
  title: 'Hello from ghost-blocks',
  status: 'draft',
  content: [
    { type: 'paragraph', text: 'My first post created with **ghost-blocks**.' },
    { type: 'heading', level: 2, text: 'It works' },
    { type: 'paragraph', text: 'No Lexical wrangling required.' },
  ],
});

console.log('Created:', post.url);

// Clean up
await publisher.deletePost(post.id);
console.log('Deleted draft.');
