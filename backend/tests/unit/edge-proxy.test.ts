import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { edgeProxy } from '../../src/middleware/edge-proxy.js';
import { errorHandler } from '../../src/middleware/error-handler.js';
import type { Config } from '../../src/config/env.js';

const secret = 'test-edge-secret-with-at-least-32-characters';
function fixture(enabled = true) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(
    edgeProxy({ EDGE_PROXY_SECRET: enabled ? secret : undefined } as Config),
  );
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/who', (req, res) => res.json({ ip: req.ip }));
  app.use(errorHandler);
  return app;
}

describe('Authenticated Cloudflare proxy', () => {
  it('blocks direct API requests but allows the Render health check', async () => {
    const app = fixture();
    expect((await request(app).get('/api/health')).status).toBe(200);
    expect((await request(app).get('/api/who')).status).toBe(403);
    expect(
      (await request(app).get('/api/who').set('x-pks-proxy-secret', 'wrong'))
        .status,
    ).toBe(403);
  });
  it('uses only the authenticated client IP, ignoring a forged XFF chain', async () => {
    const response = await request(fixture())
      .get('/api/who')
      .set('x-pks-proxy-secret', secret)
      .set('x-pks-client-ip', '203.0.113.10')
      .set('x-forwarded-for', '198.51.100.99, 198.51.100.1');
    expect(response.status).toBe(200);
    expect(response.body.ip).toBe('203.0.113.10');
  });
  it('rejects malformed proxy IPs even with the correct secret', async () => {
    const response = await request(fixture())
      .get('/api/who')
      .set('x-pks-proxy-secret', secret)
      .set('x-pks-client-ip', 'fake, 203.0.113.10');
    expect(response.status).toBe(400);
  });
  it('preserves local development without an edge secret', async () => {
    expect((await request(fixture(false)).get('/api/who')).status).toBe(200);
  });
});
