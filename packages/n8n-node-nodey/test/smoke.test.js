// Smoke tests: load the compiled node + credentials the way n8n does and
// verify the descriptors are well-formed for a webhook trigger.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const distRoot = path.resolve(__dirname, '../dist');

test('package.json n8n config points to existing files', () => {
  const pkg = require('../package.json');
  assert.ok(pkg.n8n, 'n8n field present');
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

test('package.json has keyword "n8n-community-node-package"', () => {
  const pkg = require('../package.json');
  assert.ok(
    pkg.keywords.includes('n8n-community-node-package'),
    'required for n8n verification',
  );
});

test('NodeyApi credential class exports a valid descriptor', () => {
  const { NodeyApi } = require(path.join(distRoot, 'credentials/NodeyApi.credentials.js'));
  assert.ok(NodeyApi, 'class is exported');

  const instance = new NodeyApi();
  assert.equal(instance.name, 'nodeyApi');
  assert.equal(instance.displayName, 'Nodey API');
  assert.ok(Array.isArray(instance.properties));

  const propNames = instance.properties.map((p) => p.name);
  assert.ok(propNames.includes('webhookSecret'));
  assert.ok(propNames.includes('allowedTagUids'));
});

test('NodeyNfcTrigger node class exports a valid descriptor', () => {
  const { NodeyNfcTrigger } = require(
    path.join(distRoot, 'nodes/NodeyNfcTrigger/NodeyNfcTrigger.node.js'),
  );
  assert.ok(NodeyNfcTrigger, 'class is exported');

  const instance = new NodeyNfcTrigger();
  const desc = instance.description;
  assert.equal(desc.name, 'nodeyNfcTrigger');
  assert.equal(desc.displayName, 'Nodey NFC Trigger');
  assert.ok(Array.isArray(desc.group) && desc.group.includes('trigger'));
  assert.equal(desc.version, 1);
});

test('node is wired as a webhook trigger (no inputs, has webhook descriptor)', () => {
  const { NodeyNfcTrigger } = require(
    path.join(distRoot, 'nodes/NodeyNfcTrigger/NodeyNfcTrigger.node.js'),
  );
  const desc = new NodeyNfcTrigger().description;

  assert.deepEqual(desc.inputs, []);
  assert.deepEqual(desc.outputs, ['main']);

  assert.ok(Array.isArray(desc.webhooks) && desc.webhooks.length === 1);
  const wh = desc.webhooks[0];
  assert.equal(wh.name, 'default');
  assert.equal(wh.httpMethod, 'POST');
  assert.equal(wh.responseMode, 'onReceived');
  assert.equal(wh.path, 'nodey-nfc');
});

test('node has webhook handler method (not execute)', () => {
  const { NodeyNfcTrigger } = require(
    path.join(distRoot, 'nodes/NodeyNfcTrigger/NodeyNfcTrigger.node.js'),
  );
  const instance = new NodeyNfcTrigger();
  assert.equal(typeof instance.webhook, 'function', 'webhook method exists');
  assert.equal(typeof instance.execute, 'undefined', 'no execute method on a trigger');
});

test('node references nodeyApi credentials, optional', () => {
  const { NodeyNfcTrigger } = require(
    path.join(distRoot, 'nodes/NodeyNfcTrigger/NodeyNfcTrigger.node.js'),
  );
  const desc = new NodeyNfcTrigger().description;
  assert.deepEqual(desc.credentials, [{ name: 'nodeyApi', required: false }]);
});

test('node exposes outputFormat selector with normalized + raw', () => {
  const { NodeyNfcTrigger } = require(
    path.join(distRoot, 'nodes/NodeyNfcTrigger/NodeyNfcTrigger.node.js'),
  );
  const desc = new NodeyNfcTrigger().description;
  const fmt = desc.properties.find((p) => p.name === 'outputFormat');
  assert.ok(fmt, 'outputFormat property exists');
  const values = fmt.options.map((o) => o.value).sort();
  assert.deepEqual(values, ['normalized', 'raw']);
});

test('icon SVG file is bundled in dist', () => {
  const iconPath = path.join(distRoot, 'nodes/NodeyNfcTrigger/nodey.svg');
  assert.ok(fs.existsSync(iconPath), 'icon SVG exists in dist');
  const content = fs.readFileSync(iconPath, 'utf8');
  assert.match(content, /<svg/);
});

test('verify-signature: valid sha256 signature passes', () => {
  const { verifySignature } = require(
    path.join(distRoot, 'nodes/NodeyNfcTrigger/verify-signature.js'),
  );
  const { createHmac } = require('node:crypto');
  const secret = 'shh';
  const body = '{"triggerId":"abc"}';
  const sig = createHmac('sha256', secret).update(body).digest('hex');

  assert.equal(
    verifySignature({ rawBody: body, secret, signatureHeader: sig }),
    true,
  );
  assert.equal(
    verifySignature({ rawBody: body, secret, signatureHeader: `sha256=${sig}` }),
    true,
  );
});

test('verify-signature: tampered body fails', () => {
  const { verifySignature } = require(
    path.join(distRoot, 'nodes/NodeyNfcTrigger/verify-signature.js'),
  );
  const { createHmac } = require('node:crypto');
  const secret = 'shh';
  const sig = createHmac('sha256', secret).update('{"a":1}').digest('hex');

  assert.equal(
    verifySignature({ rawBody: '{"a":2}', secret, signatureHeader: sig }),
    false,
  );
});

test('verify-signature: missing header or secret is false', () => {
  const { verifySignature } = require(
    path.join(distRoot, 'nodes/NodeyNfcTrigger/verify-signature.js'),
  );
  assert.equal(
    verifySignature({ rawBody: 'x', secret: '', signatureHeader: 'abc' }),
    false,
  );
  assert.equal(
    verifySignature({ rawBody: 'x', secret: 'shh', signatureHeader: undefined }),
    false,
  );
});
