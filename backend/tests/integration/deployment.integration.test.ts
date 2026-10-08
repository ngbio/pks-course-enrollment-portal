import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import {
  setupIntegrationTests,
  config,
  db,
  studentId,
  password,
} from '../helpers/integration-context.js';

setupIntegrationTests();
const secret = 'deployment-test-secret-with-at-least-32-characters';
const origin = 'https://portal.example.com';
function deployedApp() {
  return createApp(db, {
    ...config,
    NODE_ENV: 'production',
    EDGE_PROXY_SECRET: secret,
    TRUST_PROXY_HOPS: 1,
    ALLOWED_ORIGINS: [origin],
    LOGIN_IP_LIMIT: 1,
  });
}
const headers = {
  'x-pks-proxy-secret': secret,
  'x-pks-client-ip': '203.0.113.11',
  Origin: origin,
};

describe('Production deployment contract', () => {
  it('sets a secure host-only cookie, restores session and clears logout cookie', async () => {
    const app = deployedApp();
    const student = await db.user.findUniqueOrThrow({
      where: { id: studentId },
    });
    const login = await request(app)
      .post('/api/auth/login')
      .set(headers)
      .send({ email: student.email, password });
    expect(login.status).toBe(200);
    const setCookie = String(login.headers['set-cookie']);
    for (const flag of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/api']) {
      expect(setCookie).toContain(flag);
    }
    expect(setCookie).not.toContain('Domain=');
    const cookie = setCookie.split(';')[0]!;
    const me = await request(app)
      .get('/api/auth/me')
      .set(headers)
      .set('Cookie', cookie);
    expect(me.status).toBe(200);
    expect(me.body.data.id).toBe(studentId);
    const logout = await request(app).post('/api/auth/logout').set(headers);
    expect(logout.status).toBe(204);
    expect(String(logout.headers['set-cookie'])).toContain(
      'Expires=Thu, 01 Jan 1970',
    );
  });
  it('keeps IP rate limits separate and ignores forged forwarding chains', async () => {
    const app = deployedApp();
    const attempt = (ip: string) =>
      request(app)
        .post('/api/auth/login')
        .set({
          ...headers,
          'x-pks-client-ip': ip,
          'x-forwarded-for': '198.51.100.1',
        })
        .send({ email: 'nobody@example.com', password });
    expect((await attempt('203.0.113.11')).status).toBe(401);
    expect((await attempt('203.0.113.11')).status).toBe(429);
    expect((await attempt('203.0.113.12')).status).toBe(401);
  });
  it('blocks direct requests and unapproved browser origins', async () => {
    const app = deployedApp();
    expect((await request(app).get('/api/courses')).status).toBe(403);
    expect((await request(app).get('/api/health')).status).toBe(200);
    const response = await request(app)
      .post('/api/auth/logout')
      .set({ ...headers, Origin: 'https://attacker.example.com' });
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ORIGIN_NOT_ALLOWED');
  });
});
