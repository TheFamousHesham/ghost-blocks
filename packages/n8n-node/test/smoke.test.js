// Smoke test: load the compiled node + credentials the way n8n does and
// verify the descriptors are well-formed.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const distRoot = path.resolve(__dirname, '../dist');

test('package.json n8n config points to existing files', () => {
  const pkg = require('../package.json');
  assert.ok(pkg.n8n, 'n8n field present in package.json');
  assert.equal(pkg.n8n.n8nNodesApiVersion, 1);

  for (const credPath of pkg.n8n.credentials) {
    const abs = path.resolve(__dirname, '..', credPath);
    assert.ok(fs.existsSync(abs), `Credential file exists: ${credPath}`);
  }
  for (const nodePath of pkg.n8n.nodes) {
    const abs = path.resolve(__dirname, '..', nodePath);
    assert.ok(fs.existsSync(abs), `Node file exists: ${nodePath}`);
  }
});

test('GhostBlocksApi credential class exports a valid descriptor', () => {
  const { GhostBlocksApi } = require(path.join(distRoot, 'credentials/GhostBlocksApi.credentials.js'));
  assert.ok(GhostBlocksApi, 'class is exported');

  const instance = new GhostBlocksApi();
  assert.equal(instance.name, 'ghostBlocksApi');
  assert.equal(instance.displayName, 'Ghost Blocks API');
  assert.ok(Array.isArray(instance.properties));
  assert.ok(instance.properties.length >= 3, 'has at least 3 properties (url, adminKey, apiVersion)');

  const propNames = instance.properties.map((p) => p.name);
  assert.ok(propNames.includes('url'));
  assert.ok(propNames.includes('adminKey'));
  assert.ok(propNames.includes('apiVersion'));
});

test('GhostBlocks node class exports a valid descriptor', () => {
  const { GhostBlocks } = require(path.join(distRoot, 'nodes/GhostBlocks/GhostBlocks.node.js'));
  assert.ok(GhostBlocks, 'class is exported');

  const instance = new GhostBlocks();
  const desc = instance.description;
  assert.equal(desc.name, 'ghostBlocks');
  assert.equal(desc.displayName, 'Ghost Blocks');
  assert.ok(Array.isArray(desc.properties));
  assert.ok(desc.properties.length >= 5, 'has multiple property definitions');

  // Verify resource selector
  const resourceProp = desc.properties.find((p) => p.name === 'resource');
  assert.ok(resourceProp, 'has resource selector');
  const resourceValues = resourceProp.options.map((o) => o.value);
  assert.deepEqual(resourceValues.sort(), ['health', 'newsletter', 'post', 'tag']);

  // Verify credentials reference is correct
  assert.deepEqual(
    desc.credentials,
    [{ name: 'ghostBlocksApi', required: true }],
  );

  // Verify execute method exists
  assert.equal(typeof instance.execute, 'function');
});

test('node has Post operations: create, update, get, list, delete', () => {
  const { GhostBlocks } = require(path.join(distRoot, 'nodes/GhostBlocks/GhostBlocks.node.js'));
  const desc = new GhostBlocks().description;

  const postOpProp = desc.properties.find(
    (p) =>
      p.name === 'operation' &&
      p.displayOptions?.show?.resource?.includes('post'),
  );
  assert.ok(postOpProp, 'post operation selector exists');

  const ops = postOpProp.options.map((o) => o.value).sort();
  assert.deepEqual(ops, ['create', 'delete', 'get', 'list', 'update']);
});

test('icon SVG file is bundled in dist', () => {
  const iconPath = path.join(distRoot, 'nodes/GhostBlocks/ghost.svg');
  assert.ok(fs.existsSync(iconPath), 'icon SVG exists in dist');
  const content = fs.readFileSync(iconPath, 'utf8');
  assert.match(content, /<svg/);
});
