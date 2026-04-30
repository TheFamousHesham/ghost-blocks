// examples/rich-content.mjs — comprehensive example showing many block types

import { GhostPublisher } from 'ghost-blocks';

const publisher = new GhostPublisher({
  url: process.env.GHOST_URL,
  adminKey: process.env.GHOST_ADMIN_KEY,
});

const post = await publisher.createPost({
  title: 'Demo: All the Things',
  slug: 'ghost-blocks-demo',
  status: 'draft',
  excerpt: 'A demonstration of every content block type.',
  tags: ['demo', '#internal'],
  feature_image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200',
  feature_image_alt: 'Code on screen',
  content: [
    { type: 'paragraph', text: 'This post shows **bold**, *italic*, ***bold italic***, `code`, and [links](https://ghost.org).' },
    { type: 'heading', level: 2, text: 'Headings' },
    { type: 'paragraph', text: 'You can use level 1-6.' },
    { type: 'heading', level: 3, text: 'Subheading' },

    { type: 'callout', text: 'Pro tip: callouts work great for highlighting key info.', emoji: '💡', color: 'blue' },

    { type: 'image', src: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800', alt: 'Code', caption: 'Photo from Unsplash' },

    { type: 'divider' },

    { type: 'quote', text: 'Premature optimization is the root of all evil. — Donald Knuth' },

    { type: 'codeblock', code: 'const x = await fetch(url);', language: 'javascript', caption: 'A code example' },

    { type: 'button', text: 'Try it yourself', url: 'https://github.com/heshamfm/ghost-blocks', alignment: 'center' },

    { type: 'paywall' },

    { type: 'paragraph', text: 'Below the paywall: only paid members see this section.' },

    { type: 'signup', heading: 'Subscribe for more', subheading: 'No spam, ever.', button_text: 'Join Free' },
  ],
  seo: {
    meta_title: 'Demo Post | ghost-blocks',
    meta_description: 'A working demonstration of ghost-blocks rendering all major block types.',
  },
});

console.log('Created post:', post.url);
console.log('Post ID:', post.id);
console.log('Open in Ghost Admin to review, or call publisher.deletePost(id) to clean up.');
