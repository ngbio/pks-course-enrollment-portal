import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { setupIntegrationTests, app } from '../helpers/integration-context.js';

setupIntegrationTests();

describe('HTTP error responses', () => {
  it('returns unified errors for malformed JSON, large body, wrong content type and origin', async () => {
    const cases = [
      await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{broken'),
      await request(app)
        .post('/api/auth/login')
        .send({ value: 'x'.repeat(33000) }),
      await request(app)
        .post('/api/auth/login')
        .type('form')
        .send({ email: 'test@example.com' }),
      await request(app)
        .post('/api/auth/logout')
        .set('Origin', 'https://evil.example'),
      await request(app)
        .post('/api/auth/logout')
        .set('Sec-Fetch-Site', 'cross-site'),
    ];
    expect(cases.map((r) => r.status)).toEqual([400, 413, 415, 403, 403]);
    for (const r of cases) {
      expect(r.body.error.details).toEqual([]);
      expect(r.body.error.stack).toBeUndefined();
    }
  });
});
