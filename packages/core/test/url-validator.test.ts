import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UrlValidator } from '../src/url-validator.js';

test('blocks loopback IPs', async () => {
  const v = new UrlValidator();
  await assert.rejects(() => v.validate('http://127.0.0.1/'), /Blocked internal IP/);
});

test('blocks RFC1918 ranges', async () => {
  const v = new UrlValidator();
  await assert.rejects(() => v.validate('http://10.0.0.1/'), /Blocked internal IP/);
  await assert.rejects(() => v.validate('http://192.168.1.1/'), /Blocked internal IP/);
  await assert.rejects(() => v.validate('http://172.16.0.1/'), /Blocked internal IP/);
});

test('blocks AWS/GCP metadata IP', async () => {
  const v = new UrlValidator();
  await assert.rejects(() => v.validate('http://169.254.169.254/'), /Blocked internal IP/);
});

test('blocks localhost hostname', async () => {
  const v = new UrlValidator();
  await assert.rejects(() => v.validate('http://localhost/'), /Blocked internal hostname/);
});

test('blocks extra hostnames passed in options', async () => {
  const v = new UrlValidator({ extraBlockedHostnames: ['ghost-mysql', 'redis'] });
  await assert.rejects(() => v.validate('http://ghost-mysql:3306/'), /Blocked internal hostname/);
  await assert.rejects(() => v.validate('http://redis:6379/'), /Blocked internal hostname/);
});

test('blocks non-HTTP schemes', async () => {
  const v = new UrlValidator({ skipDnsLookup: true });
  await assert.rejects(() => v.validate('file:///etc/passwd'), /Blocked URL scheme/);
  await assert.rejects(() => v.validate('ftp://example.com/'), /Blocked URL scheme/);
});

test('rejects malformed URLs', async () => {
  const v = new UrlValidator({ skipDnsLookup: true });
  await assert.rejects(() => v.validate('not a url'), /Invalid URL/);
});

test('allows public HTTP/HTTPS URLs (skipping DNS)', async () => {
  const v = new UrlValidator({ skipDnsLookup: true });
  const result = await v.validate('https://example.com/page');
  assert.equal(result.protocol, 'https:');
  assert.equal(result.hostname, 'example.com');
});
