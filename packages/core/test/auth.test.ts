import { test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { GhostAuth } from '../src/auth.js';

const FAKE_KEY = 'abc123:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

test('generates a valid JWT with the right header and claims', () => {
  const auth = new GhostAuth(FAKE_KEY);
  const token = auth.generateToken();

  const decoded = jwt.decode(token, { complete: true })!;
  assert.equal(decoded.header.alg, 'HS256');
  assert.equal(decoded.header.typ, 'JWT');
  assert.equal((decoded.header as any).kid, 'abc123');

  const payload = decoded.payload as any;
  assert.equal(payload.aud, '/admin/');
  assert.ok(payload.iat);
  assert.equal(payload.exp - payload.iat, 300);
});

test('verifies signature with the hex-decoded secret', () => {
  const auth = new GhostAuth(FAKE_KEY);
  const token = auth.generateToken();
  const secret = Buffer.from(FAKE_KEY.split(':')[1]!, 'hex');

  // Should verify without throwing
  const verified = jwt.verify(token, secret, { audience: '/admin/' });
  assert.ok(verified);
});

test('throws on malformed admin key', () => {
  assert.throws(() => new GhostAuth('not-a-valid-key'), /format/);
  assert.throws(() => new GhostAuth(':missing-id'), /format/);
  assert.throws(() => new GhostAuth('id-only:'), /format/);
});

test('getHeaders includes Authorization, Accept-Version, Content-Type', () => {
  const auth = new GhostAuth(FAKE_KEY);
  const headers = auth.getHeaders();
  assert.match(headers.Authorization, /^Ghost ey/);
  assert.equal(headers['Accept-Version'], 'v5.0');
  assert.equal(headers['Content-Type'], 'application/json');
});
