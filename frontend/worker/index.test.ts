import { afterEach, test, mock } from 'node:test';
import assert from 'node:assert/strict';
import worker from './index.ts';

const env = {
  API_ORIGIN: 'https://pks-api.onrender.com',
  EDGE_PROXY_SECRET: 'a-secret-of-at-least-32-characters-long',
  ASSETS: { fetch: async () => new Response('SPA') },
};
afterEach(() => mock.restoreAll());

test('serves application routes through the assets binding', async () => {
  const response = await worker.fetch(
    new Request('https://portal.test/courses/1'),
    env,
  );
  assert.equal(await response.text(), 'SPA');
});

test('proxies body, query, cookies and original Origin, replacing forged headers', async () => {
  const upstream = mock.method(
    globalThis,
    'fetch',
    async (url: URL, init: RequestInit) => {
      assert.equal(url.href, 'https://pks-api.onrender.com/api/auth/login?x=1');
      const headers = new Headers(init.headers);
      assert.equal(headers.get('origin'), 'https://portal.test');
      assert.equal(headers.get('cookie'), 'pks_session=old');
      assert.equal(headers.get('x-pks-proxy-secret'), env.EDGE_PROXY_SECRET);
      assert.equal(headers.get('x-pks-client-ip'), '203.0.113.8');
      assert.equal(headers.get('x-forwarded-for'), null);
      assert.equal(init.redirect, 'manual');
      assert.equal(
        await new Response(init.body).text(),
        '{"email":"student@test.com"}',
      );
      return new Response('{"data":{}}', {
        headers: {
          'Set-Cookie':
            'pks_session=new; HttpOnly; Secure; SameSite=Lax; Path=/api',
        },
      });
    },
  );
  const response = await worker.fetch(
    new Request('https://portal.test/api/auth/login?x=1', {
      method: 'POST',
      headers: {
        origin: 'https://portal.test',
        cookie: 'pks_session=old',
        'cf-connecting-ip': '203.0.113.8',
        'x-pks-client-ip': 'fake',
        'x-pks-proxy-secret': 'fake',
        'x-forwarded-for': 'fake',
      },
      body: '{"email":"student@test.com"}',
    }),
    env,
  );
  assert.equal(upstream.mock.callCount(), 1);
  assert.match(
    response.headers.get('set-cookie')!,
    /HttpOnly; Secure; SameSite=Lax/,
  );
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('preserves 204 logout and cookie deletion', async () => {
  mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(null, {
        status: 204,
        headers: { 'Set-Cookie': 'pks_session=; Max-Age=0; Path=/api' },
      }),
  );
  const response = await worker.fetch(
    new Request('https://portal.test/api/auth/logout', { method: 'POST' }),
    env,
  );
  assert.equal(response.status, 204);
  assert.match(response.headers.get('set-cookie')!, /Max-Age=0/);
});

test('fails closed on missing config and does not follow backend redirects', async () => {
  const request = new Request('https://portal.test/api/courses');
  assert.equal(
    (await worker.fetch(request, { ...env, EDGE_PROXY_SECRET: '' })).status,
    503,
  );
  mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(null, {
        status: 302,
        headers: { Location: 'https://other.test' },
      }),
  );
  assert.equal((await worker.fetch(request, env)).status, 502);
});

test('network failures return a safe JSON error', async () => {
  mock.method(globalThis, 'fetch', async () => {
    throw new Error('private upstream details');
  });
  const response = await worker.fetch(
    new Request('https://portal.test/api/courses'),
    env,
  );
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error.code, 'API_UNAVAILABLE');
});
