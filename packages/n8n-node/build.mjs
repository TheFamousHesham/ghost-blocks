// Bundles the n8n node and credential files into self-contained CommonJS files
// with zero runtime dependencies (other than n8n-workflow, which is provided
// by the host n8n instance). This is REQUIRED for n8n community-node
// verification — Cloud disallows community nodes with package dependencies.
//
// ghost-blocks, jsonwebtoken, form-data, and any transitive deps are inlined.

import esbuild from 'esbuild';

const common = {
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  external: ['n8n-workflow'],
  legalComments: 'none',
  logLevel: 'info',
};

await Promise.all([
  esbuild.build({
    ...common,
    entryPoints: ['nodes/GhostBlocks/GhostBlocks.node.ts'],
    outfile: 'dist/nodes/GhostBlocks/GhostBlocks.node.js',
  }),
  esbuild.build({
    ...common,
    entryPoints: ['credentials/GhostBlocksApi.credentials.ts'],
    outfile: 'dist/credentials/GhostBlocksApi.credentials.js',
  }),
]);

console.log('✓ Bundled (no external runtime deps)');
