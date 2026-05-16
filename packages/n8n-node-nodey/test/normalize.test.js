// Unit tests for the payload normalizer. Runs against the compiled output so
// we exercise the same code n8n will load.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { normalize } = require(path.resolve(__dirname, '../dist/nodes/NodeyNfcTrigger/normalize-payload.js'));

test('iOS shape: extracts trigger_name, trigger_type, event, source', () => {
  const body = {
    trigger_name: 'Front Door Tag',
    trigger_type: 'nfc',
    event: 'tap',
    timestamp: '2026-05-16T12:30:45.123Z',
    source: 'Nodey',
  };

  const out = normalize(body, true);

  assert.equal(out.platform, 'ios');
  assert.equal(out.triggerName, 'Front Door Tag');
  assert.equal(out.triggerType, 'nfc');
  assert.equal(out.event, 'tap');
  assert.equal(out.source, 'Nodey');
  assert.equal(out.timestamp, '2026-05-16T12:30:45.123Z');
  assert.equal(out.triggerId, null);
  assert.equal(out.customData, null);
  assert.deepEqual(out.raw, body);
});

test('Android shape: parses customData JSON string', () => {
  const body = {
    triggerId: '8b3f9a7c-2d1e-4b5a-9c8f-6a3d1e7b2f4c',
    timestamp: '2026-05-16T12:30:45.123Z',
    customData: '{"door":"front","action":"unlock"}',
  };

  const out = normalize(body, true);

  assert.equal(out.platform, 'android');
  assert.equal(out.triggerId, '8b3f9a7c-2d1e-4b5a-9c8f-6a3d1e7b2f4c');
  assert.deepEqual(out.customData, { door: 'front', action: 'unlock' });
  assert.equal(out.triggerName, null);
  assert.equal(out.triggerType, 'nfc'); // default
  assert.equal(out.event, 'tap'); // default
});

test('Android shape: parseCustomData=false keeps customData as string', () => {
  const body = {
    triggerId: 'abc',
    timestamp: '2026-05-16T12:30:45.123Z',
    customData: '{"key":"value"}',
  };

  const out = normalize(body, false);

  assert.equal(out.platform, 'android');
  assert.equal(out.customData, '{"key":"value"}');
});

test('Android invalid-JSON fallback: customPayload string passes through', () => {
  const body = {
    triggerId: 'abc',
    timestamp: '2026-05-16T12:30:45.123Z',
    customPayload: 'not valid json',
  };

  const out = normalize(body, true);

  assert.equal(out.platform, 'android');
  assert.equal(out.customData, 'not valid json');
});

test('Android customData with malformed JSON falls back to string', () => {
  const body = {
    triggerId: 'abc',
    timestamp: '2026-05-16T12:30:45.123Z',
    customData: '{not valid json',
  };

  const out = normalize(body, true);

  assert.equal(out.customData, '{not valid json');
});

test('Unknown shape: platform is "unknown", defaults applied', () => {
  const body = { hello: 'world' };
  const out = normalize(body, true);

  assert.equal(out.platform, 'unknown');
  assert.equal(out.triggerName, null);
  assert.equal(out.triggerType, 'nfc');
  assert.equal(out.event, 'tap');
  assert.equal(out.source, 'Nodey');
  assert.equal(out.triggerId, null);
  assert.equal(out.customData, null);
  assert.ok(typeof out.timestamp === 'string' && out.timestamp.length > 0);
});

test('Forward-compat: customData already an object passes through', () => {
  const body = {
    triggerId: 'abc',
    timestamp: '2026-05-16T12:30:45.123Z',
    customData: { door: 'front' }, // future Nodey contract cleanup
  };

  const out = normalize(body, true);

  assert.deepEqual(out.customData, { door: 'front' });
});

test('raw is always preserved on output', () => {
  const body = {
    trigger_name: 'x',
    extra: 'should-survive',
    nested: { deep: { value: 1 } },
  };
  const out = normalize(body, true);
  assert.deepEqual(out.raw, body);
});
